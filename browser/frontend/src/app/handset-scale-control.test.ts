import { describe, expect, it } from 'vitest';
import {
  DEFAULT_HANDSET_SCALE,
  bindHandsetScaleControl,
  isHandsetScaleStep,
  setHandsetScale
} from './handset-scale-control';

describe('isHandsetScaleStep', () => {
  it('accepts only the documented display-scale steps', () => {
    expect(isHandsetScaleStep(1)).toBe(true);
    expect(isHandsetScaleStep(1.25)).toBe(true);
    expect(isHandsetScaleStep(1.5)).toBe(true);
    expect(isHandsetScaleStep(1.75)).toBe(true);
    expect(isHandsetScaleStep(2)).toBe(true);
    expect(isHandsetScaleStep(3)).toBe(true);
    expect(isHandsetScaleStep(0)).toBe(false);
    expect(isHandsetScaleStep(1.1)).toBe(false);
    expect(isHandsetScaleStep(4)).toBe(false);
    expect(isHandsetScaleStep(Number.NaN)).toBe(false);
  });
});

describe('setHandsetScale', () => {
  it('writes the --handset-scale custom property on the given root', () => {
    const root = document.createElement('div');
    setHandsetScale(root, 2);
    expect(root.style.getPropertyValue('--handset-scale')).toBe('2');
  });
});

describe('bindHandsetScaleControl', () => {
  it('applies the selected step to root on change', () => {
    const root = document.createElement('div');
    const select = document.createElement('select');
    for (const step of [1, 1.25, 1.5, 1.75, 2, 3]) {
      const option = document.createElement('option');
      option.value = String(step);
      select.appendChild(option);
    }
    select.value = String(DEFAULT_HANDSET_SCALE);

    bindHandsetScaleControl(select, root);

    select.value = '1.5';
    select.dispatchEvent(new Event('change'));

    expect(root.style.getPropertyValue('--handset-scale')).toBe('1.5');
  });

  it('stops reacting once unbound', () => {
    const root = document.createElement('div');
    const select = document.createElement('select');
    const option = document.createElement('option');
    option.value = '2';
    select.appendChild(option);
    select.value = '2';

    const unbind = bindHandsetScaleControl(select, root);
    unbind();
    select.dispatchEvent(new Event('change'));

    expect(root.style.getPropertyValue('--handset-scale')).toBe('');
  });

  it('ignores out-of-range select values without throwing', () => {
    const root = document.createElement('div');
    const select = document.createElement('select');
    const option = document.createElement('option');
    option.value = '9';
    select.appendChild(option);
    select.value = '9';

    bindHandsetScaleControl(select, root);
    select.dispatchEvent(new Event('change'));

    expect(root.style.getPropertyValue('--handset-scale')).toBe('');
  });
});
