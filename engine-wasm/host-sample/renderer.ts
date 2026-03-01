import init, { WmlEngine } from '../pkg/wavenav_engine.js';
import type { DrawCmd, EngineTraceEntry, ScriptExecutionOutcome } from '../contracts/wml-engine';

const lineHeight = 16;
const charWidth = 8;
const DEFAULT_BASE_URL = 'http://local.test/deck.wml';
const DEFAULT_CONTENT_TYPE = 'text/vnd.wap.wml';
type KeyName = 'up' | 'down' | 'enter';

export interface EngineSnapshot {
  activeCardId: string;
  focusedLinkIndex: number;
  baseUrl: string;
  contentType: string;
  externalNavigationIntent?: string;
  lastScriptExecutionOk?: boolean;
  lastScriptExecutionTrap?: string;
}

export interface EngineHost {
  loadDeck(xml: string): void;
  pressKey(key: KeyName): void;
  snapshot(): EngineSnapshot;
  clearExternalNavigationIntent(): void;
  executeScriptUnit(bytes: Uint8Array): ScriptExecutionOutcome;
  registerScriptUnit(src: string, bytes: Uint8Array): void;
  clearScriptUnits(): void;
  registerScriptEntryPoint(src: string, functionName: string, entryPc: number): void;
  clearScriptEntryPoints(): void;
  executeScriptRef(src: string): ScriptExecutionOutcome;
  executeScriptRefFunction(src: string, functionName: string): ScriptExecutionOutcome;
  executeScriptRefCall(
    src: string,
    functionName: string,
    args: Array<boolean | number | string | { invalid: true }>
  ): ScriptExecutionOutcome;
  lastScriptExecutionTrap(): string | undefined;
  lastScriptExecutionOk(): boolean | undefined;
  traceEntries(): EngineTraceEntry[];
  clearTraceEntries(): void;
  render(): void;
  getEngine(): WmlEngine;
}

export async function bootWmlEngine(canvas: HTMLCanvasElement, xml: string): Promise<EngineHost> {
  await init();

  const engine = new WmlEngine();
  engine.setViewportCols(20);
  registerBuiltInScriptUnits(engine);
  engine.loadDeckContext(xml, DEFAULT_BASE_URL, DEFAULT_CONTENT_TYPE);

  function paint() {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '14px "IBM Plex Mono", monospace';
    ctx.textBaseline = 'top';

    const renderList = engine.render() as { draw: DrawCmd[] };

    for (const cmd of renderList.draw) {
      const x = cmd.x * charWidth;
      const y = cmd.y * lineHeight;

      if (cmd.type === 'text') {
        ctx.fillStyle = '#111';
        ctx.fillText(cmd.text, x, y);
        continue;
      }

      if (cmd.type === 'link') {
        if (cmd.focused) {
          ctx.fillStyle = '#c8ddff';
          ctx.fillRect(0, y - 1, canvas.width, lineHeight + 2);
        }

        ctx.fillStyle = cmd.focused ? '#10274d' : '#0b3d91';
        ctx.fillText(cmd.text, x, y);
      }
    }
  }

  paint();

  return {
    loadDeck(nextXml: string) {
      engine.loadDeckContext(nextXml, DEFAULT_BASE_URL, DEFAULT_CONTENT_TYPE);
      registerBuiltInScriptUnits(engine);
      paint();
    },
    pressKey(key: KeyName) {
      engine.handleKey(key);
      paint();
    },
    snapshot() {
      return {
        activeCardId: engine.activeCardId(),
        focusedLinkIndex: engine.focusedLinkIndex(),
        baseUrl: engine.baseUrl(),
        contentType: engine.contentType(),
        externalNavigationIntent: engine.externalNavigationIntent(),
        lastScriptExecutionOk: engine.lastScriptExecutionOk(),
        lastScriptExecutionTrap: engine.lastScriptExecutionTrap()
      };
    },
    clearExternalNavigationIntent() {
      engine.clearExternalNavigationIntent();
    },
    executeScriptUnit(bytes: Uint8Array) {
      return engine.executeScriptUnit(bytes) as ScriptExecutionOutcome;
    },
    registerScriptUnit(src: string, bytes: Uint8Array) {
      engine.registerScriptUnit(src, bytes);
    },
    clearScriptUnits() {
      engine.clearScriptUnits();
    },
    registerScriptEntryPoint(src: string, functionName: string, entryPc: number) {
      engine.registerScriptEntryPoint(src, functionName, entryPc);
    },
    clearScriptEntryPoints() {
      engine.clearScriptEntryPoints();
    },
    executeScriptRef(src: string) {
      return engine.executeScriptRef(src) as ScriptExecutionOutcome;
    },
    executeScriptRefFunction(src: string, functionName: string) {
      return engine.executeScriptRefFunction(src, functionName) as ScriptExecutionOutcome;
    },
    executeScriptRefCall(src: string, functionName: string, args) {
      return engine.executeScriptRefCall(src, functionName, args) as ScriptExecutionOutcome;
    },
    lastScriptExecutionTrap() {
      return engine.lastScriptExecutionTrap();
    },
    lastScriptExecutionOk() {
      return engine.lastScriptExecutionOk();
    },
    traceEntries() {
      return engine.traceEntries() as EngineTraceEntry[];
    },
    clearTraceEntries() {
      engine.clearTraceEntries();
    },
    render: paint,
    getEngine() {
      return engine;
    }
  };
}

function registerBuiltInScriptUnits(engine: WmlEngine): void {
  engine.clearScriptUnits();
  engine.clearScriptEntryPoints();
  engine.registerScriptUnit('calc.wmlsc', new Uint8Array([0x01, 4, 0x01, 5, 0x02, 0x00]));
  engine.registerScriptEntryPoint('calc.wmlsc', 'main', 0);
}
