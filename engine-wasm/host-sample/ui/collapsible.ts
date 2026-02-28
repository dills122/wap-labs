interface CollapsibleOptions {
  container: HTMLElement;
  toggleButton: HTMLButtonElement;
  collapsedClass: string;
}

export interface CollapsibleController {
  apply(): void;
  toggle(): void;
}

export function createCollapsible(options: CollapsibleOptions): CollapsibleController {
  let isCollapsed = false;

  const apply = () => {
    options.container.classList.toggle(options.collapsedClass, isCollapsed);
    options.toggleButton.textContent = isCollapsed ? 'Expand' : 'Collapse';
    options.toggleButton.setAttribute('aria-expanded', String(!isCollapsed));
  };

  const toggle = () => {
    isCollapsed = !isCollapsed;
    apply();
  };

  return { apply, toggle };
}
