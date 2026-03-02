import init, { WmlEngine } from '../pkg/wavenav_engine.js';
import type {
  DrawCmd,
  EngineTraceEntry,
  ScriptExecutionOutcome,
  ScriptInvocationOutcome
} from '../contracts/wml-engine';

const lineHeight = 16;
const charWidth = 8;
const DEFAULT_BASE_URL = 'http://local.test/deck.wml';
const DEFAULT_CONTENT_TYPE = 'text/vnd.wap.wml';
type KeyName = 'up' | 'down' | 'enter';
type ScriptErrorClass = 'none' | 'non-fatal' | 'fatal';
type ScriptErrorCategory = 'none' | 'computational' | 'integrity' | 'resource' | 'host-binding';

interface EngineWithOptionalScriptErrorDiagnostics {
  lastScriptExecutionErrorClass?: () => ScriptErrorClass | undefined;
  lastScriptExecutionErrorCategory?: () => ScriptErrorCategory | undefined;
}

export interface EngineSnapshot {
  activeCardId: string;
  focusedLinkIndex: number;
  baseUrl: string;
  contentType: string;
  nextCardVar?: string;
  externalNavigationIntent?: string;
  lastScriptExecutionOk?: boolean;
  lastScriptExecutionTrap?: string;
  lastScriptExecutionErrorClass?: ScriptErrorClass;
  lastScriptExecutionErrorCategory?: ScriptErrorCategory;
  lastScriptRequiresRefresh?: boolean;
}

export interface EngineHost {
  loadDeck(xml: string): void;
  pressKey(key: KeyName): void;
  navigateBack(): boolean;
  snapshot(): EngineSnapshot;
  clearExternalNavigationIntent(): void;
  getVar(name: string): string | undefined;
  setVar(name: string, value: string): boolean;
  executeScriptUnit(bytes: Uint8Array): ScriptExecutionOutcome;
  registerScriptUnit(src: string, bytes: Uint8Array): void;
  clearScriptUnits(): void;
  registerScriptEntryPoint(src: string, functionName: string, entryPc: number): void;
  clearScriptEntryPoints(): void;
  invokeScriptRef(src: string): ScriptInvocationOutcome;
  invokeScriptRefFunction(src: string, functionName: string): ScriptInvocationOutcome;
  invokeScriptRefCall(
    src: string,
    functionName: string,
    args: Array<boolean | number | string | { invalid: true }>
  ): ScriptInvocationOutcome;
  executeScriptRef(src: string): ScriptExecutionOutcome;
  executeScriptRefFunction(src: string, functionName: string): ScriptExecutionOutcome;
  executeScriptRefCall(
    src: string,
    functionName: string,
    args: Array<boolean | number | string | { invalid: true }>
  ): ScriptExecutionOutcome;
  lastScriptExecutionTrap(): string | undefined;
  lastScriptExecutionOk(): boolean | undefined;
  lastScriptExecutionErrorClass(): ScriptErrorClass | undefined;
  lastScriptExecutionErrorCategory(): ScriptErrorCategory | undefined;
  lastScriptRequiresRefresh(): boolean | undefined;
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
    navigateBack() {
      const handled = engine.navigateBack();
      paint();
      return handled;
    },
    snapshot() {
      const diagnostics = engine as unknown as EngineWithOptionalScriptErrorDiagnostics;
      return {
        activeCardId: engine.activeCardId(),
        focusedLinkIndex: engine.focusedLinkIndex(),
        baseUrl: engine.baseUrl(),
        contentType: engine.contentType(),
        nextCardVar: engine.getVar('nextCard'),
        externalNavigationIntent: engine.externalNavigationIntent(),
        lastScriptExecutionOk: engine.lastScriptExecutionOk(),
        lastScriptExecutionTrap: engine.lastScriptExecutionTrap(),
        lastScriptExecutionErrorClass: diagnostics.lastScriptExecutionErrorClass?.() ?? undefined,
        lastScriptExecutionErrorCategory:
          diagnostics.lastScriptExecutionErrorCategory?.() ?? undefined,
        lastScriptRequiresRefresh: engine.lastScriptRequiresRefresh()
      };
    },
    clearExternalNavigationIntent() {
      engine.clearExternalNavigationIntent();
    },
    getVar(name: string) {
      return engine.getVar(name);
    },
    setVar(name: string, value: string) {
      return engine.setVar(name, value);
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
    invokeScriptRef(src: string) {
      const outcome = engine.invokeScriptRef(src) as ScriptInvocationOutcome;
      if (outcome.effects.requiresRefresh || outcome.effects.navigationIntent.type !== 'none') {
        paint();
      }
      return outcome;
    },
    invokeScriptRefFunction(src: string, functionName: string) {
      const outcome = engine.invokeScriptRefFunction(src, functionName) as ScriptInvocationOutcome;
      if (outcome.effects.requiresRefresh || outcome.effects.navigationIntent.type !== 'none') {
        paint();
      }
      return outcome;
    },
    invokeScriptRefCall(src: string, functionName: string, args) {
      const outcome = engine.invokeScriptRefCall(
        src,
        functionName,
        args
      ) as ScriptInvocationOutcome;
      if (outcome.effects.requiresRefresh || outcome.effects.navigationIntent.type !== 'none') {
        paint();
      }
      return outcome;
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
    lastScriptExecutionErrorClass() {
      const diagnostics = engine as unknown as EngineWithOptionalScriptErrorDiagnostics;
      return diagnostics.lastScriptExecutionErrorClass?.();
    },
    lastScriptExecutionErrorCategory() {
      const diagnostics = engine as unknown as EngineWithOptionalScriptErrorDiagnostics;
      return diagnostics.lastScriptExecutionErrorCategory?.();
    },
    lastScriptRequiresRefresh() {
      return engine.lastScriptRequiresRefresh();
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
  engine.registerScriptUnit(
    'wmlbrowser-demo.wmlsc',
    new Uint8Array([
      0x03,
      0x08,
      0x6e,
      0x65,
      0x78,
      0x74,
      0x43,
      0x61,
      0x72,
      0x64, // "nextCard"
      0x03,
      0x05,
      0x23,
      0x6e,
      0x65,
      0x78,
      0x74, // "#next"
      0x20,
      0x02,
      0x02, // setVar(name, value)
      0x03,
      0x05,
      0x23,
      0x6e,
      0x65,
      0x78,
      0x74, // "#next"
      0x20,
      0x03,
      0x01, // go(href)
      0x00, // halt
      0x20,
      0x04,
      0x00, // prev()
      0x00, // halt
      0x03,
      0x08,
      0x6e,
      0x65,
      0x78,
      0x74,
      0x43,
      0x61,
      0x72,
      0x64, // "nextCard"
      0x20,
      0x01,
      0x01, // getVar(name)
      0x00 // halt
    ])
  );
  engine.registerScriptEntryPoint('wmlbrowser-demo.wmlsc', 'main', 0);
  engine.registerScriptEntryPoint('wmlbrowser-demo.wmlsc', 'back', 31);
  engine.registerScriptEntryPoint('wmlbrowser-demo.wmlsc', 'readNext', 35);
  engine.registerScriptUnit(
    'wavescript-fixtures.wmlsc',
    new Uint8Array([
      0x03,
      0x08,
      0x6e,
      0x65,
      0x78,
      0x74,
      0x43,
      0x61,
      0x72,
      0x64, // "nextCard"
      0x03,
      0x07,
      0x75,
      0x70,
      0x64,
      0x61,
      0x74,
      0x65,
      0x64, // "updated"
      0x20,
      0x02,
      0x02, // refreshOnly => setVar
      0x00, // halt
      0x03,
      0x05,
      0x23,
      0x6e,
      0x65,
      0x78,
      0x74, // "#next"
      0x20,
      0x03,
      0x01, // go
      0x03,
      0x00, // ""
      0x20,
      0x03,
      0x01, // go (cancel)
      0x00, // halt
      0x03,
      0x14,
      0x6e,
      0x65,
      0x78,
      0x74,
      0x2e,
      0x77,
      0x6d,
      0x6c,
      0x3f,
      0x66,
      0x72,
      0x6f,
      0x6d,
      0x3d,
      0x73,
      0x63,
      0x72,
      0x69,
      0x70,
      0x74, // "next.wml?from=script"
      0x20,
      0x03,
      0x01, // go
      0x00, // halt
      0x03,
      0x05,
      0x23,
      0x6e,
      0x65,
      0x78,
      0x74, // "#next"
      0x20,
      0x03,
      0x01, // go
      0x20,
      0x04,
      0x00, // prev
      0x00, // halt
      0x20,
      0x04,
      0x00, // prev
      0x03,
      0x05,
      0x23,
      0x6e,
      0x65,
      0x78,
      0x74, // "#next"
      0x20,
      0x03,
      0x01, // go
      0x00 // halt
    ])
  );
  engine.registerScriptEntryPoint('wavescript-fixtures.wmlsc', 'refreshOnly', 0);
  engine.registerScriptEntryPoint('wavescript-fixtures.wmlsc', 'goCancel', 23);
  engine.registerScriptEntryPoint('wavescript-fixtures.wmlsc', 'externalGo', 39);
  engine.registerScriptEntryPoint('wavescript-fixtures.wmlsc', 'goThenPrev', 63);
  engine.registerScriptEntryPoint('wavescript-fixtures.wmlsc', 'prevThenGo', 77);
}
