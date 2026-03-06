import { EXAMPLES, type HostExample } from '../../../../engine-wasm/examples/generated/examples';

export interface LocalDeckExample {
  key: string;
  label: string;
  description: string;
  goal: string;
  workItems: string[];
  specItems: string[];
  testingAc: string[];
  baseUrl: string;
  wml: string;
}

const toLocalDeckExample = (example: HostExample): LocalDeckExample => ({
  key: example.key,
  label: example.label,
  description: example.description,
  goal: example.goal,
  workItems: example.workItems,
  specItems: example.specItems,
  testingAc: example.testingAc,
  baseUrl: `http://local.test/examples/${example.key}.wml`,
  wml: example.wml
});

export const LOCAL_DECK_EXAMPLES: LocalDeckExample[] = EXAMPLES.map(toLocalDeckExample);

export const defaultLocalDeckExample = (): LocalDeckExample => {
  const first = LOCAL_DECK_EXAMPLES[0];
  if (!first) {
    throw new Error('No local deck examples found from shared engine-wasm examples manifest.');
  }
  return first;
};

export const findLocalDeckExample = (key: string): LocalDeckExample | undefined =>
  LOCAL_DECK_EXAMPLES.find((example) => example.key === key);
