import type { HostExample } from '../../examples/generated/examples';

interface ExampleMetadataElements {
  title: HTMLHeadingElement;
  coverage: HTMLParagraphElement;
  description: HTMLParagraphElement;
  goal: HTMLParagraphElement;
  testingAc: HTMLUListElement;
}

export function renderExampleMetadata(
  elements: ExampleMetadataElements,
  example: HostExample
): void {
  const coverage = [...example.workItems, ...example.specItems];
  elements.title.textContent = `${example.label} (${example.key})`;
  elements.coverage.textContent = `Coverage: ${coverage.join(', ')}`;
  elements.description.textContent = `Description: ${example.description}`;
  elements.goal.textContent = `Goal: ${example.goal}`;

  elements.testingAc.replaceChildren();
  for (const item of example.testingAc) {
    const li = document.createElement('li');
    li.textContent = item;
    elements.testingAc.appendChild(li);
  }
}
