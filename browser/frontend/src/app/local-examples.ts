export interface LocalDeckExample {
  key: string;
  label: string;
  baseUrl: string;
  wml: string;
}

export const LOCAL_DECK_EXAMPLES: LocalDeckExample[] = [
  {
    key: 'basic',
    label: 'Basic Navigation',
    baseUrl: 'http://local.test/examples/basic.wml',
    wml: `<wml>
  <card id="home">
    <p>WaveNav Local Example</p>
    <p>Use ArrowUp / ArrowDown / Enter.</p>
    <a href="#next">Go to next card</a>
    <br/>
    <a href="http://example.com/other.wml">External link (host intent)</a>
  </card>
  <card id="next">
    <p>Second card loaded.</p>
    <a href="#home">Return home</a>
  </card>
</wml>`
  },
  {
    key: 'history-back-stack',
    label: 'History Back Stack',
    baseUrl: 'http://local.test/examples/history-back-stack.wml',
    wml: `<wml>
  <card id="home">
    <p>History baseline demo.</p>
    <a href="#next">Go to next</a>
  </card>
  <card id="next">
    <p>Second card reached by fragment navigation.</p>
    <a href="#home">Return home via link</a>
  </card>
</wml>`
  },
  {
    key: 'missing-fragment',
    label: 'Missing Fragment Error',
    baseUrl: 'http://local.test/examples/missing-fragment.wml',
    wml: `<wml>
  <card id="home">
    <p>Missing fragment test</p>
    <a href="#missing">Broken target</a>
  </card>
</wml>`
  },
  {
    key: 'external-intent',
    label: 'External Intent',
    baseUrl: 'http://local.test/examples/external-navigation-intent.wml',
    wml: `<wml>
  <card id="home">
    <p>External intent demo</p>
    <a href="next.wml?from=home">Relative external link</a>
    <br/>
    <a href="https://example.org/absolute">Absolute external link</a>
    <br/>
    <a href="#details">Internal fragment link</a>
  </card>
  <card id="details">
    <p>Fragment navigation changes active card.</p>
    <a href="#home">Back home</a>
  </card>
</wml>`
  },
  {
    key: 'openwave-2011-navigation',
    label: 'Field Example (Openwave 2011)',
    baseUrl: 'http://local.test/examples/field-openwave-2011-navigation.wml',
    wml: `<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//OPENWAVE.COM//DTD WML 1.3//EN"
"http://www.openwave.com/dtd/wml13.dtd">
<wml>
  <card id="main" title="Wireless Programming">
    <p align="center" mode="wrap">
      Welcome to our <em>Online Mobile Course</em><br/>
      <big><strong>Wireless Programming</strong></big>
    </p>
    <p>To Continue Click <a href="#content">Here</a></p>
  </card>
  <card id="content" title="Services">
    <p>
      List of our services<br/>
      <a href="dictionary.wml">WAP Dictionary</a><br/>
      <a href="Lectures.wml">WAP Lectures</a><br/>
      <a href="Quizes.wml">WAP Quizes</a><br/>
      <a href="Assignments.wml">WAP Assignments</a><br/>
      <a href="FAQ.wml">WAP FAQ</a><br/>
    </p>
  </card>
</wml>`
  }
];

export const defaultLocalDeckExample = (): LocalDeckExample => LOCAL_DECK_EXAMPLES[0];

export const findLocalDeckExample = (key: string): LocalDeckExample | undefined =>
  LOCAL_DECK_EXAMPLES.find((example) => example.key === key);
