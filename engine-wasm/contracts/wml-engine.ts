export type EngineKey = 'up' | 'down' | 'enter';

export interface WmlDeckInput {
  wmlXml: string;
  baseUrl: string;
  contentType: string;
  rawBytesBase64?: string;
}

export interface RenderList {
  draw: DrawCmd[];
}

export type DrawCmd = DrawText | DrawLink;

export interface DrawText {
  type: 'text';
  x: number;
  y: number;
  text: string;
}

export interface DrawLink {
  type: 'link';
  x: number;
  y: number;
  text: string;
  focused: boolean;
  href: string;
}

export interface WmlEngineWasm {
  loadDeck(xml: string): void;
  loadDeckContext(
    wmlXml: string,
    baseUrl: string,
    contentType: string,
    rawBytesBase64?: string
  ): void;
  render(): RenderList;
  handleKey(key: EngineKey): void;
  navigateToCard(id: string): void;
  setViewportCols(cols: number): void;
  activeCardId(): string;
  focusedLinkIndex(): number;
  baseUrl(): string;
  contentType(): string;
  externalNavigationIntent(): string | undefined;
  clearExternalNavigationIntent(): void;
}
