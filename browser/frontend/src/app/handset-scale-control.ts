export const HANDSET_SCALE_STEPS = [1, 2, 3] as const;

export type HandsetScaleStep = (typeof HANDSET_SCALE_STEPS)[number];

export const DEFAULT_HANDSET_SCALE: HandsetScaleStep = 1;

export const isHandsetScaleStep = (value: number): value is HandsetScaleStep =>
  (HANDSET_SCALE_STEPS as readonly number[]).includes(value);

export const setHandsetScale = (root: HTMLElement, scale: HandsetScaleStep): void => {
  root.style.setProperty('--handset-scale', String(scale));
};

// Wires the display-scale <select> to the `--handset-scale` custom property
// consumed by `.handset-stage`'s `zoom`. This only changes rendered pixel
// size: the engine computes row/column wrapping from the configured viewport
// column count, independent of this value, so scale steps never touch
// engine state (see WBP-02 accept criteria).
export const bindHandsetScaleControl = (
  selectEl: HTMLSelectElement,
  root: HTMLElement
): (() => void) => {
  const handler = (): void => {
    const parsed = Number(selectEl.value);
    if (isHandsetScaleStep(parsed)) {
      setHandsetScale(root, parsed);
    }
  };
  selectEl.addEventListener('change', handler);
  return () => selectEl.removeEventListener('change', handler);
};
