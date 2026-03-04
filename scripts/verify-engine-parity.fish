#!/usr/bin/env fish

set -l ROOT (cd (dirname (status -f)); and cd ..; and pwd)
set -l ENGINE_DIR "$ROOT/engine-wasm/engine"
set -l NODE_WRAP_DIR /tmp/wap-node-wrap
set -l NODE_WRAP "$NODE_WRAP_DIR/node"
set -l REAL_NODE (command -s node)
set -l WASM_LOG /tmp/wap-engine-parity-wasm.log

function run_step
    set -l label $argv[1]
    set -e argv[1]
    echo ""
    echo "==> $label"
    echo "CMD: $argv"
    eval $argv
    set -l rc $status
    if test $rc -ne 0
        echo "FAIL: $label (exit $rc)"
        exit $rc
    end
    echo "PASS: $label"
end

echo "Root: $ROOT"
echo "Engine dir: $ENGINE_DIR"

if not test -d "$ENGINE_DIR"
    echo "FAIL: engine directory missing: $ENGINE_DIR"
    exit 1
end

if test -z "$REAL_NODE"
    echo "FAIL: could not locate node binary on PATH"
    exit 1
end

mkdir -p $NODE_WRAP_DIR
printf '%s\n' '#!/usr/bin/env bash' "exec \"$REAL_NODE\" --experimental-wasm-reftypes \"\$@\"" > $NODE_WRAP
chmod +x $NODE_WRAP

run_step "Engine cargo test" "cd $ENGINE_DIR; cargo test"
run_step "Engine clippy -D warnings" "cd $ENGINE_DIR; cargo clippy --all-targets --all-features -- -D warnings"

echo ""
echo "==> WASM parity lane (adaptive)"
echo "Attempt 1: wasm-pack test --node"
cd $ENGINE_DIR
wasm-pack test --node 2>&1 | tee $WASM_LOG
set -l wasm_rc $status

if test $wasm_rc -ne 0
    if $REAL_NODE --experimental-wasm-reftypes -e 'process.exit(0)' >/dev/null 2>&1
        echo ""
        echo "Attempt 2: node wrapper with --experimental-wasm-reftypes"
        env PATH="$NODE_WRAP_DIR:$PATH" wasm-pack test --node 2>&1 | tee $WASM_LOG
        set wasm_rc $status
    else
        echo "Skipping node reftypes wrapper attempt: node does not accept --experimental-wasm-reftypes"
    end
end

if test $wasm_rc -ne 0
    echo ""
    echo "Attempt 3: wasm-pack test --headless --chrome"
    wasm-pack test --headless --chrome 2>&1 | tee $WASM_LOG
    set wasm_rc $status
end

if test $wasm_rc -ne 0
    echo "FAIL: all wasm parity lanes failed. Last log: $WASM_LOG"
    exit $wasm_rc
end
echo "PASS: WASM parity lane"
cd $ROOT

run_step "Browser contract codegen drift check" "cd $ROOT; pnpm --dir browser run contracts:check"
run_step "Worklist drift" "cd $ROOT; node scripts/check-worklist-drift.mjs"

echo ""
echo "All engine parity verification checks passed."
