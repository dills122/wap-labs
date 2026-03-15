/* eslint-disable */
// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Source: engine-wasm/examples/source/*.wml

export interface HostExample {
  key: string;
  label: string;
  description: string;
  goal: string;
  workItems: string[];
  specItems: string[];
  testingAc: string[];
  wml: string;
}

export const EXAMPLES: HostExample[] = [
  {
    "key": "acceptErrorRollback",
    "label": "Accept Error Rollback",
    "description": "Demonstrates deterministic rollback when accept-task navigation targets are invalid.",
    "goal": "Verify failed accept go action does not partially mutate runtime state.",
    "workItems": [
      "R0-02"
    ],
    "specItems": [
      "WML-18",
      "WML-R-017"
    ],
    "testingAc": [
      "Enter \"To broken accept\" then Enter again.",
      "Confirm action fails and activeCardId remains accept-broken.",
      "Press Back and confirm activeCardId returns to home."
    ],
    "wml": "<wml>\n  <card id=\"home\">\n    <p>Rollback demo.</p>\n    <a href=\"#accept-broken\">To broken accept</a>\n  </card>\n\n  <card id=\"accept-broken\">\n    <do type=\"accept\"><go href=\"#missing\"/></do>\n    <p>Accept action should fail and keep this card active.</p>\n  </card>\n</wml>\n"
  },
  {
    "key": "acceptNoopOrdering",
    "label": "Accept Noop Ordering",
    "description": "Exercises accept-task ordering with explicit noop behavior alongside go/prev/refresh flows.",
    "goal": "Verify noop is deterministic and does not mutate navigation/history while other accept actions retain expected behavior.",
    "workItems": [
      "R0-02"
    ],
    "specItems": [
      "WML-18",
      "WML-R-012",
      "WML-R-015",
      "WML-R-017"
    ],
    "testingAc": [
      "Enter \"Accept go\" then Enter again; activeCardId should become target.",
      "Return home, enter \"Accept prev\" then Enter again; activeCardId should become home.",
      "Enter \"Accept refresh\" then Enter; activeCardId should stay accept-refresh.",
      "Enter \"Accept noop\" then Enter; activeCardId should stay accept-noop and history depth should not change."
    ],
    "wml": "<wml>\n  <card id=\"home\">\n    <a href=\"#accept-go\">Accept go</a>\n    <a href=\"#accept-prev\">Accept prev</a>\n    <a href=\"#accept-refresh\">Accept refresh</a>\n    <a href=\"#accept-noop\">Accept noop</a>\n  </card>\n\n  <card id=\"accept-go\">\n    <do type=\"accept\"><go href=\"#target\"/></do>\n    <p>Enter should run accept go.</p>\n  </card>\n\n  <card id=\"accept-prev\">\n    <do type=\"accept\"><prev/></do>\n    <p>Enter should run accept prev.</p>\n  </card>\n\n  <card id=\"accept-refresh\">\n    <do type=\"accept\"><refresh/></do>\n    <p>Enter should run accept refresh.</p>\n  </card>\n\n  <card id=\"accept-noop\">\n    <do type=\"accept\"><noop/></do>\n    <p>Enter should run accept noop without state mutation.</p>\n  </card>\n\n  <card id=\"target\">\n    <p>Reached via accept go.</p>\n  </card>\n</wml>\n"
  },
  {
    "key": "actionsDoOnevent",
    "label": "Do + Onevent Actions",
    "description": "Demonstrates accept softkey action and onenterforward event chaining through runtime action handling.",
    "goal": "Verify runtime executes card-level action/event href intents without host-side semantics.",
    "workItems": [
      "W0-01"
    ],
    "specItems": [
      "RQ-WMLS-018"
    ],
    "testingAc": [
      "Load the example and press Enter on the first card; activeCardId should move from home to trigger.",
      "Confirm onenterforward on trigger executes immediately and activeCardId becomes final.",
      "Confirm externalNavigationIntent remains (none) through the flow."
    ],
    "wml": "<wml>\n  <card id=\"home\">\n    <do type=\"accept\">\n      <go href=\"#trigger\"/>\n    </do>\n    <p>Press Enter to run the accept action.</p>\n  </card>\n  <card id=\"trigger\">\n    <onevent type=\"onenterforward\">\n      <go href=\"#final\"/>\n    </onevent>\n    <p>This card should auto-forward to final.</p>\n  </card>\n  <card id=\"final\">\n    <p>Final card reached via onenterforward.</p>\n    <a href=\"#home\">Back home</a>\n  </card>\n</wml>\n"
  },
  {
    "key": "actionsPrevTaskModel",
    "label": "Prev Task Model",
    "description": "Demonstrates deterministic `<prev/>` handling for accept and intrinsic card-entry events.",
    "goal": "Verify task-model `prev` actions are executed consistently in runtime-owned action/event plumbing.",
    "workItems": [
      "A5-02"
    ],
    "specItems": [
      "WML-R-012",
      "WML-R-015"
    ],
    "testingAc": [
      "Press Enter on \"To middle\" and then Enter again; activeCardId should return to home (accept prev).",
      "From home, Enter \"To middle\", then Enter \"To next\".",
      "Press Back once; activeCardId should become home because middle runs onenterbackward prev."
    ],
    "wml": "<wml>\n  <card id=\"home\">\n    <p>Prev task demo.</p>\n    <a href=\"#mid-accept\">To middle (accept prev)</a>\n    <a href=\"#mid-back\">To middle (onenterbackward prev)</a>\n  </card>\n\n  <card id=\"mid-accept\">\n    <do type=\"accept\"><prev/></do>\n    <p>No links on this card; Enter should invoke accept prev.</p>\n  </card>\n\n  <card id=\"mid-back\">\n    <onevent type=\"onenterbackward\"><prev/></onevent>\n    <a href=\"#next\">To next</a>\n  </card>\n\n  <card id=\"next\">\n    <p>Use host Back to trigger onenterbackward prev in mid-back.</p>\n  </card>\n</wml>\n"
  },
  {
    "key": "actionsRefreshRollback",
    "label": "Refresh + Rollback",
    "description": "Demonstrates task-model `<refresh/>` execution and rollback behavior when entry-task actions fail.",
    "goal": "Verify refresh does not mutate navigation state and failed onenterforward actions leave invoking card current.",
    "workItems": [
      "A5-02"
    ],
    "specItems": [
      "WML-R-012",
      "WML-R-015",
      "WML-R-017"
    ],
    "testingAc": [
      "Press Enter on \"To refresh card\", then Enter again; activeCardId should stay refresh-card.",
      "Press Back; activeCardId should return to home.",
      "Press Down then Enter on \"Broken forward entry\"; load should fail and activeCardId should remain home."
    ],
    "wml": "<wml>\n  <card id=\"home\">\n    <p>Refresh + rollback demo.</p>\n    <a href=\"#refresh-card\">To refresh card</a>\n    <a href=\"#broken-forward\">Broken forward entry</a>\n  </card>\n\n  <card id=\"refresh-card\">\n    <do type=\"accept\"><refresh/></do>\n    <p>Enter invokes refresh and stays on this card.</p>\n  </card>\n\n  <card id=\"broken-forward\">\n    <onevent type=\"onenterforward\"><go href=\"#missing\"/></onevent>\n    <p>This card should never become active because entry action fails.</p>\n  </card>\n</wml>\n"
  },
  {
    "key": "actionsTaskOrderRollback",
    "label": "Task Order + Rollback",
    "description": "Exercises accept-task ordering for go/prev/refresh and failure rollback when task navigation targets are invalid.",
    "goal": "Validate deterministic action trace ordering and no partial state mutation on failed task actions.",
    "workItems": [
      "A5-02"
    ],
    "specItems": [
      "WML-R-012",
      "WML-R-015",
      "WML-R-017"
    ],
    "testingAc": [
      "Enter \"Accept go\" then Enter again; activeCardId should become target.",
      "Back to home, enter \"Accept prev\" then Enter again; activeCardId should become home.",
      "Enter \"Accept refresh\" then Enter; activeCardId should stay accept-refresh.",
      "Enter \"Accept broken\" then Enter; action should error and activeCardId should remain accept-broken."
    ],
    "wml": "<wml>\n  <card id=\"home\">\n    <a href=\"#accept-go\">Accept go</a>\n    <a href=\"#accept-prev\">Accept prev</a>\n    <a href=\"#accept-refresh\">Accept refresh</a>\n    <a href=\"#accept-broken\">Accept broken</a>\n  </card>\n\n  <card id=\"accept-go\">\n    <do type=\"accept\"><go href=\"#target\"/></do>\n    <p>Enter should run accept go.</p>\n  </card>\n\n  <card id=\"accept-prev\">\n    <do type=\"accept\"><prev/></do>\n    <p>Enter should run accept prev.</p>\n  </card>\n\n  <card id=\"accept-refresh\">\n    <do type=\"accept\"><refresh/></do>\n    <p>Enter should run accept refresh.</p>\n  </card>\n\n  <card id=\"accept-broken\">\n    <do type=\"accept\"><go href=\"#missing\"/></do>\n    <p>Enter should fail and keep this card active.</p>\n  </card>\n\n  <card id=\"target\">\n    <p>Reached via accept go.</p>\n  </card>\n</wml>\n"
  },
  {
    "key": "basic",
    "label": "Basic Navigation",
    "description": "Baseline navigation deck with one fragment link and one external link.",
    "goal": "Verify fragment transitions mutate active card while external links only emit host intent.",
    "workItems": [
      "A2-01",
      "A2-02"
    ],
    "specItems": [
      "WML-R-006",
      "WML-R-007"
    ],
    "testingAc": [
      "Load the example and press Enter on \"Go to next card\"; activeCardId should become next.",
      "Press Enter on \"Return home\"; activeCardId should become home.",
      "Move focus to \"External link\" and press Enter; activeCardId should remain home.",
      "Confirm runtime-state shows externalNavigationIntent as http://example.com/other.wml."
    ],
    "wml": "<wml>\n  <card id=\"home\">\n    <p>WaveNav Host Harness</p>\n    <p>Use ArrowUp / ArrowDown / Enter.</p>\n    <a href=\"#next\">Go to next card</a>\n    <br/>\n    <a href=\"http://example.com/other.wml\">External link (emits host intent)</a>\n  </card>\n  <card id=\"next\">\n    <p>Second card loaded.</p>\n    <a href=\"#home\">Return home</a>\n  </card>\n</wml>\n"
  },
  {
    "key": "cardEntryForwardBackward",
    "label": "Card Entry Forward+Backward",
    "description": "Demonstrates deterministic re-entry behavior when a card defines both onenterforward and onenterbackward handlers.",
    "goal": "Confirm forward entry and backward re-entry actions trigger at the expected navigation boundaries.",
    "workItems": [
      "A2-03"
    ],
    "specItems": [
      "WML-R-008"
    ],
    "testingAc": [
      "Press Enter on \"Enter transit\"; activeCardId should become next because transit runs onenterforward.",
      "Press Back once; activeCardId should become rewind because transit runs onenterbackward on re-entry.",
      "Confirm runtime trace shows ACTION_BACK and subsequent ACTION_FRAGMENT for rewind."
    ],
    "wml": "<wml>\n  <card id=\"home\">\n    <p>Start card.</p>\n    <a href=\"#transit\">Enter transit</a>\n  </card>\n  <card id=\"transit\">\n    <onevent type=\"onenterforward\">\n      <go href=\"#next\"/>\n    </onevent>\n    <onevent type=\"onenterbackward\">\n      <go href=\"#rewind\"/>\n    </onevent>\n    <p>Transit card should not remain active after either entry event.</p>\n  </card>\n  <card id=\"next\">\n    <p>Reached from onenterforward.</p>\n  </card>\n  <card id=\"rewind\">\n    <p>Reached from onenterbackward.</p>\n    <a href=\"#home\">Return home</a>\n  </card>\n</wml>\n"
  },
  {
    "key": "externalNavigationIntent",
    "label": "External Navigation Intent",
    "description": "Focused demo of external intent emission for relative and absolute links.",
    "goal": "Validate URL intent resolution and confirm fragment behavior remains separate.",
    "workItems": [
      "A2-02"
    ],
    "specItems": [
      "WML-R-007"
    ],
    "testingAc": [
      "Press Enter on \"Relative external link\" and confirm activeCardId stays home.",
      "Confirm externalNavigationIntent resolves to the base directory plus next.wml?from=home.",
      "Press Down then Enter on \"Absolute external link\" and confirm intent is exactly https://example.org/absolute.",
      "Press Down then Enter on \"Internal fragment link\" and confirm activeCardId becomes details."
    ],
    "wml": "<wml>\n  <card id=\"home\">\n    <p>External intent demo</p>\n    <p>Enter on first link emits host intent only.</p>\n    <a href=\"next.wml?from=home\">Relative external link</a>\n    <br/>\n    <a href=\"https://example.org/absolute\">Absolute external link</a>\n    <br/>\n    <a href=\"#details\">Internal fragment link</a>\n  </card>\n  <card id=\"details\">\n    <p>Fragment navigation still changes active card.</p>\n    <a href=\"#home\">Back home</a>\n  </card>\n</wml>\n"
  },
  {
    "key": "fieldOpenwave2011Navigation",
    "label": "Field Example (Openwave 2011)",
    "description": "Real-world style multi-card sample used to exercise parser ordering and fragment navigation.",
    "goal": "Ensure source ordering, inline link parsing, and card transitions stay deterministic on legacy-like content.",
    "workItems": [
      "A1-03",
      "A2-01"
    ],
    "specItems": [
      "WML-R-002",
      "WML-R-006"
    ],
    "testingAc": [
      "Load the deck and verify activeCardId starts at main.",
      "Press Enter on \"Here\" and confirm activeCardId transitions to content.",
      "Use Down and Enter on one of the external service links and verify activeCardId remains content.",
      "Confirm runtime-state externalNavigationIntent updates when entering an external service link."
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//OPENWAVE.COM//DTD WML 1.3//EN\"\n\"http://www.openwave.com/dtd/wml13.dtd\">\n<wml>\n  <card id=\"main\" title=\"Wireless Programming\">\n    <p align=\"center\" mode=\"wrap\">\n      Welcome to our <em>Online Mobile Course</em><br/>\n      <big><strong>Wireless Programming</strong></big>\n    </p>\n    <p>To Continue Click <a href=\"#content\">Here</a></p>\n  </card>\n  <card id=\"content\" title=\"Services\">\n    <p>\n      List of our services<br/>\n      <a href=\"dictionary.wml\">WAP Dictionary</a><br/>\n      <a href=\"Lectures.wml\">WAP Lectures</a><br/>\n      <a href=\"Quizes.wml\">WAP Quizes</a><br/>\n      <a href=\"Assignments.wml\">WAP Assignments</a><br/>\n      <a href=\"FAQ.wml\">WAP FAQ</a><br/>\n    </p>\n  </card>\n</wml>\n"
  },
  {
    "key": "formsSelectLocal",
    "label": "Forms Select (Local)",
    "description": "Local-mode form example for single-select option cycling, commit, cancel, and captured submit intent.",
    "goal": "Verify engine-owned select state cycles deterministically, survives commit/cancel, and feeds a local-only submit intent.",
    "workItems": [
      "A5-05",
      "A5-06"
    ],
    "specItems": [
      "WML-R-019",
      "RQ-RMK-003",
      "RQ-RMK-008"
    ],
    "testingAc": [
      "Load the example in Waves local mode and verify the default selected country is rendered.",
      "Focus the Country select, press Enter, then ArrowDown to cycle through options.",
      "Press Escape once and confirm the select returns to the original committed option.",
      "Re-enter select edit, cycle to a new option, press Enter to commit, then submit and confirm local mode captures the external intent."
    ],
    "wml": "<wml>\n  <card id=\"profile\" title=\"Local Select\">\n    <p>\n      Country:\n      <select name=\"Country\" title=\"Country\">\n        <option value=\"Jordan\">Jordan</option>\n        <option value=\"France\">France</option>\n        <option value=\"Germany\">Germany</option>\n      </select>\n    </p>\n    <do type=\"accept\">\n      <go method=\"post\" href=\"/profile\">\n        <postfield name=\"Country\" value=\"$(Country)\"/>\n      </go>\n    </do>\n  </card>\n</wml>\n"
  },
  {
    "key": "formsSelectNavigationLocal",
    "label": "Forms Select + Navigation (Local)",
    "description": "Local-mode select example with surrounding links and inputs to verify entering, exiting, and moving focus away from select edit mode.",
    "goal": "Verify select edit can be engaged, committed or canceled, and then cleanly disengaged so focus navigation resumes across other page items.",
    "workItems": [
      "A5-05",
      "A5-06"
    ],
    "specItems": [
      "WML-R-019",
      "RQ-RMK-003",
      "RQ-RMK-008"
    ],
    "testingAc": [
      "Load the example in Waves local mode and confirm the first focus target is the \"Help\" link.",
      "Move focus to the Country select, press Enter to begin edit, then ArrowDown to change the draft option.",
      "Press Enter to commit and confirm a subsequent ArrowDown moves focus to the PIN input instead of changing Country again.",
      "Re-enter Country edit, change the draft option, then press Escape and confirm the original committed option remains visible.",
      "Submit the card and confirm Waves captures the local-mode external intent without fetching."
    ],
    "wml": "<wml>\n  <card id=\"profile\" title=\"Select Navigation\">\n    <p><a href=\"#help\">Help</a></p>\n    <p>\n      Country:\n      <select name=\"Country\" title=\"Country\">\n        <option value=\"Jordan\">Jordan</option>\n        <option value=\"France\">France</option>\n        <option value=\"Germany\">Germany</option>\n        <option value=\"Japan\">Japan</option>\n      </select>\n    </p>\n    <p>PIN: <input name=\"pin\" value=\"\" type=\"password\"/></p>\n    <p><a href=\"#review\">Review</a></p>\n    <do type=\"accept\">\n      <go method=\"post\" href=\"/profile\">\n        <postfield name=\"Country\" value=\"$(Country)\"/>\n        <postfield name=\"pin\" value=\"$(pin)\"/>\n      </go>\n    </do>\n  </card>\n  <card id=\"help\" title=\"Help\">\n    <p>Use Enter to begin or commit select edit.</p>\n    <p>Use Escape to cancel select edit.</p>\n    <p><a href=\"#profile\">Back</a></p>\n  </card>\n  <card id=\"review\" title=\"Review\">\n    <p>Review card reached through normal focus navigation.</p>\n    <p><a href=\"#profile\">Back</a></p>\n  </card>\n</wml>\n"
  },
  {
    "key": "formsTextSubmitLocal",
    "label": "Forms Text Submit (Local)",
    "description": "Local-mode form example for text and password input editing with captured POST intent.",
    "goal": "Verify engine-owned text form state commits deterministically and local mode captures submit intent without fetching.",
    "workItems": [
      "A5-04",
      "A5-06"
    ],
    "specItems": [
      "WML-R-019",
      "RQ-RMK-008"
    ],
    "testingAc": [
      "Load the example in Waves local mode and confirm activeCardId starts at login.",
      "Press Enter on the username field, type a new value, and press Enter to commit.",
      "Move to the PIN field, type digits, and confirm the viewport masks the committed value.",
      "Submit the card and confirm Waves reports a captured external intent instead of performing a fetch."
    ],
    "wml": "<wml>\n  <card id=\"login\" title=\"Local Login\">\n    <p>User: <input name=\"username\" value=\"AHMED\" type=\"text\"/></p>\n    <p>PIN: <input name=\"pin\" value=\"\" type=\"password\"/></p>\n    <do type=\"accept\">\n      <go method=\"post\" href=\"/login\">\n        <postfield name=\"username\" value=\"$(username)\"/>\n        <postfield name=\"pin\" value=\"$(pin)\"/>\n      </go>\n    </do>\n  </card>\n</wml>\n"
  },
  {
    "key": "historyBackProcessOrder",
    "label": "History Back Process Order",
    "description": "Exercises multi-step fragment navigation and deterministic back traversal order.",
    "goal": "Verify back traversal replays prior card order without skipping or mutating unrelated state.",
    "workItems": [
      "R0-02",
      "R0-03"
    ],
    "specItems": [
      "WML-18",
      "WML-07",
      "WML-R-008"
    ],
    "testingAc": [
      "Navigate home -> level-1 -> level-2 using Enter.",
      "Press Back once and confirm activeCardId is level-1.",
      "Press Back again and confirm activeCardId is home.",
      "Press Back on home and confirm no-op behavior with activeCardId still home."
    ],
    "wml": "<wml>\n  <card id=\"home\">\n    <p>History process-order demo.</p>\n    <a href=\"#level-1\">To level 1</a>\n  </card>\n\n  <card id=\"level-1\">\n    <p>Level 1 card.</p>\n    <a href=\"#level-2\">To level 2</a>\n  </card>\n\n  <card id=\"level-2\">\n    <p>Level 2 card.</p>\n    <a href=\"#home\">Return home via link</a>\n  </card>\n</wml>\n"
  },
  {
    "key": "historyBackStack",
    "label": "History Back Stack",
    "description": "Exercises fragment navigation history and host-triggered back navigation.",
    "goal": "Verify runtime pushes history on fragment transitions and pops deterministically through navigateBack.",
    "workItems": [
      "A2-03"
    ],
    "specItems": [
      "WML-R-008"
    ],
    "testingAc": [
      "Load the deck and press Enter on \"Go to next\"; activeCardId should become next.",
      "Press Back; activeCardId should return to home.",
      "Press Back again and confirm status reports history empty with activeCardId still home."
    ],
    "wml": "<wml>\n  <card id=\"home\">\n    <p>History baseline demo.</p>\n    <a href=\"#next\">Go to next</a>\n  </card>\n  <card id=\"next\">\n    <p>Second card reached by fragment navigation.</p>\n    <a href=\"#home\">Return home via link</a>\n  </card>\n</wml>\n"
  },
  {
    "key": "missingFragment",
    "label": "Missing Fragment Error",
    "description": "Negative navigation case where a fragment target is absent.",
    "goal": "Verify missing fragment transitions fail deterministically without mutating runtime state.",
    "workItems": [
      "A2-01"
    ],
    "specItems": [
      "WML-R-006"
    ],
    "testingAc": [
      "Load the deck and confirm activeCardId is home.",
      "Press Enter on \"Broken target\".",
      "Confirm status shows a key error and activeCardId remains home.",
      "Confirm focusedLinkIndex remains stable after the failed navigation."
    ],
    "wml": "<wml>\n  <card id=\"home\">\n    <p>Missing fragment test</p>\n    <a href=\"#missing\">Broken target</a>\n  </card>\n</wml>\n"
  },
  {
    "key": "onenterbackwardReentry",
    "label": "OnEnterBackward Reentry",
    "description": "Demonstrates card re-entry behavior when navigateBack lands on a card with onenterbackward.",
    "goal": "Verify backward navigation triggers onenterbackward deterministically before the user resumes input.",
    "workItems": [
      "A2-03"
    ],
    "specItems": [
      "WML-R-008"
    ],
    "testingAc": [
      "Press Enter on \"To middle\", then Enter on \"To next\"; activeCardId should become next.",
      "Press Back once; activeCardId should become rewind (not middle) because mid defines onenterbackward.",
      "Confirm runtime trace includes ACTION_BACK followed by ACTION_FRAGMENT for rewind."
    ],
    "wml": "<wml>\n  <card id=\"home\">\n    <p>Start card.</p>\n    <a href=\"#mid\">To middle</a>\n  </card>\n  <card id=\"mid\">\n    <onevent type=\"onenterbackward\">\n      <go href=\"#rewind\"/>\n    </onevent>\n    <p>Middle card runs backward-entry action.</p>\n    <a href=\"#next\">To next</a>\n  </card>\n  <card id=\"next\">\n    <p>Reached from middle.</p>\n  </card>\n  <card id=\"rewind\">\n    <p>Reached via onenterbackward.</p>\n    <a href=\"#home\">Return home</a>\n  </card>\n</wml>\n"
  },
  {
    "key": "parserRobustness",
    "label": "Parser Robustness",
    "description": "Includes unsupported tags and valid card content to assert parser resilience.",
    "goal": "Confirm unsupported tags are ignored while valid nodes remain functional and navigable.",
    "workItems": [
      "A1-01",
      "A1-03"
    ],
    "specItems": [
      "WML-R-001",
      "WML-R-020"
    ],
    "testingAc": [
      "Load the deck and verify it renders without load errors.",
      "Confirm activeCardId starts at home despite the unsupported <cardinal> node.",
      "Press Enter on \"Next\" and confirm transition to next works.",
      "Press Enter on \"Back\" and confirm transition to home works."
    ],
    "wml": "<wml>\n  <cardinal id=\"noise\">Ignore me</cardinal>\n  <card id=\"home\">\n    <p>Hello <a href=\"#next\">Next</a></p>\n  </card>\n  <card id=\"next\">\n    <p>Still works.</p>\n    <a href=\"#home\">Back</a>\n  </card>\n</wml>\n"
  },
  {
    "key": "scriptLinkExecution",
    "label": "Script Link Execution",
    "description": "Runs a registered script unit through a script href and exposes execution outcome in runtime state.",
    "goal": "Validate runtime routes script href actions into engine VM execution path.",
    "workItems": [
      "W0-01",
      "W0-03"
    ],
    "specItems": [
      "RQ-WMLS-001",
      "RQ-WMLS-008"
    ],
    "testingAc": [
      "Load the example and press Enter on \"Run calc script\"; activeCardId should stay home.",
      "Confirm runtime-state lastScriptExecutionOk becomes true.",
      "Confirm runtime-state lastScriptExecutionTrap remains (none)."
    ],
    "wml": "<wml>\n  <card id=\"home\">\n    <p>Script action execution demo.</p>\n    <a href=\"script:calc.wmlsc#main\">Run calc script</a>\n    <br/>\n    <a href=\"#done\">Continue</a>\n  </card>\n  <card id=\"done\">\n    <p>Script executed in previous card.</p>\n    <a href=\"#home\">Back</a>\n  </card>\n</wml>\n"
  },
  {
    "key": "timerHostClockLifecycle",
    "label": "Timer Host Clock Lifecycle",
    "description": "Demonstrates host-driven deterministic timer ticking for non-zero `<timer value>` expiry.",
    "goal": "Verify auto tick advances runtime clock and ontimer dispatch transitions cards without manual key input.",
    "workItems": [
      "A5-03"
    ],
    "specItems": [
      "WML-R-014"
    ],
    "testingAc": [
      "Select this example and press Enter on \"Start timed card\".",
      "Enable Auto Tick with 100ms step and wait until the card transitions.",
      "Confirm activeCardId transitions from timed to done and trace contains TIMER_TICK, TIMER_EXPIRE, and ACTION_ONTIMER."
    ],
    "wml": "<wml>\n  <card id=\"home\">\n    <a href=\"#timed\">Start timed card</a>\n  </card>\n  <card id=\"timed\">\n    <timer value=\"15\"/>\n    <onevent type=\"ontimer\"><go href=\"#done\"/></onevent>\n    <p>Auto tick should move this card after 1.5 seconds.</p>\n  </card>\n  <card id=\"done\">\n    <p>Timer completed through host clock lifecycle.</p>\n  </card>\n</wml>\n"
  },
  {
    "key": "timerOntimerImmediate",
    "label": "Timer Ontimer Immediate",
    "description": "Demonstrates immediate ontimer dispatch for `<timer value=\"0\"/>` at card-entry boundaries.",
    "goal": "Verify runtime-owned timer dispatch executes ontimer action deterministically on entry.",
    "workItems": [
      "A5-03"
    ],
    "specItems": [
      "WML-R-014"
    ],
    "testingAc": [
      "Press Enter on \"To timed\" from home.",
      "Confirm activeCardId becomes next immediately (timed card should not remain active).",
      "Confirm trace includes TIMER_START and ACTION_ONTIMER before the final ACTION_FRAGMENT to next."
    ],
    "wml": "<wml>\n  <card id=\"home\">\n    <a href=\"#timed\">To timed</a>\n  </card>\n  <card id=\"timed\">\n    <timer value=\"0\"/>\n    <onevent type=\"ontimer\"><go href=\"#next\"/></onevent>\n    <p>Timed card should auto-advance.</p>\n  </card>\n  <card id=\"next\">\n    <p>Reached via ontimer dispatch.</p>\n  </card>\n</wml>\n"
  },
  {
    "key": "wavescriptGoCancel",
    "label": "WaveScript Go Cancel",
    "description": "Exercises go-cancel behavior where go(\"\") clears pending navigation intent in the same invocation.",
    "goal": "Verify deferred navigation cancellation semantics are deterministic.",
    "workItems": [
      "W0-04"
    ],
    "specItems": [
      "RQ-WMLS-018"
    ],
    "testingAc": [
      "On home card, press Enter on \"Script go then cancel\".",
      "Confirm activeCardId remains home after invocation.",
      "Confirm runtime-state externalNavigationIntent remains (none)."
    ],
    "wml": "<wml>\n  <card id=\"home\">\n    <p>go(\"#next\") then go(\"\") in one script invocation.</p>\n    <a href=\"script:wavescript-fixtures.wmlsc#goCancel\">Script go then cancel</a>\n  </card>\n  <card id=\"next\">\n    <p>If you can read this from the script link, cancellation regressed.</p>\n    <a href=\"#home\">Back</a>\n  </card>\n</wml>\n"
  },
  {
    "key": "wavescriptNavOrder",
    "label": "WaveScript Navigation Order",
    "description": "Demonstrates last-call-wins behavior for go/prev ordering inside a single script invocation.",
    "goal": "Confirm ordering rules stay deterministic as compatibility fixtures evolve.",
    "workItems": [
      "W0-04"
    ],
    "specItems": [
      "RQ-WMLS-018"
    ],
    "testingAc": [
      "Press Enter on \"go then prev\" and confirm activeCardId stays home.",
      "Press Down then Enter on \"prev then go\" and confirm activeCardId becomes next.",
      "On next card, press Enter on \"Script external go\" and confirm externalNavigationIntent is populated."
    ],
    "wml": "<wml>\n  <card id=\"home\">\n    <p>Navigation ordering matrix.</p>\n    <a href=\"script:wavescript-fixtures.wmlsc#goThenPrev\">go then prev</a>\n    <br/>\n    <a href=\"script:wavescript-fixtures.wmlsc#prevThenGo\">prev then go</a>\n  </card>\n  <card id=\"next\">\n    <p>Reached via prev-then-go ordering.</p>\n    <a href=\"script:wavescript-fixtures.wmlsc#externalGo\">Script external go</a>\n    <br/>\n    <a href=\"#home\">Back home</a>\n  </card>\n</wml>\n"
  },
  {
    "key": "wavescriptRefreshPolicy",
    "label": "WaveScript Refresh Policy",
    "description": "Verifies setVar-driven refresh signaling without navigation side effects.",
    "goal": "Confirm requiresRefresh policy is surfaced while active card remains stable.",
    "workItems": [
      "W0-04"
    ],
    "specItems": [
      "RQ-WMLS-017",
      "RQ-WMLS-021"
    ],
    "testingAc": [
      "On home card, press Enter on \"Script setVar only\".",
      "Confirm activeCardId remains home and focusedLinkIndex remains stable.",
      "Confirm runtime-state nextCardVar becomes updated and lastScriptRequiresRefresh becomes true."
    ],
    "wml": "<wml>\n  <card id=\"home\">\n    <p>Refresh policy demo (no navigation).</p>\n    <a href=\"script:wavescript-fixtures.wmlsc#refreshOnly\">Script setVar only</a>\n  </card>\n</wml>\n"
  },
  {
    "key": "wmlbrowserContextFidelity",
    "label": "WMLBrowser Context Fidelity",
    "description": "Exercises getCurrentCard and newContext semantics, including context reset side effects and prev suppression.",
    "goal": "Validate that current-card lookup and newContext resets align with WMLScript context semantics in host-visible flows.",
    "workItems": [
      "R0-03",
      "W0-07"
    ],
    "specItems": [
      "RQ-WMLS-019",
      "RQ-WMLS-020"
    ],
    "testingAc": [
      "On home card, press Enter on \"Read current card into nextCard\" and confirm runtime-state nextCardVar becomes #home.",
      "Follow \"Go to next card\" then activate \"Run newContext + prev\"; activeCardId should remain next and nextCardVar should clear.",
      "Press browser Back after newContext and verify history is cleared for prior card context (no return to home via engine history)."
    ],
    "wml": "<wml>\n  <card id=\"home\">\n    <p>WMLBrowser context semantics demo.</p>\n    <a href=\"script:wmlbrowser-demo.wmlsc#readCurrentCard\">Read current card into nextCard</a>\n    <a href=\"#next\">Go to next card</a>\n  </card>\n  <card id=\"next\">\n    <p>newContext should clear vars/history and ignore prev in same script.</p>\n    <a href=\"script:wmlbrowser-demo.wmlsc#newContextPrev\">Run newContext + prev</a>\n    <a href=\"script:wmlbrowser-demo.wmlsc#readCurrentCard\">Read current card into nextCard</a>\n  </card>\n</wml>\n"
  },
  {
    "key": "wmlbrowserVarNav",
    "label": "WMLBrowser Var + Nav",
    "description": "Exercises script-host bindings for setVar/getVar and deferred go/prev navigation effects.",
    "goal": "Validate WMLBrowser subset semantics at the engine-owned post-invocation boundary.",
    "workItems": [
      "W0-04"
    ],
    "specItems": [
      "RQ-WMLS-017",
      "RQ-WMLS-018"
    ],
    "testingAc": [
      "On home card, press Enter on \"Script setVar + go\"; activeCardId should become next.",
      "Confirm runtime-state nextCardVar becomes #next after the script runs.",
      "On next card, press Enter on \"Script prev\"; activeCardId should return to home."
    ],
    "wml": "<wml>\n  <card id=\"home\">\n    <p>WMLBrowser var/nav subset demo.</p>\n    <a href=\"script:wmlbrowser-demo.wmlsc#main\">Script setVar + go</a>\n  </card>\n  <card id=\"next\">\n    <p>Navigation came from script go().</p>\n    <a href=\"script:wmlbrowser-demo.wmlsc#back\">Script prev</a>\n  </card>\n</wml>\n"
  },
  {
    "key": "wrapStress",
    "label": "Long Token Wrap",
    "description": "Long unbroken token fixture for deterministic wrapping checks.",
    "goal": "Detect layout regressions in char-width wrapping and ensure navigation remains usable.",
    "workItems": [
      "A3-01"
    ],
    "specItems": [
      "WML-R-004"
    ],
    "testingAc": [
      "Load the deck and confirm the long token wraps consistently in the canvas viewport.",
      "Reload the same deck multiple times and verify visual wrapping does not drift.",
      "Press Enter on \"Continue\" and confirm activeCardId transitions to next.",
      "Press Enter on \"Back\" and confirm return to home."
    ],
    "wml": "<wml>\n  <card id=\"home\">\n    <p>supercalifragilisticpseudopneumonoultramicroscopicsilicovolcanoconiosis</p>\n    <a href=\"#next\">Continue</a>\n  </card>\n  <card id=\"next\">\n    <p>Wrap test complete.</p>\n    <a href=\"#home\">Back</a>\n  </card>\n</wml>\n"
  }
];
