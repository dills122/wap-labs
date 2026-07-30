/* eslint-disable */
// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Sources: engine-wasm/examples/source/*.wml and optional *.flow.json companions

export interface StoryStateExpectation {
  activeCardId?: string;
  focusedLinkIndex?: number;
  focusedInputEditName?: string | null;
  focusedInputEditValue?: string | null;
  focusedSelectEditName?: string | null;
  focusedSelectEditValue?: string | null;
  externalNavigationIntent?: string | null;
  externalNavigationRequestPolicy?: {
    cacheControl?: 'default' | 'no-cache';
    refererUrl?: string;
    postContext?: { sameDeck?: boolean; contentType?: string; payload?: string };
    requestIntent?: {
      method: 'get' | 'post';
      enctype: string;
      sendReferer: boolean;
      acceptCharset?: string;
      sameDeck: boolean;
      postFields: Array<{ name: string; value: string }>;
    };
  } | null;
  lastScriptDialogRequests?: Array<
    | { type: 'alert'; message: string }
    | { type: 'confirm'; message: string }
    | { type: 'prompt'; message: string; defaultValue?: string }
  >;
  lastScriptExecutionOk?: boolean | null;
  lastScriptExecutionTrap?: string | null;
  lastScriptRequiresRefresh?: boolean | null;
  nextTimerWakeupMs?: number;
  nextCardVar?: string | null;
}

export interface StorySessionExpectation {
  runMode?: 'local' | 'network';
  navigationStatus?: string;
  requestedUrl?: string | null;
  finalUrl?: string | null;
  activeCardId?: string | null;
  focusedLinkIndex?: number;
  externalNavigationIntent?: string | null;
  lastError?: string | null;
}

export interface StoryExpectation {
  state: StoryStateExpectation;
  traceKinds?: string[];
  session?: StorySessionExpectation;
  statusIncludes?: string;
  render?: { textIncludes: string[] };
  frame?: {
    contractVersion: number;
    profileId: string;
    cardId: string;
    affordances: Array<{
      actionId: string;
      label: string;
      source: string;
      control: string;
      enabled: true;
    }>;
  };
}

export type StoryAction =
  | { type: 'key'; key: 'up' | 'down' | 'enter' }
  | { type: 'keyboard'; key: 'ArrowUp' | 'ArrowDown' | 'Enter' | 'Backspace' | 'Escape' }
  | { type: 'type-text'; text: string }
  | { type: 'activate-action'; actionId: string }
  | { type: 'back' }
  | { type: 'tick'; ms: 100 | 1000 }
  | { type: 'clear-intent' };

export interface StoryStep {
  action: StoryAction;
  expect: StoryExpectation;
}

export interface ExecutableStoryFlow {
  id: string;
  title: string;
  target: 'host-sample' | 'waves-browser';
  setup?: { runMode: 'local' | 'network' };
  workItems: string[];
  specItems: string[];
  initial: StoryExpectation;
  steps: StoryStep[];
}

export interface HostExample {
  key: string;
  label: string;
  description: string;
  goal: string;
  workItems: string[];
  specItems: string[];
  testingAc: string[];
  flows?: ExecutableStoryFlow[];
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
    "flows": [
      {
        "id": "failed-accept-go-rolls-back",
        "title": "Failed accept go action does not partially mutate runtime state",
        "target": "host-sample",
        "workItems": [
          "R0-02"
        ],
        "specItems": [
          "WML-18",
          "WML-R-017"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "accept-broken",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "accept-broken",
                "focusedLinkIndex": 0
              },
              "statusIncludes": "Card id not found"
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "ACTION_BACK"
              ]
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"home\">\n    <p>Rollback demo. <a href=\"#accept-broken\">To broken accept</a></p>\n  </card>\n\n  <card id=\"accept-broken\">\n    <do type=\"accept\"><go href=\"#missing\"/></do>\n    <p>Accept action should fail and keep this card active.</p>\n  </card>\n</wml>\n"
  },
  {
    "key": "acceptNoopOrdering",
    "label": "Accept Noop Ordering",
    "description": "Exercises accept-task ordering with an inactive noop binding alongside go/prev/refresh flows.",
    "goal": "Verify noop remains inactive without mutating navigation/history while other accept actions retain expected behavior.",
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
      "Enter \"Accept noop\" then Enter; activeCardId should stay accept-noop, history depth should not change, and no task action should activate."
    ],
    "flows": [
      {
        "id": "accept-noop-preserves-navigation-state",
        "title": "Accept noop leaves the active card and history deterministic",
        "target": "host-sample",
        "workItems": [
          "R0-02"
        ],
        "specItems": [
          "WML-18",
          "WML-R-012",
          "WML-R-015",
          "WML-R-017"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 1
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 2
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 3
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "accept-noop",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "accept-noop",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY"
              ]
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_BACK"
              ]
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"home\">\n    <p>\n      <a href=\"#accept-go\">Accept go</a>\n      <a href=\"#accept-prev\">Accept prev</a>\n      <a href=\"#accept-refresh\">Accept refresh</a>\n      <a href=\"#accept-noop\">Accept noop</a>\n    </p>\n  </card>\n\n  <card id=\"accept-go\">\n    <do type=\"accept\"><go href=\"#target\"/></do>\n    <p>Enter should run accept go.</p>\n  </card>\n\n  <card id=\"accept-prev\">\n    <do type=\"accept\"><prev/></do>\n    <p>Enter should run accept prev.</p>\n  </card>\n\n  <card id=\"accept-refresh\">\n    <do type=\"accept\"><refresh/></do>\n    <p>Enter should run accept refresh.</p>\n  </card>\n\n  <card id=\"accept-noop\">\n    <do type=\"accept\"><noop/></do>\n    <p>Enter should leave the inactive accept noop binding masked.</p>\n  </card>\n\n  <card id=\"target\">\n    <p>Reached via accept go.</p>\n  </card>\n</wml>\n"
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
    "flows": [
      {
        "id": "accept-then-onenterforward-chain",
        "title": "Accept action then onenterforward chain to the final card",
        "target": "host-sample",
        "workItems": [
          "W0-01"
        ],
        "specItems": [
          "RQ-WMLS-018"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0,
            "externalNavigationIntent": null
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "final",
                "focusedLinkIndex": 0,
                "externalNavigationIntent": null
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT",
                "ACTION_FRAGMENT"
              ]
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"home\">\n    <do type=\"accept\">\n      <go href=\"#trigger\"/>\n    </do>\n    <p>Press Enter to run the accept action.</p>\n  </card>\n  <card id=\"trigger\">\n    <onevent type=\"onenterforward\">\n      <go href=\"#final\"/>\n    </onevent>\n    <p>This card should auto-forward to final.</p>\n  </card>\n  <card id=\"final\">\n    <p>Final card reached via onenterforward. <a href=\"#home\">Back home</a></p>\n  </card>\n</wml>\n"
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
    "flows": [
      {
        "id": "accept-and-onenterbackward-prev",
        "title": "Both accept-prev and onenterbackward-prev navigate deterministically",
        "target": "host-sample",
        "workItems": [
          "A5-02"
        ],
        "specItems": [
          "WML-R-012",
          "WML-R-015"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "mid-accept",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_PREV",
                "ACTION_BACK"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 1
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "mid-back",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "next",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ]
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "ACTION_BACK",
                "ACTION_PREV",
                "ACTION_BACK"
              ]
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"home\">\n    <p>\n      Prev task demo.\n      <a href=\"#mid-accept\">To middle (accept prev)</a>\n      <a href=\"#mid-back\">To middle (onenterbackward prev)</a>\n    </p>\n  </card>\n\n  <card id=\"mid-accept\">\n    <do type=\"accept\"><prev/></do>\n    <p>No links on this card; Enter should invoke accept prev.</p>\n  </card>\n\n  <card id=\"mid-back\">\n    <onevent type=\"onenterbackward\"><prev/></onevent>\n    <p><a href=\"#next\">To next</a></p>\n  </card>\n\n  <card id=\"next\">\n    <p>Use host Back to trigger onenterbackward prev in mid-back.</p>\n  </card>\n</wml>\n"
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
    "flows": [
      {
        "id": "refresh-stays-and-failed-entry-rolls-back",
        "title": "Refresh stays on the current card and a failed entry task rolls back",
        "target": "host-sample",
        "workItems": [
          "A5-02"
        ],
        "specItems": [
          "WML-R-012",
          "WML-R-015",
          "WML-R-017"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "refresh-card",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "refresh-card",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_REFRESH"
              ]
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "ACTION_BACK"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 1
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 1
              },
              "statusIncludes": "Card id not found"
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"home\">\n    <p>\n      Refresh + rollback demo.\n      <a href=\"#refresh-card\">To refresh card</a>\n      <a href=\"#broken-forward\">Broken forward entry</a>\n    </p>\n  </card>\n\n  <card id=\"refresh-card\">\n    <do type=\"accept\"><refresh/></do>\n    <p>Enter invokes refresh and stays on this card.</p>\n  </card>\n\n  <card id=\"broken-forward\">\n    <onevent type=\"onenterforward\"><go href=\"#missing\"/></onevent>\n    <p>This card should never become active because entry action fails.</p>\n  </card>\n</wml>\n"
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
    "flows": [
      {
        "id": "accept-go-prev-refresh-and-rollback",
        "title": "Accept tasks preserve go, prev, refresh, and rollback ordering",
        "target": "host-sample",
        "workItems": [
          "A5-02"
        ],
        "specItems": [
          "WML-R-012",
          "WML-R-015",
          "WML-R-017"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "accept-go",
                "focusedLinkIndex": 0
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "target",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "ACTION_ACCEPT",
                "ACTION_FRAGMENT"
              ]
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "accept-go",
                "focusedLinkIndex": 0
              }
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 1
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "accept-prev",
                "focusedLinkIndex": 0
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "ACTION_ACCEPT",
                "ACTION_PREV",
                "ACTION_BACK"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 1
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 2
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "accept-refresh",
                "focusedLinkIndex": 0
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "accept-refresh",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "ACTION_ACCEPT",
                "ACTION_REFRESH"
              ]
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 1
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 2
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 3
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "accept-broken",
                "focusedLinkIndex": 0
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "accept-broken",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "ACTION_ACCEPT",
                "ACTION_FRAGMENT"
              ],
              "statusIncludes": "Key error (enter):"
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "ACTION_FRAGMENT",
                "ACTION_BACK"
              ]
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"home\">\n    <p>\n      <a href=\"#accept-go\">Accept go</a>\n      <a href=\"#accept-prev\">Accept prev</a>\n      <a href=\"#accept-refresh\">Accept refresh</a>\n      <a href=\"#accept-broken\">Accept broken</a>\n    </p>\n  </card>\n\n  <card id=\"accept-go\">\n    <do type=\"accept\"><go href=\"#target\"/></do>\n    <p>Enter should run accept go.</p>\n  </card>\n\n  <card id=\"accept-prev\">\n    <do type=\"accept\"><prev/></do>\n    <p>Enter should run accept prev.</p>\n  </card>\n\n  <card id=\"accept-refresh\">\n    <do type=\"accept\"><refresh/></do>\n    <p>Enter should run accept refresh.</p>\n  </card>\n\n  <card id=\"accept-broken\">\n    <do type=\"accept\"><go href=\"#missing\"/></do>\n    <p>Enter should fail and keep this card active.</p>\n  </card>\n\n  <card id=\"target\">\n    <p>Reached via accept go.</p>\n  </card>\n</wml>\n"
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
    "flows": [
      {
        "id": "fragment-and-external-intent",
        "title": "Fragment navigation and external intent stay separate",
        "target": "host-sample",
        "workItems": [
          "A2-01",
          "A2-02"
        ],
        "specItems": [
          "WML-R-006",
          "WML-R-007"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0,
            "externalNavigationIntent": null
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "next",
                "focusedLinkIndex": 0,
                "externalNavigationIntent": null
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0,
                "externalNavigationIntent": null
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 1,
                "externalNavigationIntent": null
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 1,
                "externalNavigationIntent": "http://example.com/other.wml"
              },
              "traceKinds": [
                "ACTION_EXTERNAL"
              ]
            }
          }
        ]
      },
      {
        "id": "waves-fragment-and-external-intent",
        "title": "Waves UI drives fragment navigation and captures external intent",
        "target": "waves-browser",
        "setup": {
          "runMode": "local"
        },
        "workItems": [
          "A2-01",
          "A2-02"
        ],
        "specItems": [
          "WML-R-006",
          "WML-R-007"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0,
            "externalNavigationIntent": null
          },
          "session": {
            "runMode": "local",
            "navigationStatus": "loaded"
          },
          "render": {
            "textIncludes": [
              "WaveNav Host Harness",
              "Go to next card"
            ]
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "next",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ],
              "render": {
                "textIncludes": [
                  "Second card loaded.",
                  "Return home"
                ]
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0
              }
            }
          },
          {
            "action": {
              "type": "keyboard",
              "key": "ArrowDown"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 1
              }
            }
          },
          {
            "action": {
              "type": "keyboard",
              "key": "Enter"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 1,
                "externalNavigationIntent": "http://example.com/other.wml"
              },
              "traceKinds": [
                "ACTION_EXTERNAL"
              ]
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"home\">\n    <p>WaveNav Host Harness</p>\n    <p>\n      Use ArrowUp / ArrowDown / Enter.<br/>\n      <a href=\"#next\">Go to next card</a><br/>\n      <a href=\"http://example.com/other.wml\">External link (emits host intent)</a>\n    </p>\n  </card>\n  <card id=\"next\">\n    <p>Second card loaded. <a href=\"#home\">Return home</a></p>\n  </card>\n</wml>\n"
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
    "flows": [
      {
        "id": "forward-entry-and-backward-reentry",
        "title": "Forward entry and backward re-entry dispatch at card boundaries",
        "target": "host-sample",
        "workItems": [
          "A2-03"
        ],
        "specItems": [
          "WML-R-008"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "next",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "ACTION_FRAGMENT",
                "ACTION_FRAGMENT"
              ]
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "rewind",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "ACTION_BACK",
                "ACTION_FRAGMENT"
              ]
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"home\">\n    <p>Start card. <a href=\"#transit\">Enter transit</a></p>\n  </card>\n  <card id=\"transit\">\n    <onevent type=\"onenterforward\">\n      <go href=\"#next\"/>\n    </onevent>\n    <onevent type=\"onenterbackward\">\n      <go href=\"#rewind\"/>\n    </onevent>\n    <p>Transit card should not remain active after either entry event.</p>\n  </card>\n  <card id=\"next\">\n    <p>Reached from onenterforward.</p>\n  </card>\n  <card id=\"rewind\">\n    <p>Reached from onenterbackward. <a href=\"#home\">Return home</a></p>\n  </card>\n</wml>\n"
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
    "flows": [
      {
        "id": "relative-absolute-and-fragment-links",
        "title": "Relative and absolute external links emit intent while fragment nav stays separate",
        "target": "host-sample",
        "workItems": [
          "A2-02"
        ],
        "specItems": [
          "WML-R-007"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0,
            "externalNavigationIntent": null
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0,
                "externalNavigationIntent": "http://local.test/next.wml?from=home"
              },
              "traceKinds": [
                "KEY",
                "ACTION_EXTERNAL"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 1
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 1,
                "externalNavigationIntent": "https://example.org/absolute"
              },
              "traceKinds": [
                "KEY",
                "ACTION_EXTERNAL"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 2
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "details",
                "focusedLinkIndex": 0,
                "externalNavigationIntent": "https://example.org/absolute"
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ]
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"home\">\n    <p>External intent demo</p>\n    <p>Enter on first link emits host intent only.</p>\n    <p>\n      <a href=\"next.wml?from=home\">Relative external link</a>\n      <br/>\n      <a href=\"https://example.org/absolute\">Absolute external link</a>\n      <br/>\n      <a href=\"#details\">Internal fragment link</a>\n    </p>\n  </card>\n  <card id=\"details\">\n    <p>Fragment navigation still changes active card. <a href=\"#home\">Back home</a></p>\n  </card>\n</wml>\n"
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
    "flows": [
      {
        "id": "legacy-content-fragment-and-external-links",
        "title": "Legacy-style source ordering keeps fragment and external navigation deterministic",
        "target": "host-sample",
        "workItems": [
          "A1-03",
          "A2-01"
        ],
        "specItems": [
          "WML-R-002",
          "WML-R-006"
        ],
        "initial": {
          "state": {
            "activeCardId": "main",
            "focusedLinkIndex": 0,
            "externalNavigationIntent": null
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "content",
                "focusedLinkIndex": 0,
                "externalNavigationIntent": null
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "content",
                "focusedLinkIndex": 1
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "content",
                "focusedLinkIndex": 1,
                "externalNavigationIntent": "http://local.test/Lectures.wml"
              },
              "traceKinds": [
                "KEY",
                "ACTION_EXTERNAL"
              ]
            }
          }
        ]
      }
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
      "Re-enter select edit, cycle to a new option, and press Enter to commit.",
      "Move focus to the Notes field and press Enter to submit; confirm local mode captures the external intent with the committed Country value."
    ],
    "flows": [
      {
        "id": "select-cycle-cancel-commit-and-submit",
        "title": "Select edit cycles deterministically, survives cancel, and feeds a local submit intent",
        "target": "waves-browser",
        "setup": {
          "runMode": "local"
        },
        "workItems": [
          "A5-05",
          "A5-06"
        ],
        "specItems": [
          "WML-R-019",
          "RQ-RMK-003",
          "RQ-RMK-008"
        ],
        "initial": {
          "state": {
            "activeCardId": "profile",
            "focusedLinkIndex": 0,
            "focusedSelectEditName": null
          },
          "render": {
            "textIncludes": [
              "Jordan"
            ]
          }
        },
        "steps": [
          {
            "action": {
              "type": "keyboard",
              "key": "Enter"
            },
            "expect": {
              "state": {
                "focusedSelectEditName": "Country",
                "focusedSelectEditValue": "Jordan"
              }
            }
          },
          {
            "action": {
              "type": "keyboard",
              "key": "ArrowDown"
            },
            "expect": {
              "state": {
                "focusedSelectEditName": "Country",
                "focusedSelectEditValue": "France"
              },
              "render": {
                "textIncludes": [
                  "France"
                ]
              }
            }
          },
          {
            "action": {
              "type": "keyboard",
              "key": "Escape"
            },
            "expect": {
              "state": {
                "focusedSelectEditName": null,
                "focusedSelectEditValue": null
              },
              "render": {
                "textIncludes": [
                  "Jordan"
                ]
              }
            }
          },
          {
            "action": {
              "type": "keyboard",
              "key": "Enter"
            },
            "expect": {
              "state": {
                "focusedSelectEditName": "Country",
                "focusedSelectEditValue": "Jordan"
              }
            }
          },
          {
            "action": {
              "type": "keyboard",
              "key": "ArrowDown"
            },
            "expect": {
              "state": {
                "focusedSelectEditName": "Country",
                "focusedSelectEditValue": "France"
              }
            }
          },
          {
            "action": {
              "type": "keyboard",
              "key": "Enter"
            },
            "expect": {
              "state": {
                "focusedSelectEditName": null,
                "focusedSelectEditValue": null,
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "SELECT_EDIT_COMMIT"
              ],
              "render": {
                "textIncludes": [
                  "France"
                ]
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "focusedLinkIndex": 1
              }
            }
          },
          {
            "action": {
              "type": "keyboard",
              "key": "Enter"
            },
            "expect": {
              "state": {
                "externalNavigationIntent": "http://local.test/profile",
                "externalNavigationRequestPolicy": {
                  "refererUrl": "http://local.test/examples/formsSelectLocal.wml",
                  "postContext": {
                    "sameDeck": false,
                    "contentType": "application/x-www-form-urlencoded",
                    "payload": "Country=France&notes="
                  },
                  "requestIntent": {
                    "method": "post",
                    "enctype": "application/x-www-form-urlencoded",
                    "sendReferer": true,
                    "sameDeck": false,
                    "postFields": [
                      {
                        "name": "Country",
                        "value": "France"
                      },
                      {
                        "name": "notes",
                        "value": ""
                      }
                    ]
                  }
                }
              },
              "traceKinds": [
                "ACTION_ACCEPT",
                "ACTION_EXTERNAL"
              ],
              "session": {
                "runMode": "local",
                "navigationStatus": "loaded",
                "externalNavigationIntent": "http://local.test/profile"
              },
              "statusIncludes": "Local mode captured external intent"
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"profile\" title=\"Local Select\">\n    <do type=\"accept\">\n      <go method=\"post\" href=\"/profile\" sendreferer=\"true\">\n        <postfield name=\"Country\" value=\"$(Country)\"/>\n        <postfield name=\"notes\" value=\"$(notes)\"/>\n      </go>\n    </do>\n    <p>\n      Country:\n      <select name=\"Country\" title=\"Country\">\n        <option value=\"Jordan\">Jordan</option>\n        <option value=\"France\">France</option>\n        <option value=\"Germany\">Germany</option>\n      </select>\n    </p>\n    <p>Notes: <input name=\"notes\" value=\"\"/></p>\n  </card>\n</wml>\n"
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
    "flows": [
      {
        "id": "waves-merged-select-and-input-edit",
        "title": "Waves combines softkey focus with keyboard select and input editing",
        "target": "waves-browser",
        "setup": {
          "runMode": "local"
        },
        "workItems": [
          "A5-05",
          "A5-06"
        ],
        "specItems": [
          "WML-R-019",
          "RQ-RMK-003",
          "RQ-RMK-008"
        ],
        "initial": {
          "state": {
            "activeCardId": "profile",
            "focusedLinkIndex": 0,
            "focusedInputEditName": null,
            "focusedSelectEditName": null
          },
          "render": {
            "textIncludes": [
              "Help",
              "Jordan",
              "PIN:",
              "Review"
            ]
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "focusedLinkIndex": 1
              }
            }
          },
          {
            "action": {
              "type": "keyboard",
              "key": "Enter"
            },
            "expect": {
              "state": {
                "focusedLinkIndex": 1,
                "focusedSelectEditName": "Country",
                "focusedSelectEditValue": "Jordan"
              }
            }
          },
          {
            "action": {
              "type": "keyboard",
              "key": "ArrowDown"
            },
            "expect": {
              "state": {
                "focusedSelectEditName": "Country",
                "focusedSelectEditValue": "France"
              },
              "render": {
                "textIncludes": [
                  "France"
                ]
              }
            }
          },
          {
            "action": {
              "type": "keyboard",
              "key": "Enter"
            },
            "expect": {
              "state": {
                "focusedLinkIndex": 1,
                "focusedSelectEditName": null,
                "focusedSelectEditValue": null
              },
              "render": {
                "textIncludes": [
                  "France"
                ]
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "focusedLinkIndex": 2
              }
            }
          },
          {
            "action": {
              "type": "type-text",
              "text": "12"
            },
            "expect": {
              "state": {
                "focusedInputEditName": "pin",
                "focusedInputEditValue": "12"
              },
              "render": {
                "textIncludes": [
                  "**"
                ]
              }
            }
          },
          {
            "action": {
              "type": "keyboard",
              "key": "Enter"
            },
            "expect": {
              "state": {
                "focusedInputEditName": null,
                "focusedInputEditValue": null,
                "externalNavigationIntent": "http://local.test/profile",
                "externalNavigationRequestPolicy": {
                  "refererUrl": "http://local.test/examples/formsSelectNavigationLocal.wml",
                  "postContext": {
                    "sameDeck": false,
                    "contentType": "application/x-www-form-urlencoded",
                    "payload": "Country=France&pin=12"
                  },
                  "requestIntent": {
                    "method": "post",
                    "enctype": "application/x-www-form-urlencoded",
                    "sendReferer": true,
                    "sameDeck": false,
                    "postFields": [
                      {
                        "name": "Country",
                        "value": "France"
                      },
                      {
                        "name": "pin",
                        "value": "12"
                      }
                    ]
                  }
                }
              },
              "traceKinds": [
                "INPUT_EDIT_COMMIT",
                "ACTION_ACCEPT",
                "ACTION_EXTERNAL"
              ],
              "session": {
                "runMode": "local",
                "navigationStatus": "loaded",
                "externalNavigationIntent": "http://local.test/profile"
              },
              "statusIncludes": "Local mode captured external intent",
              "render": {
                "textIncludes": [
                  "**"
                ]
              }
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"profile\" title=\"Select Navigation\">\n    <do type=\"accept\">\n      <go method=\"post\" href=\"/profile\" sendreferer=\"true\">\n        <postfield name=\"Country\" value=\"$(Country)\"/>\n        <postfield name=\"pin\" value=\"$(pin)\"/>\n      </go>\n    </do>\n    <p><a href=\"#help\">Help</a></p>\n    <p>\n      Country:\n      <select name=\"Country\" title=\"Country\">\n        <option value=\"Jordan\">Jordan</option>\n        <option value=\"France\">France</option>\n        <option value=\"Germany\">Germany</option>\n        <option value=\"Japan\">Japan</option>\n      </select>\n    </p>\n    <p>PIN: <input name=\"pin\" value=\"\" type=\"password\"/></p>\n    <p><a href=\"#review\">Review</a></p>\n  </card>\n  <card id=\"help\" title=\"Help\">\n    <p>Use Enter to begin or commit select edit.</p>\n    <p>Use Escape to cancel select edit.</p>\n    <p><a href=\"#profile\">Back</a></p>\n  </card>\n  <card id=\"review\" title=\"Review\">\n    <p>Review card reached through normal focus navigation.</p>\n    <p><a href=\"#profile\">Back</a></p>\n  </card>\n</wml>\n"
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
    "flows": [
      {
        "id": "waves-text-edit-and-local-submit-intent",
        "title": "Waves commits text and password edits into a captured local POST intent",
        "target": "waves-browser",
        "setup": {
          "runMode": "local"
        },
        "workItems": [
          "A5-04",
          "A5-06"
        ],
        "specItems": [
          "WML-R-019",
          "RQ-RMK-008"
        ],
        "initial": {
          "state": {
            "activeCardId": "login",
            "focusedLinkIndex": 0,
            "focusedInputEditName": null,
            "externalNavigationIntent": null
          },
          "session": {
            "runMode": "local",
            "navigationStatus": "loaded"
          },
          "render": {
            "textIncludes": [
              "AHMED",
              "PIN:"
            ]
          }
        },
        "steps": [
          {
            "action": {
              "type": "type-text",
              "text": "BOB"
            },
            "expect": {
              "state": {
                "focusedLinkIndex": 0,
                "focusedInputEditName": "username",
                "focusedInputEditValue": "AHMEDBOB"
              },
              "render": {
                "textIncludes": [
                  "AHMEDBOB"
                ]
              }
            }
          },
          {
            "action": {
              "type": "keyboard",
              "key": "ArrowDown"
            },
            "expect": {
              "state": {
                "focusedLinkIndex": 1,
                "focusedInputEditName": null,
                "focusedInputEditValue": null
              },
              "traceKinds": [
                "INPUT_EDIT_START",
                "INPUT_EDIT_COMMIT"
              ]
            }
          },
          {
            "action": {
              "type": "type-text",
              "text": "42"
            },
            "expect": {
              "state": {
                "focusedLinkIndex": 1,
                "focusedInputEditName": "pin",
                "focusedInputEditValue": "42"
              },
              "render": {
                "textIncludes": [
                  "**"
                ]
              }
            }
          },
          {
            "action": {
              "type": "keyboard",
              "key": "Enter"
            },
            "expect": {
              "state": {
                "activeCardId": "login",
                "focusedInputEditName": null,
                "focusedInputEditValue": null,
                "externalNavigationIntent": "http://local.test/login",
                "externalNavigationRequestPolicy": {
                  "refererUrl": "http://local.test/examples/formsTextSubmitLocal.wml",
                  "postContext": {
                    "sameDeck": false,
                    "contentType": "application/x-www-form-urlencoded",
                    "payload": "username=AHMEDBOB&pin=42"
                  },
                  "requestIntent": {
                    "method": "post",
                    "enctype": "application/x-www-form-urlencoded",
                    "sendReferer": true,
                    "sameDeck": false,
                    "postFields": [
                      {
                        "name": "username",
                        "value": "AHMEDBOB"
                      },
                      {
                        "name": "pin",
                        "value": "42"
                      }
                    ]
                  }
                }
              },
              "traceKinds": [
                "INPUT_EDIT_COMMIT",
                "ACTION_ACCEPT",
                "ACTION_EXTERNAL"
              ],
              "session": {
                "runMode": "local",
                "navigationStatus": "loaded",
                "externalNavigationIntent": "http://local.test/login"
              },
              "statusIncludes": "Local mode captured external intent",
              "render": {
                "textIncludes": [
                  "AHMEDBOB",
                  "**"
                ]
              }
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"login\" title=\"Local Login\">\n    <do type=\"accept\">\n      <go method=\"post\" href=\"/login\" sendreferer=\"true\">\n        <postfield name=\"username\" value=\"$(username)\"/>\n        <postfield name=\"pin\" value=\"$(pin)\"/>\n      </go>\n    </do>\n    <p>User: <input name=\"username\" value=\"AHMED\" type=\"text\"/></p>\n    <p>PIN: <input name=\"pin\" value=\"\" type=\"password\"/></p>\n  </card>\n</wml>\n"
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
    "flows": [
      {
        "id": "multi-card-back-process-order",
        "title": "Multi-card history unwinds in order and stops when empty",
        "target": "host-sample",
        "workItems": [
          "R0-02",
          "R0-03"
        ],
        "specItems": [
          "WML-18",
          "WML-07",
          "WML-R-008"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "level-1",
                "focusedLinkIndex": 0
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "level-2",
                "focusedLinkIndex": 0
              }
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "level-1",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "ACTION_BACK"
              ]
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "ACTION_BACK",
                "ACTION_BACK"
              ]
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "ACTION_BACK",
                "ACTION_BACK_EMPTY"
              ]
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"home\">\n    <p>History process-order demo. <a href=\"#level-1\">To level 1</a></p>\n  </card>\n\n  <card id=\"level-1\">\n    <p>Level 1 card. <a href=\"#level-2\">To level 2</a></p>\n  </card>\n\n  <card id=\"level-2\">\n    <p>Level 2 card. <a href=\"#home\">Return home via link</a></p>\n  </card>\n</wml>\n"
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
    "flows": [
      {
        "id": "fragment-back-and-empty-history",
        "title": "Fragment history pops once and then reports empty",
        "target": "host-sample",
        "workItems": [
          "A2-03"
        ],
        "specItems": [
          "WML-R-008"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0,
            "externalNavigationIntent": null
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "next",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ]
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "ACTION_BACK"
              ]
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "ACTION_BACK",
                "ACTION_BACK_EMPTY"
              ]
            }
          }
        ]
      },
      {
        "id": "waves-fragment-back-and-empty-history",
        "title": "Waves keyboard back pops fragment history and reports empty history",
        "target": "waves-browser",
        "setup": {
          "runMode": "local"
        },
        "workItems": [
          "A2-03"
        ],
        "specItems": [
          "WML-R-008"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0
          },
          "render": {
            "textIncludes": [
              "History baseline demo.",
              "Go to next"
            ]
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "next",
                "focusedLinkIndex": 0
              },
              "render": {
                "textIncludes": [
                  "Second card reached by fragment navigation."
                ]
              }
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "ACTION_BACK"
              ],
              "statusIncludes": "engine history"
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "ACTION_BACK",
                "ACTION_BACK_EMPTY"
              ],
              "statusIncludes": "no back history"
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"home\">\n    <p>History baseline demo. <a href=\"#next\">Go to next</a></p>\n  </card>\n  <card id=\"next\">\n    <p>Second card reached by fragment navigation. <a href=\"#home\">Return home via link</a></p>\n  </card>\n</wml>\n"
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
    "flows": [
      {
        "id": "waves-network-missing-fragment-error",
        "title": "Waves fixture fetch preserves state when fragment navigation fails",
        "target": "waves-browser",
        "setup": {
          "runMode": "network"
        },
        "workItems": [
          "A2-01"
        ],
        "specItems": [
          "WML-R-006"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0
          },
          "session": {
            "runMode": "network",
            "navigationStatus": "loaded",
            "finalUrl": "http://fixtures.test/examples/missingFragment.wml"
          },
          "render": {
            "textIncludes": [
              "Missing fragment test",
              "Broken target"
            ]
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY"
              ],
              "session": {
                "navigationStatus": "error"
              },
              "statusIncludes": "Error:",
              "render": {
                "textIncludes": [
                  "Broken target"
                ]
              }
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"home\">\n    <p>Missing fragment test <a href=\"#missing\">Broken target</a></p>\n  </card>\n</wml>\n"
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
    "flows": [
      {
        "id": "backward-entry-redirects-past-middle",
        "title": "Backward navigation triggers onenterbackward before the user resumes input",
        "target": "host-sample",
        "workItems": [
          "A2-03"
        ],
        "specItems": [
          "WML-R-008"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "mid",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "next",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ]
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "rewind",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "ACTION_BACK",
                "ACTION_FRAGMENT"
              ]
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"home\">\n    <p>Start card. <a href=\"#mid\">To middle</a></p>\n  </card>\n  <card id=\"mid\">\n    <onevent type=\"onenterbackward\">\n      <go href=\"#rewind\"/>\n    </onevent>\n    <p>Middle card runs backward-entry action. <a href=\"#next\">To next</a></p>\n  </card>\n  <card id=\"next\">\n    <p>Reached from middle.</p>\n  </card>\n  <card id=\"rewind\">\n    <p>Reached via onenterbackward. <a href=\"#home\">Return home</a></p>\n  </card>\n</wml>\n"
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
    "flows": [
      {
        "id": "unsupported-tag-ignored-and-navigable",
        "title": "Unsupported node is ignored while valid cards remain navigable",
        "target": "host-sample",
        "workItems": [
          "A1-01",
          "A1-03"
        ],
        "specItems": [
          "WML-R-001",
          "WML-R-020"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "next",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ]
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//VENDOR//DTD WML 1.3 PLUS//EN\"\n  \"http://vendor.test/wml13-plus.dtd\">\n<wml>\n  <cardinal id=\"noise\">Ignore me</cardinal>\n  <card id=\"home\">\n    <p>Hello <a href=\"#next\">Next</a></p>\n  </card>\n  <card id=\"next\">\n    <p>Still works. <a href=\"#home\">Back</a></p>\n  </card>\n</wml>\n"
  },
  {
    "key": "scriptLinkExecution",
    "label": "Script Link Execution",
    "description": "Runs a registered, verified WAP-193 compilation unit through a script href and exposes execution outcome in runtime state.",
    "goal": "Validate runtime routes a named WAP-193 function through verification and bounded execution.",
    "workItems": [
      "W0-01",
      "W0-03",
      "W1-02",
      "WMLS-501"
    ],
    "specItems": [
      "RQ-WMLS-001",
      "RQ-WMLS-008",
      "RQ-WMLS-009",
      "RQ-WMLS-010"
    ],
    "testingAc": [
      "Load the example and press Enter on \"Run WAP-193 script\"; activeCardId should stay home.",
      "Confirm runtime-state lastScriptExecutionOk becomes true.",
      "Confirm runtime-state lastScriptExecutionTrap remains (none).",
      "Select \"Reject invalid WAP-193 script\", confirm the fatal/integrity stack-underflow outcome, then run the valid script again to prove host recovery."
    ],
    "flows": [
      {
        "id": "script-link-success-and-navigation-continuity",
        "title": "A script link succeeds without disrupting subsequent navigation",
        "target": "host-sample",
        "workItems": [
          "W0-01",
          "W0-03",
          "WMLS-501"
        ],
        "specItems": [
          "RQ-WMLS-001",
          "RQ-WMLS-008",
          "RQ-WMLS-009"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0,
            "lastScriptExecutionOk": null,
            "lastScriptExecutionTrap": null
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0,
                "lastScriptExecutionOk": true,
                "lastScriptExecutionTrap": null
              },
              "traceKinds": [
                "ACTION_SCRIPT",
                "SCRIPT_OK"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 1
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "done",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "SCRIPT_OK",
                "ACTION_FRAGMENT"
              ]
            }
          }
        ]
      },
      {
        "id": "verifier-failure-and-recovery",
        "title": "A fatal verifier failure is stable and a replacement invocation recovers",
        "target": "host-sample",
        "workItems": [
          "WMLS-501",
          "W1-02"
        ],
        "specItems": [
          "RQ-WMLS-008",
          "RQ-WMLS-009",
          "RQ-WMLS-010"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0,
            "lastScriptExecutionOk": null,
            "lastScriptExecutionTrap": null
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 1
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 2
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 2,
                "lastScriptExecutionOk": false,
                "lastScriptExecutionTrap": "wap decode: stack underflow in function 0 at pc=0 (required=1, available=0)"
              },
              "traceKinds": [
                "ACTION_SCRIPT",
                "SCRIPT_TRAP"
              ],
              "statusIncludes": "stack underflow"
            }
          },
          {
            "action": {
              "type": "key",
              "key": "up"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 1
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "up"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0,
                "lastScriptExecutionOk": true,
                "lastScriptExecutionTrap": null
              },
              "traceKinds": [
                "SCRIPT_TRAP",
                "ACTION_SCRIPT",
                "SCRIPT_OK"
              ]
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"home\">\n    <p>\n      Script action execution demo.\n      <a href=\"script:wap-193-minimal-return-es.wmlsc#main\">Run WAP-193 script</a>\n      <br/>\n      <a href=\"#done\">Continue</a>\n      <br/>\n      <a href=\"script:wap-193-stack-underflow.wmlsc#main\">Reject invalid WAP-193 script</a>\n    </p>\n  </card>\n  <card id=\"done\">\n    <p>Script executed in previous card. <a href=\"#home\">Back</a></p>\n  </card>\n</wml>\n"
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
    "flows": [
      {
        "id": "nonzero-timer-host-clock-expiry",
        "title": "A nonzero timer advances through host ticks and expires once",
        "target": "host-sample",
        "workItems": [
          "A5-03"
        ],
        "specItems": [
          "WML-R-014"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "timed",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "ACTION_FRAGMENT",
                "TIMER_START"
              ]
            }
          },
          {
            "action": {
              "type": "tick",
              "ms": 1000
            },
            "expect": {
              "state": {
                "activeCardId": "timed",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "TIMER_START",
                "TIMER_TICK"
              ]
            }
          },
          {
            "action": {
              "type": "tick",
              "ms": 100
            },
            "expect": {
              "state": {
                "activeCardId": "timed",
                "focusedLinkIndex": 0
              }
            }
          },
          {
            "action": {
              "type": "tick",
              "ms": 100
            },
            "expect": {
              "state": {
                "activeCardId": "timed",
                "focusedLinkIndex": 0
              }
            }
          },
          {
            "action": {
              "type": "tick",
              "ms": 100
            },
            "expect": {
              "state": {
                "activeCardId": "timed",
                "focusedLinkIndex": 0
              }
            }
          },
          {
            "action": {
              "type": "tick",
              "ms": 100
            },
            "expect": {
              "state": {
                "activeCardId": "timed",
                "focusedLinkIndex": 0
              }
            }
          },
          {
            "action": {
              "type": "tick",
              "ms": 100
            },
            "expect": {
              "state": {
                "activeCardId": "done",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "TIMER_TICK",
                "TIMER_EXPIRE",
                "ACTION_ONTIMER",
                "ACTION_FRAGMENT"
              ]
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"home\">\n    <p><a href=\"#timed\">Start timed card</a></p>\n  </card>\n  <card id=\"timed\">\n    <onevent type=\"ontimer\"><go href=\"#done\"/></onevent>\n    <timer value=\"15\"/>\n    <p>Auto tick should move this card after 1.5 seconds.</p>\n  </card>\n  <card id=\"done\">\n    <p>Timer completed through host clock lifecycle.</p>\n  </card>\n</wml>\n"
  },
  {
    "key": "timerOntimerImmediate",
    "label": "Timer Zero Disabled",
    "description": "Demonstrates that `<timer value=\"0\"/>` disables ontimer dispatch at card-entry boundaries.",
    "goal": "Verify a zero timer remains inactive and publishes no host wakeup.",
    "workItems": [
      "WML-305"
    ],
    "specItems": [
      "WML-CL-TIMER-INVALID-VALUE"
    ],
    "testingAc": [
      "Press Enter on \"To timed\" from home.",
      "Confirm activeCardId remains timed after a deterministic one-second tick.",
      "Confirm trace includes TIMER_IGNORE and does not include ACTION_ONTIMER."
    ],
    "flows": [
      {
        "id": "zero-timer-disabled",
        "title": "Zero-value timer disables ontimer dispatch",
        "target": "host-sample",
        "workItems": [
          "WML-305"
        ],
        "specItems": [
          "WML-CL-TIMER-INVALID-VALUE"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0,
            "externalNavigationIntent": null
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "timed",
                "focusedLinkIndex": 0,
                "externalNavigationIntent": null
              },
              "traceKinds": [
                "ACTION_FRAGMENT",
                "TIMER_IGNORE"
              ]
            }
          },
          {
            "action": {
              "type": "tick",
              "ms": 1000
            },
            "expect": {
              "state": {
                "activeCardId": "timed",
                "focusedLinkIndex": 0,
                "externalNavigationIntent": null
              }
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"home\">\n    <p><a href=\"#timed\">To timed</a></p>\n  </card>\n  <card id=\"timed\">\n    <onevent type=\"ontimer\"><go href=\"#next\"/></onevent>\n    <timer value=\"0\"/>\n    <p>Zero timer remains disabled.</p>\n  </card>\n  <card id=\"next\">\n    <p>Reached via ontimer dispatch.</p>\n  </card>\n</wml>\n"
  },
  {
    "key": "timerScriptDialog",
    "label": "Timer Script Dialog",
    "description": "Demonstrates a runtime-owned WML timer invoking a WaveScript alert host capability at expiry.",
    "goal": "Verify timer expiry dispatches ontimer, invokes the script, and publishes the dialog request in deterministic order.",
    "workItems": [
      "W0-05"
    ],
    "specItems": [
      "RQ-WMLS-022"
    ],
    "testingAc": [
      "Press Enter on \"Start timer\" to enter the timed card.",
      "Advance the deterministic runtime clock by 1000ms.",
      "Confirm the trace orders TIMER_EXPIRE, ACTION_ONTIMER, ACTION_SCRIPT, DIALOG_ALERT, and SCRIPT_OK.",
      "Confirm the dialog request is published only after the script invocation boundary."
    ],
    "flows": [
      {
        "id": "timer-expiry-script-dialog-order",
        "title": "Timer expiry invokes script and publishes dialog capability in order",
        "target": "host-sample",
        "workItems": [
          "W0-05"
        ],
        "specItems": [
          "RQ-WMLS-022"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0,
            "externalNavigationIntent": null,
            "lastScriptDialogRequests": []
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "timed",
                "focusedLinkIndex": 0,
                "externalNavigationIntent": null,
                "lastScriptDialogRequests": []
              },
              "traceKinds": [
                "ACTION_FRAGMENT",
                "TIMER_START"
              ]
            }
          },
          {
            "action": {
              "type": "tick",
              "ms": 1000
            },
            "expect": {
              "state": {
                "activeCardId": "timed",
                "focusedLinkIndex": 0,
                "externalNavigationIntent": null,
                "lastScriptDialogRequests": [
                  {
                    "type": "alert",
                    "message": "Timer expired"
                  }
                ]
              },
              "traceKinds": [
                "TIMER_TICK",
                "TIMER_EXPIRE",
                "ACTION_ONTIMER",
                "ACTION_SCRIPT",
                "DIALOG_ALERT",
                "SCRIPT_OK"
              ]
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"home\">\n    <p><a href=\"#timed\">Start timer</a></p>\n  </card>\n  <card id=\"timed\">\n    <onevent type=\"ontimer\">\n      <go href=\"script:timer-dialog.wmlsc#showExpiryAlert\"/>\n    </onevent>\n    <timer value=\"10\"/>\n    <p>Waiting for the runtime timer.</p>\n  </card>\n</wml>\n"
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
    "flows": [
      {
        "id": "script-go-cancel-clears-pending-navigation",
        "title": "Script go followed by cancel leaves navigation unchanged",
        "target": "host-sample",
        "workItems": [
          "W0-04"
        ],
        "specItems": [
          "RQ-WMLS-018"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0,
            "externalNavigationIntent": null,
            "lastScriptExecutionOk": null
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0,
                "externalNavigationIntent": null,
                "lastScriptExecutionOk": true,
                "lastScriptExecutionTrap": null
              },
              "traceKinds": [
                "ACTION_SCRIPT",
                "SCRIPT_OK"
              ]
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"home\">\n    <p>\n      go(\"#next\") then go(\"\") in one script invocation.\n      <a href=\"script:wavescript-fixtures.wmlsc#goCancel\">Script go then cancel</a>\n    </p>\n  </card>\n  <card id=\"next\">\n    <p>If you can read this from the script link, cancellation regressed. <a href=\"#home\">Back</a></p>\n  </card>\n</wml>\n"
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
    "flows": [
      {
        "id": "script-navigation-order-and-external-outcome",
        "title": "Script navigation is last-call-wins for cancel, fragment, and external outcomes",
        "target": "host-sample",
        "workItems": [
          "W0-04"
        ],
        "specItems": [
          "RQ-WMLS-018"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0,
            "externalNavigationIntent": null
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0,
                "externalNavigationIntent": null,
                "lastScriptExecutionOk": true
              },
              "traceKinds": [
                "ACTION_SCRIPT",
                "SCRIPT_OK"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 1
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "next",
                "focusedLinkIndex": 0,
                "externalNavigationIntent": null,
                "lastScriptExecutionOk": true
              },
              "traceKinds": [
                "ACTION_SCRIPT",
                "SCRIPT_OK"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "next",
                "focusedLinkIndex": 0,
                "externalNavigationIntent": "http://local.test/next.wml?from=script",
                "lastScriptExecutionOk": true
              },
              "traceKinds": [
                "ACTION_SCRIPT",
                "SCRIPT_OK"
              ]
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"home\">\n    <p>\n      Navigation ordering matrix.\n      <a href=\"script:wavescript-fixtures.wmlsc#goThenPrev\">go then prev</a>\n      <br/>\n      <a href=\"script:wavescript-fixtures.wmlsc#prevThenGo\">prev then go</a>\n    </p>\n  </card>\n  <card id=\"next\">\n    <p>\n      Reached via prev-then-go ordering.\n      <a href=\"script:wavescript-fixtures.wmlsc#externalGo\">Script external go</a>\n      <br/>\n      <a href=\"#home\">Back home</a>\n    </p>\n  </card>\n</wml>\n"
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
    "flows": [
      {
        "id": "script-refresh-without-navigation",
        "title": "Script variable mutation requests refresh without navigation",
        "target": "host-sample",
        "workItems": [
          "W0-04"
        ],
        "specItems": [
          "RQ-WMLS-017",
          "RQ-WMLS-021"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0,
            "nextCardVar": null,
            "externalNavigationIntent": null,
            "lastScriptRequiresRefresh": null
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0,
                "nextCardVar": "updated",
                "externalNavigationIntent": null,
                "lastScriptExecutionOk": true,
                "lastScriptRequiresRefresh": true
              },
              "traceKinds": [
                "ACTION_SCRIPT",
                "SCRIPT_OK"
              ]
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"home\">\n    <p>\n      Refresh policy demo (no navigation).\n      <a href=\"script:wavescript-fixtures.wmlsc#refreshOnly\">Script setVar only</a>\n    </p>\n  </card>\n</wml>\n"
  },
  {
    "key": "wml202TemplateShadowing",
    "label": "WML Deck Metadata, Card Context, and Template Task Shadowing",
    "description": "Root language plus ordered deck access/meta data coexist with a deck-level accept binding that is inherited, overridden, and then masked by a newcontext card binding with the same effective name.",
    "goal": "Verify a stable deck/head/access/meta/language parse path plus deterministic template inheritance, card precedence, inactive noop masking, and go-only newcontext history clearing.",
    "workItems": [
      "R0-04",
      "R0-12",
      "C5-03",
      "WML-202"
    ],
    "specItems": [
      "WML-C-08",
      "WML-C-21",
      "WML-C-30",
      "WML-C-34",
      "WML-C-47",
      "WML-C-53"
    ],
    "testingAc": [
      "Load the example; its ordered head access/meta model is accepted without changing the first-card render.",
      "Load the example and activate Enter on inherited; the unshadowed template binding navigates to override.",
      "Activate Enter on override; the same-named card binding replaces the template task and navigates to masked.",
      "Activate Enter on masked; the card-level noop masks both bindings and produces no task action.",
      "Navigate Back from masked; newcontext has cleared the prior card history, so masked remains active."
    ],
    "flows": [
      {
        "id": "template-inherit-override-and-noop-mask",
        "title": "Template accept inheritance yields to card override and noop mask",
        "target": "host-sample",
        "workItems": [
          "R0-04",
          "R0-12",
          "C5-03",
          "WML-202"
        ],
        "specItems": [
          "WML-C-08",
          "WML-C-21",
          "WML-C-30",
          "WML-C-34",
          "WML-C-47",
          "WML-C-53"
        ],
        "initial": {
          "state": {
            "activeCardId": "inherited",
            "focusedLinkIndex": 0,
            "externalNavigationIntent": null
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "override",
                "focusedLinkIndex": 0,
                "externalNavigationIntent": null
              },
              "traceKinds": [
                "KEY",
                "ACTION_ACCEPT",
                "ACTION_FRAGMENT"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "masked",
                "focusedLinkIndex": 0,
                "externalNavigationIntent": null
              },
              "traceKinds": [
                "KEY",
                "ACTION_ACCEPT",
                "ACTION_FRAGMENT",
                "KEY",
                "ACTION_ACCEPT",
                "ACTION_FRAGMENT"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "masked",
                "focusedLinkIndex": 0,
                "externalNavigationIntent": null
              },
              "traceKinds": [
                "KEY",
                "ACTION_ACCEPT",
                "ACTION_FRAGMENT",
                "KEY",
                "ACTION_ACCEPT",
                "ACTION_FRAGMENT",
                "KEY"
              ]
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "masked",
                "focusedLinkIndex": 0,
                "externalNavigationIntent": null
              },
              "traceKinds": [
                "NEWCONTEXT",
                "ACTION_BACK_EMPTY"
              ]
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml xml:lang=\"en\">\n  <head>\n    <meta name=\"scenario\" content=\"wml-202\" scheme=\"work-item\"/>\n    <access domain=\"example.test\" path=\"/examples\"/>\n    <meta http-equiv=\"Cache-Control\" content=\"max-age=60\" forua=\"true\"/>\n  </head>\n  <template>\n    <do type=\"accept\" name=\"primary\" label=\"Deck next\">\n      <go href=\"#override\"/>\n    </do>\n  </template>\n  <card id=\"inherited\">\n    <p>The template accept task is active on this card.</p>\n  </card>\n  <card id=\"override\" xml:lang=\"fr\" ordered=\"false\">\n    <do type=\"accept\" name=\"primary\" label=\"Card next\">\n      <go href=\"#masked\"/>\n    </do>\n    <p>The card accept task shadows the template task.</p>\n  </card>\n  <card id=\"masked\" newcontext=\"true\">\n    <do type=\"accept\" name=\"primary\">\n      <noop/>\n    </do>\n    <p>The same-named noop masks both accept tasks.</p>\n  </card>\n</wml>\n"
  },
  {
    "key": "wml203DtdFamily",
    "label": "WML 1.3 Selected DTD Family",
    "description": "Canonical WML 1.3 text exercising every selected DTD element family through the strict engine boundary.",
    "goal": "Verify mandatory prologue handling and deterministic parsing/rendering across the selected WML 1.3 document family.",
    "workItems": [
      "WML-203"
    ],
    "specItems": [
      "WML-CL-PROLOGUE-REQUIRED",
      "WML-CL-WML-ROOT-STRUCTURE",
      "WML-CL-CARD-STRUCTURE",
      "WML-CL-CARD-CONTENT-ORDER",
      "WML-CL-DO-STRUCTURE",
      "WML-CL-ONEVENT-SINGLE-TASK",
      "WML-CL-GO-STRUCTURE",
      "WML-CL-SELECT-STRUCTURE",
      "WML-CL-TABLE-STRUCTURE"
    ],
    "testingAc": [
      "Load the example and confirm the main card renders representative text, table, and option content without a parser error.",
      "Move focus once and confirm the active card and rendered family content remain deterministic."
    ],
    "flows": [
      {
        "id": "strict-selected-dtd-family-render",
        "title": "Strict WML 1.3 prologue and selected DTD family render deterministically",
        "target": "waves-browser",
        "setup": {
          "runMode": "local"
        },
        "workItems": [
          "WML-203"
        ],
        "specItems": [
          "WML-CL-PROLOGUE-REQUIRED",
          "WML-CL-WML-ROOT-STRUCTURE",
          "WML-CL-CARD-STRUCTURE",
          "WML-CL-CARD-CONTENT-ORDER",
          "WML-CL-DO-STRUCTURE",
          "WML-CL-ONEVENT-SINGLE-TASK",
          "WML-CL-GO-STRUCTURE",
          "WML-CL-SELECT-STRUCTURE",
          "WML-CL-TABLE-STRUCTURE"
        ],
        "initial": {
          "state": {
            "activeCardId": "main",
            "focusedLinkIndex": 0,
            "externalNavigationIntent": null
          },
          "render": {
            "textIncludes": [
              "Family",
              "Cell",
              "One",
              "Pre"
            ]
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "main",
                "focusedLinkIndex": 1,
                "externalNavigationIntent": null
              },
              "traceKinds": [
                "KEY"
              ],
              "render": {
                "textIncludes": [
                  "Family",
                  "Cell",
                  "One",
                  "Pre"
                ]
              }
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml id=\"family\" xml:lang=\"en\">\n  <head>\n    <access domain=\"example.test\" path=\"/apps\"/>\n    <meta name=\"scenario\" content=\"wml-203\"/>\n  </head>\n  <template>\n    <do type=\"options\" name=\"template-options\"><noop/></do>\n    <onevent type=\"onenterbackward\"><noop/></onevent>\n  </template>\n  <card id=\"main\" title=\"WML family\" newcontext=\"false\" ordered=\"true\">\n    <onevent type=\"onenterforward\"><noop/></onevent>\n    <timer name=\"clock\" value=\"10\"/>\n    <do type=\"accept\" name=\"submit\">\n      <go href=\"#next\" method=\"post\">\n        <postfield name=\"q\" value=\"x\"/>\n        <setvar name=\"q\" value=\"x\"/>\n      </go>\n    </do>\n    <p align=\"left\" mode=\"wrap\">\n      Family <em>em <strong>strong <b>bold <i>italic <u>under\n      <big>big <small>small</small></big></u></i></b></strong></em><br/>\n      <img alt=\"diagram\" src=\"diagram.png\" align=\"bottom\"/>\n      <anchor title=\"refresh\">Refresh<refresh><setvar name=\"q\" value=\"y\"/></refresh></anchor>\n      <a href=\"#next\">Next</a>\n      <table columns=\"1\"><tr><td>Cell</td></tr></table>\n      <input name=\"field\" type=\"text\"/>\n      <select name=\"choice\">\n        <optgroup title=\"Group\">\n          <option value=\"1\">One<onevent type=\"onpick\"><noop/></onevent></option>\n        </optgroup>\n      </select>\n      <fieldset title=\"More\"><input name=\"extra\"/></fieldset>\n    </p>\n    <pre xml:space=\"preserve\">Pre <anchor>Back<prev/></anchor><do type=\"reset\" name=\"reset\"><noop/></do></pre>\n  </card>\n  <card id=\"next\"><p>Done</p></card>\n</wml>\n"
  },
  {
    "key": "wml203WbxmlParity",
    "label": "WML 1.3 WBXML Structural Parity",
    "description": "Canonical WML 1.3 text matching the transport decoder's binary-basic-deck output.",
    "goal": "Verify the text-only engine ingests and renders the same canonical deck model as the reconstructed binary WBXML transport path.",
    "workItems": [
      "WML-203"
    ],
    "specItems": [
      "WBXML-C-001",
      "WBXML-C-010",
      "WBXML-C-011",
      "WML-C-17"
    ],
    "testingAc": [
      "Load the example and confirm the main card renders Hello without a parser error."
    ],
    "flows": [
      {
        "id": "canonical-doctype-deck-render",
        "title": "Canonical WML 1.3 text matches reconstructed WBXML engine rendering",
        "target": "waves-browser",
        "setup": {
          "runMode": "local"
        },
        "workItems": [
          "WML-203"
        ],
        "specItems": [
          "WBXML-C-001",
          "WBXML-C-010",
          "WBXML-C-011",
          "WML-C-17"
        ],
        "initial": {
          "state": {
            "activeCardId": "main",
            "focusedLinkIndex": 0,
            "externalNavigationIntent": null
          },
          "render": {
            "textIncludes": [
              "Hello"
            ]
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "main",
                "focusedLinkIndex": 0,
                "externalNavigationIntent": null
              },
              "traceKinds": [
                "KEY"
              ],
              "render": {
                "textIncludes": [
                  "Hello"
                ]
              }
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"main\" newcontext=\"false\" ordered=\"true\">\n    <p align=\"left\">Hello</p>\n  </card>\n</wml>\n"
  },
  {
    "key": "wml204ControlValidation",
    "label": "WML 1.3 Control Validation",
    "description": "Source-valid WML fieldset, input, select, and option controls with declared attributes exercised by the strict parser.",
    "goal": "Verify the simulator accepts the declared grouped-control grammar, processes fieldset children, and renders deterministic text, password, and single-select controls.",
    "workItems": [
      "B5-01",
      "R0-04",
      "WML-204"
    ],
    "specItems": [
      "WML-C-33",
      "WML-C-41",
      "WML-C-43"
    ],
    "testingAc": [
      "Load the example and confirm the fieldset's User, PIN, and Country controls render without a parser error.",
      "Focus the PIN field, clear it, enter alphabetic text, and confirm the mask rejects the commit while preserving the retry draft.",
      "Correct the PIN to one through four digits, commit it, and confirm its rendered value remains visually masked.",
      "Follow Verify PIN variable and confirm the committed password value initializes the proof field through vdata without being lost.",
      "Confirm escaped literal dollars and undefined variables are evaluated deterministically in the proof controls.",
      "Focus Country, move to France, press Enter, and confirm the committed option is rendered."
    ],
    "flows": [
      {
        "id": "waves-input-rejection-retry-and-password-state",
        "title": "Waves rejects invalid input atomically and preserves committed password state",
        "target": "waves-browser",
        "setup": {
          "runMode": "local"
        },
        "workItems": [
          "B5-01",
          "R0-04",
          "WML-204"
        ],
        "specItems": [
          "WML-C-33",
          "WML-C-41",
          "WML-C-43"
        ],
        "initial": {
          "state": {
            "activeCardId": "controls",
            "focusedLinkIndex": 0,
            "focusedInputEditName": null
          },
          "render": {
            "textIncludes": [
              "AHMED",
              "****",
              "Verify PIN variable",
              "Jordan"
            ]
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "focusedLinkIndex": 1,
                "focusedInputEditName": null
              }
            }
          },
          {
            "action": {
              "type": "type-text",
              "text": "x"
            },
            "expect": {
              "state": {
                "focusedLinkIndex": 1,
                "focusedInputEditName": "Pin",
                "focusedInputEditValue": "1234"
              },
              "traceKinds": [
                "INPUT_EDIT_START"
              ]
            }
          },
          {
            "action": {
              "type": "keyboard",
              "key": "Backspace"
            },
            "expect": {
              "state": {
                "focusedInputEditName": "Pin",
                "focusedInputEditValue": "123"
              }
            }
          },
          {
            "action": {
              "type": "keyboard",
              "key": "Backspace"
            },
            "expect": {
              "state": {
                "focusedInputEditName": "Pin",
                "focusedInputEditValue": "12"
              }
            }
          },
          {
            "action": {
              "type": "keyboard",
              "key": "Backspace"
            },
            "expect": {
              "state": {
                "focusedInputEditName": "Pin",
                "focusedInputEditValue": "1"
              }
            }
          },
          {
            "action": {
              "type": "keyboard",
              "key": "Backspace"
            },
            "expect": {
              "state": {
                "focusedInputEditName": "Pin",
                "focusedInputEditValue": ""
              }
            }
          },
          {
            "action": {
              "type": "type-text",
              "text": "ab"
            },
            "expect": {
              "state": {
                "focusedInputEditName": "Pin",
                "focusedInputEditValue": "ab"
              },
              "render": {
                "textIncludes": [
                  "**"
                ]
              }
            }
          },
          {
            "action": {
              "type": "keyboard",
              "key": "Enter"
            },
            "expect": {
              "state": {
                "focusedInputEditName": "Pin",
                "focusedInputEditValue": "ab"
              },
              "traceKinds": [
                "INPUT_EDIT_START",
                "INPUT_EDIT_REJECT"
              ],
              "statusIncludes": "value does not conform to format mask"
            }
          },
          {
            "action": {
              "type": "keyboard",
              "key": "Backspace"
            },
            "expect": {
              "state": {
                "focusedInputEditName": "Pin",
                "focusedInputEditValue": "a"
              }
            }
          },
          {
            "action": {
              "type": "keyboard",
              "key": "Backspace"
            },
            "expect": {
              "state": {
                "focusedInputEditName": "Pin",
                "focusedInputEditValue": ""
              }
            }
          },
          {
            "action": {
              "type": "type-text",
              "text": "987"
            },
            "expect": {
              "state": {
                "focusedInputEditName": "Pin",
                "focusedInputEditValue": "987"
              },
              "render": {
                "textIncludes": [
                  "***"
                ]
              }
            }
          },
          {
            "action": {
              "type": "keyboard",
              "key": "Enter"
            },
            "expect": {
              "state": {
                "focusedInputEditName": null,
                "focusedInputEditValue": null
              },
              "traceKinds": [
                "INPUT_EDIT_START",
                "INPUT_EDIT_REJECT",
                "INPUT_EDIT_COMMIT"
              ],
              "render": {
                "textIncludes": [
                  "***"
                ]
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "focusedLinkIndex": 2
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "proof",
                "focusedLinkIndex": 0
              },
              "render": {
                "textIncludes": [
                  "Committed PIN:",
                  "PinProof: 987",
                  "DollarProof: $987",
                  "MissingProof: prepost"
                ]
              }
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"controls\" title=\"WML Controls\">\n    <do type=\"accept\"><noop/></do>\n    <p>\n      <fieldset title=\"Account controls\">\n        User:\n        <input\n          name=\"UserName\"\n          title=\"User name\"\n          type=\"text\"\n          value=\"AHMED\"\n          size=\"12\"\n          maxlength=\"24\"\n          tabindex=\"1\"\n          accesskey=\"1\"\n        />\n        <br/>\n        PIN:\n        <input\n          name=\"Pin\"\n          title=\"Numeric PIN\"\n          type=\"password\"\n          value=\"1234\"\n          format=\"4N\"\n          emptyok=\"false\"\n          size=\"4\"\n          maxlength=\"4\"\n          tabindex=\"2\"\n          accesskey=\"2\"\n        />\n        <br/>\n        <a href=\"#proof\">Verify PIN variable</a>\n        <br/>\n        Country:\n        <select\n          name=\"Country\"\n          title=\"Country\"\n          multiple=\"false\"\n          iname=\"CountryIndex\"\n          ivalue=\"1\"\n          tabindex=\"3\"\n        >\n          <option value=\"Jordan\" title=\"Jordan\">Jordan</option>\n          <option value=\"France\" title=\"France\">France</option>\n          <option value=\"Germany\" title=\"Germany\">Germany</option>\n        </select>\n      </fieldset>\n    </p>\n  </card>\n  <card id=\"proof\" title=\"PIN Variable Proof\">\n    <p>Committed PIN:</p>\n    <p><input name=\"PinProof\" value=\"$(Pin)\" format=\"4N\"/></p>\n    <p><input name=\"DollarProof\" value=\"$$$(Pin)\"/></p>\n    <p><input name=\"MissingProof\" value=\"pre$(Missing)post\"/></p>\n  </card>\n</wml>\n"
  },
  {
    "key": "wml204SelectSemantics",
    "label": "WML 1.3 Select Semantics",
    "description": "Source-derived nested optgroup traversal, single-select initialization, and user-commit behavior with name and iname variables.",
    "goal": "Verify that ignored optgroup hierarchy still processes options in document order, ivalue preselection initializes both result variables, and a committed user choice updates them deterministically.",
    "workItems": [
      "R0-04",
      "C5-05",
      "WML-204"
    ],
    "specItems": [
      "WML-C-41",
      "WML-C-43"
    ],
    "testingAc": [
      "Load the example and confirm nested optgroup children are processed and France is initially selected from ivalue 2.",
      "Confirm nextCard is initialized to France and nextCardIndex is initialized to 2.",
      "Confirm the following input initializes from nextCard, proving select-before-input document order.",
      "Begin select editing, move once to Germany, and confirm the draft does not change the committed variable.",
      "Commit Germany and confirm its vdata value remains raw while its onpick HREF escapes reserved characters."
    ],
    "flows": [
      {
        "id": "initialization-and-user-commit",
        "title": "Select initialization and committed user state stay deterministic",
        "target": "host-sample",
        "workItems": [
          "R0-04",
          "C5-05",
          "WML-204"
        ],
        "specItems": [
          "WML-C-41",
          "WML-C-43"
        ],
        "initial": {
          "state": {
            "activeCardId": "select-semantics",
            "focusedLinkIndex": 0,
            "nextCardVar": "France",
            "externalNavigationIntent": null
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "select-semantics",
                "focusedLinkIndex": 0,
                "nextCardVar": "France"
              },
              "traceKinds": [
                "SELECT_EDIT_START"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "select-semantics",
                "focusedLinkIndex": 0,
                "nextCardVar": "France"
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "select-semantics",
                "focusedLinkIndex": 0,
                "nextCardVar": "A B/C?D=E&F",
                "externalNavigationIntent": "http://local.test/choose/A%20B%2FC%3FD%3DE%26F"
              },
              "traceKinds": [
                "SELECT_EDIT_START",
                "SELECT_EDIT_COMMIT"
              ]
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"select-semantics\" title=\"Select Semantics\">\n    <p>\n      Destination:\n      <select\n        name=\"nextCard\"\n        iname=\"nextCardIndex\"\n        ivalue=\"2\"\n        title=\"Destination\"\n      >\n        <optgroup title=\"Destinations\">\n          <option value=\"Jordan\">Jordan</option>\n          <optgroup title=\"Europe\">\n            <option value=\"France\">France</option>\n            <option value=\"$(route)\" onpick=\"/choose/$(route)\">Germany</option>\n          </optgroup>\n        </optgroup>\n      </select>\n      <input name=\"selectionProof\" value=\"$(nextCard)\"/>\n      <input name=\"route\" value=\"A B/C?D=E&amp;F\"/>\n    </p>\n  </card>\n</wml>\n"
  },
  {
    "key": "wml205ErrorRecovery",
    "label": "WML 1.3 Deterministic Error Recovery",
    "description": "Alternate-DTD extensions recover deterministically, while failed external fetch and access-control tasks preserve the invoking card and pending intent.",
    "goal": "Verify recoverable content remains navigable and host task failures are visible without partially committing a deck transition.",
    "workItems": [
      "WML-205"
    ],
    "specItems": [
      "WML-C-16",
      "WML-C-17",
      "WML-C-18",
      "WML-C-29"
    ],
    "testingAc": [
      "Load the example and confirm recognized content nested in the vendor wrapper remains visible.",
      "Confirm supported metadata coexists with the recovered vendor extension.",
      "Activate Recovery proof and confirm deterministic navigation reaches the proof card.",
      "Activate Missing target in network mode and confirm the fetch failure is reported while the invoking card, render, and pending intent remain unchanged.",
      "Activate Restricted target in network mode and confirm access denial is reported while the invoking card, render, and pending intent remain unchanged."
    ],
    "flows": [
      {
        "id": "alternate-dtd-content-recovery",
        "title": "Alternate-DTD extension content recovers without losing navigation",
        "target": "waves-browser",
        "setup": {
          "runMode": "local"
        },
        "workItems": [
          "WML-205"
        ],
        "specItems": [
          "WML-C-16",
          "WML-C-17"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0,
            "externalNavigationIntent": null
          },
          "render": {
            "textIncludes": [
              "Before extension.",
              "Recovered extension content.",
              "After extension."
            ]
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "proof",
                "focusedLinkIndex": 0,
                "externalNavigationIntent": null
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ],
              "render": {
                "textIncludes": [
                  "Recovered content stayed deterministic and navigable."
                ]
              }
            }
          }
        ]
      },
      {
        "id": "fetch-failure-preserves-invoking-task-state",
        "title": "A failed external fetch notifies the user without committing task state",
        "target": "waves-browser",
        "setup": {
          "runMode": "network"
        },
        "workItems": [
          "WML-205"
        ],
        "specItems": [
          "WML-C-16",
          "WML-C-18",
          "WML-C-29"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0,
            "externalNavigationIntent": null
          },
          "session": {
            "runMode": "network",
            "navigationStatus": "loaded",
            "finalUrl": "http://fixtures.test/examples/wml205ErrorRecovery.wml"
          },
          "render": {
            "textIncludes": [
              "Recovered extension content.",
              "Missing target"
            ]
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 1,
                "externalNavigationIntent": null
              },
              "traceKinds": [
                "KEY"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 1,
                "externalNavigationIntent": "http://fixtures.test/examples/wml205MissingTarget.wml"
              },
              "traceKinds": [
                "KEY",
                "ACTION_EXTERNAL"
              ],
              "session": {
                "navigationStatus": "error",
                "finalUrl": "http://fixtures.test/examples/wml205ErrorRecovery.wml"
              },
              "statusIncludes": "Fetch failed:",
              "render": {
                "textIncludes": [
                  "Recovered extension content.",
                  "Missing target"
                ]
              }
            }
          }
        ]
      },
      {
        "id": "access-denial-preserves-invoking-task-state",
        "title": "Destination access denial notifies the user without committing task state",
        "target": "waves-browser",
        "setup": {
          "runMode": "network"
        },
        "workItems": [
          "WML-205"
        ],
        "specItems": [
          "WML-C-16",
          "WML-C-18",
          "WML-C-29"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0,
            "externalNavigationIntent": null
          },
          "session": {
            "runMode": "network",
            "navigationStatus": "loaded",
            "finalUrl": "http://fixtures.test/examples/wml205ErrorRecovery.wml"
          },
          "render": {
            "textIncludes": [
              "Recovered extension content.",
              "Restricted target"
            ]
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 1,
                "externalNavigationIntent": null
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 2,
                "externalNavigationIntent": null
              },
              "traceKinds": [
                "KEY",
                "KEY"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 2,
                "externalNavigationIntent": "http://fixtures.test/examples/wml202TemplateShadowing.wml"
              },
              "traceKinds": [
                "KEY",
                "ACTION_EXTERNAL"
              ],
              "session": {
                "navigationStatus": "error",
                "finalUrl": "http://fixtures.test/examples/wml205ErrorRecovery.wml"
              },
              "statusIncludes": "Deck parse failed: Deck access denied for referring URI",
              "render": {
                "textIncludes": [
                  "Recovered extension content.",
                  "Restricted target"
                ]
              }
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//VENDOR//DTD WML 1.3 PLUS//EN\"\n  \"http://vendor.test/wml13-plus.dtd\">\n<wml>\n  <head>\n    <meta name=\"vendor-mode\" content=\"training\"/>\n  </head>\n  <card id=\"home\">\n    <p>\n      Before extension.\n      <vendor:panel data-mode=\"compact\">\n        Recovered extension content.\n        <a href=\"#proof\">Recovery proof</a>\n        <a href=\"http://fixtures.test/examples/wml205MissingTarget.wml\">Missing target</a>\n        <a href=\"http://fixtures.test/examples/wml202TemplateShadowing.wml\">Restricted target</a>\n      </vendor:panel>\n      After extension.\n    </p>\n  </card>\n  <card id=\"proof\">\n    <p>Recovered content stayed deterministic and navigable.</p>\n  </card>\n</wml>\n"
  },
  {
    "key": "wml301CardTableBoundaries",
    "label": "WML-301 Card and Table Boundaries",
    "description": "Exercises leading, middle, trailing, and adjacent tables across fragment navigation and BACK.",
    "goal": "Verify WML 1.3 source-required card/table line boundaries without disturbing card order or history.",
    "workItems": [
      "WML-301"
    ],
    "specItems": [
      "WML-CL-CARD-TABLE-BOUNDARIES",
      "WML-CL-CARD-CONTENT-ORDER",
      "WML-CL-CARD-ID-FRAGMENT",
      "WML-CL-NAVIGATION-REFERENCE-MODEL"
    ],
    "testingAc": [
      "Confirm a middle table has distinct content lines before and after it.",
      "Confirm leading and trailing tables do not receive an extra outer boundary at the card edge.",
      "Navigate through the table cards and use BACK to confirm the prior card is restored."
    ],
    "flows": [
      {
        "id": "card-table-boundaries-and-cross-card-navigation",
        "title": "Card table boundaries remain stable across fragment navigation",
        "target": "waves-browser",
        "setup": {
          "runMode": "local"
        },
        "workItems": [
          "WML-301"
        ],
        "specItems": [
          "WML-CL-CARD-TABLE-BOUNDARIES",
          "WML-CL-CARD-CONTENT-ORDER",
          "WML-CL-CARD-ID-FRAGMENT",
          "WML-CL-NAVIGATION-REFERENCE-MODEL"
        ],
        "initial": {
          "state": {
            "activeCardId": "middle",
            "focusedLinkIndex": 0,
            "externalNavigationIntent": null
          },
          "render": {
            "textIncludes": [
              "Before",
              "Middle table",
              "After",
              "Leading case"
            ]
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "leading",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ],
              "render": {
                "textIncludes": [
                  "Leading table",
                  "After leading",
                  "Trailing case"
                ]
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "trailing",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ],
              "render": {
                "textIncludes": [
                  "Before trailing",
                  "Trailing table"
                ]
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "adjacent",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ],
              "render": {
                "textIncludes": [
                  "First table",
                  "Second table"
                ]
              }
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "trailing",
                "focusedLinkIndex": 0
              },
              "render": {
                "textIncludes": [
                  "Before trailing",
                  "Trailing table"
                ]
              }
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\" \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"middle\">\n    <p>\n      Before\n      <table columns=\"1\"><tr><td>Middle table</td></tr></table>\n      After\n      <a href=\"#leading\">Leading case</a>\n    </p>\n  </card>\n  <card id=\"leading\">\n    <p>\n      <table columns=\"1\"><tr><td>Leading table</td></tr></table>\n      After leading\n      <a href=\"#trailing\">Trailing case</a>\n    </p>\n  </card>\n  <card id=\"trailing\">\n    <do type=\"accept\" label=\"Adjacent\"><go href=\"#adjacent\"/></do>\n    <p>\n      Before trailing\n      <table columns=\"1\"><tr><td>Trailing table</td></tr></table>\n    </p>\n  </card>\n  <card id=\"adjacent\">\n    <p>\n      <table columns=\"1\"><tr><td>First table</td></tr></table>\n      <table columns=\"1\"><tr><td>Second table</td></tr></table>\n    </p>\n  </card>\n</wml>\n"
  },
  {
    "key": "wml301ContextHistoryFresh",
    "label": "WML-301 Fresh Context Target",
    "description": "Supporting newcontext destination for the WML-301 executable network story.",
    "goal": "Demonstrate that destination newcontext clears variables and prior navigation history.",
    "workItems": [
      "WML-301"
    ],
    "specItems": [
      "WML-CL-CARD-CONTEXT-ATTRIBUTE",
      "WML-CL-CONTEXT-SINGLE-SCOPE",
      "WML-CL-CONTEXT-STATE-MEMBERS",
      "WML-CL-GO-HISTORY-PUSH"
    ],
    "testingAc": [
      "Loaded by the WML-301 context/history story as a deterministic supporting resource."
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"fresh\" newcontext=\"true\">\n    <p>Fresh context value: $(contextValue).</p>\n  </card>\n</wml>\n"
  },
  {
    "key": "wml301ContextHistoryTarget",
    "label": "WML-301 Context and History Target",
    "description": "Supporting destination deck for the WML-301 executable network story.",
    "goal": "Expose preserved context after forward entry and permit a duplicate explicit URL access.",
    "workItems": [
      "WML-301"
    ],
    "specItems": [
      "WML-CL-CONTEXT-STATE-MEMBERS",
      "WML-CL-GO-HISTORY-PUSH",
      "WML-CL-HISTORY-DUPLICATE-PUSH",
      "WML-CL-NAVIGATION-REFERENCE-MODEL"
    ],
    "testingAc": [
      "Loaded by the WML-301 context/history story as a deterministic supporting resource."
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"fallback\">\n    <p>Fragment fallback card.</p>\n  </card>\n  <card id=\"target\">\n    <onevent type=\"onenterforward\">\n      <refresh><setvar name=\"entryDirection\" value=\"forward\"/></refresh>\n    </onevent>\n    <p>\n      Target context: $(contextValue). Entry: $(entryDirection).\n      <a href=\"wml301ContextHistoryTarget.wml#target\">Repeat target URL</a>\n    </p>\n  </card>\n</wml>\n"
  },
  {
    "key": "wml301ContextHistory",
    "label": "WML-301 Context and History",
    "description": "Crosses deck boundaries, repeats an explicit URL, restores history, and enters a newcontext destination.",
    "goal": "Verify browser-context preservation/reset, fragment selection, duplicate history pushes, and forward/back process order.",
    "workItems": [
      "WML-301"
    ],
    "specItems": [
      "WML-CL-CARD-CONTEXT-ATTRIBUTE",
      "WML-CL-CARD-ID-FRAGMENT",
      "WML-CL-CONTEXT-SINGLE-SCOPE",
      "WML-CL-CONTEXT-STATE-MEMBERS",
      "WML-CL-EXTERNAL-NAVIGATION-NEW-CONTEXT",
      "WML-CL-GO-FRAGMENT-FALLBACK",
      "WML-CL-GO-HISTORY-PUSH",
      "WML-CL-HISTORY-DUPLICATE-PUSH",
      "WML-CL-HISTORY-STACK-MODEL",
      "WML-CL-NAVIGATION-REFERENCE-MODEL"
    ],
    "testingAc": [
      "Follow the first link into a second deck and confirm the source context variable is visible after onenterforward processing.",
      "Access the same target URL again, then press Back twice and confirm both duplicate target and source entries are restored in order.",
      "Follow the newcontext link and confirm the variable and previous history are cleared."
    ],
    "flows": [
      {
        "id": "cross-deck-context-duplicate-history-and-reset",
        "title": "Cross-deck context survives forward/back traversal and newcontext resets history",
        "target": "waves-browser",
        "setup": {
          "runMode": "network"
        },
        "workItems": [
          "WML-301"
        ],
        "specItems": [
          "WML-CL-CARD-CONTEXT-ATTRIBUTE",
          "WML-CL-CARD-ID-FRAGMENT",
          "WML-CL-CONTEXT-SINGLE-SCOPE",
          "WML-CL-CONTEXT-STATE-MEMBERS",
          "WML-CL-EXTERNAL-NAVIGATION-NEW-CONTEXT",
          "WML-CL-GO-FRAGMENT-FALLBACK",
          "WML-CL-GO-HISTORY-PUSH",
          "WML-CL-HISTORY-DUPLICATE-PUSH",
          "WML-CL-HISTORY-STACK-MODEL",
          "WML-CL-NAVIGATION-REFERENCE-MODEL"
        ],
        "initial": {
          "state": {
            "activeCardId": "source",
            "focusedLinkIndex": 0,
            "externalNavigationIntent": null
          },
          "session": {
            "runMode": "network",
            "navigationStatus": "loaded",
            "finalUrl": "http://fixtures.test/examples/wml301ContextHistory.wml"
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "source",
                "focusedLinkIndex": 1
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "target",
                "focusedLinkIndex": 0,
                "externalNavigationIntent": null
              },
              "traceKinds": [
                "ACTION_EXTERNAL",
                "LOAD_DECK",
                "ACTION_REFRESH"
              ],
              "session": {
                "finalUrl": "http://fixtures.test/examples/wml301ContextHistoryTarget.wml"
              },
              "render": {
                "textIncludes": [
                  "Target context: kept. Entry: forward."
                ]
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "target",
                "focusedLinkIndex": 0
              },
              "session": {
                "finalUrl": "http://fixtures.test/examples/wml301ContextHistoryTarget.wml"
              }
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "target",
                "focusedLinkIndex": 0
              },
              "session": {
                "finalUrl": "http://fixtures.test/examples/wml301ContextHistoryTarget.wml"
              }
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "source",
                "focusedLinkIndex": 0
              },
              "session": {
                "finalUrl": "http://fixtures.test/examples/wml301ContextHistory.wml"
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "source",
                "focusedLinkIndex": 1
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "source",
                "focusedLinkIndex": 2
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "fresh",
                "focusedLinkIndex": 0
              },
              "session": {
                "finalUrl": "http://fixtures.test/examples/wml301ContextHistoryFresh.wml"
              },
              "render": {
                "textIncludes": [
                  "Fresh context value: ."
                ]
              }
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "fresh",
                "focusedLinkIndex": 0
              },
              "statusIncludes": "no back history"
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"source\">\n    <p>\n      <input name=\"contextValue\" value=\"kept\"/>\n      <a href=\"wml301ContextHistoryTarget.wml#target\">Open target</a>\n      <a href=\"wml301ContextHistoryFresh.wml#fresh\">Reset context</a>\n    </p>\n  </card>\n</wml>\n"
  },
  {
    "key": "wml302VariableSubstitution",
    "label": "WML-302 Variable Store and Substitution",
    "description": "Exercises task-snapshot setvars, literal-dollar handling, text and HREF substitution, context persistence, and prev assignment order.",
    "goal": "Verify that WML variables are resolved from stable task snapshots and remain engine-owned across render and navigation.",
    "workItems": [
      "WML-302"
    ],
    "specItems": [
      "WML-C-07",
      "WML-C-12",
      "WML-C-18",
      "WML-C-29",
      "WML-C-38",
      "WML-C-52",
      "RQ-RMK-002",
      "RQ-RMK-003",
      "RQ-RMK-005"
    ],
    "testingAc": [
      "Press Enter on home; the go task snapshots all setvars, reaches display, and renders the substituted greeting plus literal and undefined-dollar cases.",
      "Follow the substituted link target to final; the same browser context preserves the greeting.",
      "Press Back on final; the WML prev task applies Return before restoring display."
    ],
    "flows": [
      {
        "id": "host-variable-snapshot-substitution-and-prev",
        "title": "Host sample preserves WML variable snapshot and prev ordering",
        "target": "host-sample",
        "workItems": [
          "WML-302"
        ],
        "specItems": [
          "WML-C-07",
          "WML-C-12",
          "WML-C-18",
          "WML-C-29",
          "WML-C-38",
          "WML-C-52",
          "RQ-RMK-002",
          "RQ-RMK-003",
          "RQ-RMK-005"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "display",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_ACCEPT",
                "ACTION_FRAGMENT"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "final",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ]
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "display",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "ACTION_BACK_OVERRIDE",
                "ACTION_PREV",
                "ACTION_BACK"
              ]
            }
          }
        ]
      },
      {
        "id": "waves-variable-snapshot-substitution-and-prev",
        "title": "Waves preserves WML variable snapshot and prev ordering",
        "target": "waves-browser",
        "workItems": [
          "WML-302"
        ],
        "specItems": [
          "WML-C-07",
          "WML-C-12",
          "WML-C-18",
          "WML-C-29",
          "WML-C-38",
          "WML-C-52",
          "RQ-RMK-002",
          "RQ-RMK-003",
          "RQ-RMK-005"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0
          },
          "render": {
            "textIncludes": [
              "Press Enter to snapshot variables."
            ]
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "display",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_ACCEPT",
                "ACTION_FRAGMENT"
              ],
              "render": {
                "textIncludes": [
                  "Greeting: A B.",
                  "Dollar: $.",
                  "Undefined: prepost.",
                  "Open final"
                ]
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "final",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ],
              "render": {
                "textIncludes": [
                  "Variables persisted: A B."
                ]
              }
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "display",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "ACTION_BACK_OVERRIDE",
                "ACTION_PREV",
                "ACTION_BACK"
              ],
              "render": {
                "textIncludes": [
                  "Return: back."
                ]
              }
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"home\">\n    <do type=\"accept\">\n      <go href=\"#display\">\n        <setvar name=\"Greeting\" value=\"A B\"/>\n        <setvar name=\"Route\" value=\"final\"/>\n        <setvar name=\"First\" value=\"new\"/>\n        <setvar name=\"Copied\" value=\"$(First)\"/>\n      </go>\n    </do>\n    <p>Press Enter to snapshot variables.</p>\n  </card>\n\n  <card id=\"display\">\n    <p>\n      Greeting: $(Greeting:noesc).\n      Dollar: $$.\n      Undefined: pre$(Missing)post.\n      Snapshot: pre$(Copied)post.\n      Return: $(Return).\n      <a href=\"#$(Route)\">Open $(Route:noesc)</a>\n    </p>\n  </card>\n\n  <card id=\"final\">\n    <do type=\"prev\">\n      <prev><setvar name=\"Return\" value=\"back\"/></prev>\n    </do>\n    <p>Variables persisted: $(Greeting:noesc).</p>\n  </card>\n</wml>\n"
  },
  {
    "key": "wml303ActionsSoftkeys",
    "label": "WML-303 Actions and Softkey Precedence",
    "description": "Exercises deterministic BACK activation across optional, card, template, and noop-masked do bindings.",
    "goal": "Verify WML-owned action identity and precedence before the host falls back to intrinsic history.",
    "workItems": [
      "WML-303"
    ],
    "specItems": [
      "WML-C-08",
      "WML-C-18",
      "WML-C-26",
      "WML-C-35",
      "WML-C-38",
      "WML-C-47",
      "RQ-WAE-017"
    ],
    "testingAc": [
      "Follow First precedence and press Back; the first active card do type prev reaches card-wins.",
      "Follow Noop mask and press Back; the card noop masks the matching template do and intrinsic history returns home.",
      "Run both paths through the host sample and Waves browser story targets."
    ],
    "flows": [
      {
        "id": "host-card-first-prev-precedence",
        "title": "Host sample BACK uses the first active card prev binding",
        "target": "host-sample",
        "workItems": [
          "WML-303"
        ],
        "specItems": [
          "WML-C-08",
          "WML-C-18",
          "WML-C-26",
          "WML-C-38",
          "WML-C-47",
          "RQ-WAE-017"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "ordered",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ]
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "card-wins",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "ACTION_BACK_OVERRIDE",
                "ACTION_FRAGMENT"
              ]
            }
          }
        ]
      },
      {
        "id": "host-noop-mask-falls-back-to-history",
        "title": "Host sample noop mask suppresses template prev before intrinsic BACK",
        "target": "host-sample",
        "workItems": [
          "WML-303"
        ],
        "specItems": [
          "WML-C-08",
          "WML-C-18",
          "WML-C-35",
          "WML-C-38",
          "WML-C-47",
          "RQ-WAE-017"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 1
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "masked",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ]
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "ACTION_BACK"
              ]
            }
          }
        ]
      },
      {
        "id": "waves-card-first-prev-precedence",
        "title": "Waves BACK uses the engine-selected first active card prev binding",
        "target": "waves-browser",
        "workItems": [
          "WML-303"
        ],
        "specItems": [
          "WML-C-08",
          "WML-C-18",
          "WML-C-26",
          "WML-C-38",
          "WML-C-47",
          "RQ-WAE-017"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "ordered",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ]
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "card-wins",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "ACTION_BACK_OVERRIDE",
                "ACTION_FRAGMENT"
              ]
            }
          }
        ]
      },
      {
        "id": "waves-noop-mask-falls-back-to-history",
        "title": "Waves BACK honors noop masking before intrinsic history",
        "target": "waves-browser",
        "workItems": [
          "WML-303"
        ],
        "specItems": [
          "WML-C-08",
          "WML-C-18",
          "WML-C-35",
          "WML-C-38",
          "WML-C-47",
          "RQ-WAE-017"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 1
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "masked",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ]
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "ACTION_BACK"
              ]
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <template>\n    <do name=\"back\" type=\"prev\" label=\"Template back\">\n      <go href=\"#template-wins\"/>\n    </do>\n  </template>\n\n  <card id=\"home\">\n    <p>\n      WML action precedence.\n      <a href=\"#ordered\">First precedence</a>\n      <a href=\"#masked\">Noop mask</a>\n    </p>\n  </card>\n\n  <card id=\"ordered\">\n    <do name=\"optional-prev\" type=\"prev\" label=\"Optional\" optional=\"true\">\n      <go href=\"#optional-wins\"/>\n    </do>\n    <do name=\"card-first\" type=\"prev\" label=\"Card back\">\n      <go href=\"#card-wins\"/>\n    </do>\n    <do name=\"card-second\" type=\"prev\" label=\"Second card back\">\n      <go href=\"#second-wins\"/>\n    </do>\n    <p>Back resolves the first active card binding.</p>\n  </card>\n\n  <card id=\"masked\">\n    <do name=\"back\" type=\"prev\"><noop/></do>\n    <p>Back ignores the masked template action and pops history.</p>\n  </card>\n\n  <card id=\"card-wins\"><p>First card BACK binding won.</p></card>\n  <card id=\"second-wins\"><p>The second card binding must not win.</p></card>\n  <card id=\"template-wins\"><p>The template binding must not win.</p></card>\n  <card id=\"optional-wins\"><p>The optional binding must not be presented.</p></card>\n</wml>\n"
  },
  {
    "key": "wml304RequestIntent",
    "label": "WML-304 Request Intent Contract",
    "description": "Captures the bounded WML go request intent without performing network fetch or transport serialization.",
    "goal": "Verify method, ordered postfields, referer opt-in, no-cache, enctype, charset, and same-deck classification at the engine boundary.",
    "workItems": [
      "WML-304"
    ],
    "specItems": [
      "WML-CL-HISTORY-POST-REPLAY",
      "WML-CL-POSTFIELD-STRUCTURE",
      "WML-CL-POSTFIELD-REQUEST-PAIR",
      "WML-CL-GO-STRUCTURE",
      "WML-CL-GO-INTERNAL-POSTFIELD-SUPPRESSION",
      "WML-CL-GO-REFERER",
      "WML-CL-GO-METHOD",
      "WML-CL-GO-NO-CACHE",
      "WML-CL-GO-ENCTYPE-SUPPORT",
      "WML-CL-GO-PART-CONTENT-TYPE",
      "WML-CL-GO-ACCEPT-CHARSET",
      "WML-CL-GO-SUBMISSION-ORDER",
      "WML-CL-GO-GET-QUERY-MERGE",
      "WML-CL-GO-POST-CONTENT-TYPE-CHARSET",
      "WML-CL-GO-FORM-URLENCODING"
    ],
    "testingAc": [
      "Activate Submit and inspect the ordered POST request intent emitted by the engine.",
      "Confirm sendreferer, no-cache, enctype, accept-charset, and same-deck values are serialized identically for native and WASM hosts.",
      "Treat transport encoding, GET query merge, multipart construction, and POST history replay as explicit follow-up work."
    ],
    "flows": [
      {
        "id": "host-wml-304-request-intent",
        "title": "Host sample captures the bounded ordered WML go request intent",
        "target": "host-sample",
        "workItems": [
          "WML-304"
        ],
        "specItems": [
          "WML-CL-HISTORY-POST-REPLAY",
          "WML-CL-POSTFIELD-STRUCTURE",
          "WML-CL-POSTFIELD-REQUEST-PAIR",
          "WML-CL-GO-STRUCTURE",
          "WML-CL-GO-INTERNAL-POSTFIELD-SUPPRESSION",
          "WML-CL-GO-REFERER",
          "WML-CL-GO-METHOD",
          "WML-CL-GO-NO-CACHE",
          "WML-CL-GO-ENCTYPE-SUPPORT",
          "WML-CL-GO-PART-CONTENT-TYPE",
          "WML-CL-GO-ACCEPT-CHARSET",
          "WML-CL-GO-SUBMISSION-ORDER",
          "WML-CL-GO-GET-QUERY-MERGE",
          "WML-CL-GO-POST-CONTENT-TYPE-CHARSET",
          "WML-CL-GO-FORM-URLENCODING"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "externalNavigationIntent": null,
            "externalNavigationRequestPolicy": null
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "externalNavigationIntent": "http://local.test/submit",
                "externalNavigationRequestPolicy": {
                  "cacheControl": "no-cache",
                  "refererUrl": "http://local.test/deck.wml",
                  "postContext": {
                    "sameDeck": false,
                    "contentType": "application/x-www-form-urlencoded",
                    "payload": "first=one&second=two"
                  },
                  "requestIntent": {
                    "method": "post",
                    "enctype": "application/x-www-form-urlencoded",
                    "sendReferer": true,
                    "acceptCharset": "utf-8",
                    "sameDeck": false,
                    "postFields": [
                      {
                        "name": "first",
                        "value": "one"
                      },
                      {
                        "name": "second",
                        "value": "two"
                      }
                    ]
                  }
                }
              },
              "traceKinds": [
                "KEY",
                "ACTION_ACCEPT",
                "ACTION_EXTERNAL"
              ]
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"home\">\n    <do type=\"accept\" label=\"Submit\">\n      <go href=\"/submit\" method=\"post\" sendreferer=\"true\"\n          cache-control=\"no-cache\" accept-charset=\"utf-8\">\n        <postfield name=\"first\" value=\"one\"/>\n        <postfield name=\"second\" value=\"two\"/>\n      </go>\n    </do>\n    <p>Activate Submit to capture the WML request intent.</p>\n  </card>\n</wml>\n"
  },
  {
    "key": "wml305TimerLifecycle",
    "label": "WML-305 Native Timer Lifecycle",
    "description": "Exercises named WML timer initialization, refresh resume, exit persistence, expiry, and host wakeup boundaries.",
    "goal": "Verify native timer semantics stay deterministic through the production WASM host and Waves browser adapters.",
    "workItems": [
      "WML-305"
    ],
    "specItems": [
      "WML-CL-GO-TIMER-THEN-DISPLAY",
      "WML-CL-REFRESH-TIMER-RESTART",
      "WML-CL-TIMER-EVENT-TRANSITION",
      "WML-CL-TIMER-INITIAL-VALUE-PRECEDENCE",
      "WML-CL-TIMER-NAME-PERSISTENCE",
      "WML-CL-TIMER-REFRESH-RESUME",
      "WML-CL-TIMER-START-STOP",
      "WML-CL-TIMER-UNITS"
    ],
    "testingAc": [
      "Run the refresh path and confirm the timer restarts from the refresh assignment before expiring at zero.",
      "Run the exit path and confirm the current timer value is persisted in tenths on the destination card.",
      "Confirm host snapshots expose the exact remaining native-timer wakeup delay."
    ],
    "flows": [
      {
        "id": "host-refresh-resume-and-expire",
        "title": "Host sample refreshes a named timer and dispatches at one-to-zero",
        "target": "host-sample",
        "workItems": [
          "WML-305"
        ],
        "specItems": [
          "WML-CL-GO-TIMER-THEN-DISPLAY",
          "WML-CL-REFRESH-TIMER-RESTART",
          "WML-CL-TIMER-EVENT-TRANSITION",
          "WML-CL-TIMER-INITIAL-VALUE-PRECEDENCE",
          "WML-CL-TIMER-NAME-PERSISTENCE",
          "WML-CL-TIMER-REFRESH-RESUME",
          "WML-CL-TIMER-START-STOP",
          "WML-CL-TIMER-UNITS"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "refresh-timer",
                "focusedLinkIndex": 0,
                "nextTimerWakeupMs": 500
              },
              "traceKinds": [
                "ACTION_FRAGMENT",
                "TIMER_START"
              ]
            }
          },
          {
            "action": {
              "type": "tick",
              "ms": 100
            },
            "expect": {
              "state": {
                "activeCardId": "refresh-timer",
                "nextTimerWakeupMs": 400
              },
              "traceKinds": [
                "TIMER_TICK"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "refresh-timer",
                "nextTimerWakeupMs": 200
              },
              "traceKinds": [
                "ACTION_REFRESH",
                "TIMER_PERSIST",
                "TIMER_STOP",
                "TIMER_START"
              ]
            }
          },
          {
            "action": {
              "type": "tick",
              "ms": 100
            },
            "expect": {
              "state": {
                "activeCardId": "refresh-timer",
                "nextTimerWakeupMs": 100
              }
            }
          },
          {
            "action": {
              "type": "tick",
              "ms": 100
            },
            "expect": {
              "state": {
                "activeCardId": "expired"
              },
              "traceKinds": [
                "TIMER_TICK",
                "TIMER_PERSIST",
                "TIMER_EXPIRE",
                "ACTION_ONTIMER",
                "ACTION_FRAGMENT"
              ]
            }
          }
        ]
      },
      {
        "id": "waves-refresh-resume-and-expire",
        "title": "Waves refreshes a named timer through deterministic host wakeups",
        "target": "waves-browser",
        "workItems": [
          "WML-305"
        ],
        "specItems": [
          "WML-CL-GO-TIMER-THEN-DISPLAY",
          "WML-CL-REFRESH-TIMER-RESTART",
          "WML-CL-TIMER-EVENT-TRANSITION",
          "WML-CL-TIMER-INITIAL-VALUE-PRECEDENCE",
          "WML-CL-TIMER-NAME-PERSISTENCE",
          "WML-CL-TIMER-REFRESH-RESUME",
          "WML-CL-TIMER-START-STOP",
          "WML-CL-TIMER-UNITS"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "refresh-timer",
                "nextTimerWakeupMs": 500
              },
              "traceKinds": [
                "ACTION_FRAGMENT",
                "TIMER_START"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "refresh-timer",
                "nextTimerWakeupMs": 200
              },
              "traceKinds": [
                "ACTION_REFRESH",
                "TIMER_PERSIST",
                "TIMER_STOP",
                "TIMER_START"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "up"
            },
            "expect": {
              "state": {
                "activeCardId": "expired"
              },
              "traceKinds": [
                "TIMER_EXPIRE",
                "ACTION_ONTIMER",
                "ACTION_FRAGMENT"
              ],
              "render": {
                "textIncludes": [
                  "Expired at 0."
                ]
              }
            }
          }
        ]
      },
      {
        "id": "waves-exit-persists-current-value",
        "title": "Waves persists a named timer when its card exits",
        "target": "waves-browser",
        "workItems": [
          "WML-305"
        ],
        "specItems": [
          "WML-CL-GO-TIMER-THEN-DISPLAY",
          "WML-CL-TIMER-INITIAL-VALUE-PRECEDENCE",
          "WML-CL-TIMER-NAME-PERSISTENCE",
          "WML-CL-TIMER-START-STOP",
          "WML-CL-TIMER-UNITS"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "focusedLinkIndex": 1
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "exit-timer",
                "nextTimerWakeupMs": 500
              },
              "traceKinds": [
                "ACTION_FRAGMENT",
                "TIMER_START"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "persisted"
              },
              "traceKinds": [
                "ACTION_FRAGMENT",
                "TIMER_PERSIST",
                "TIMER_STOP"
              ],
              "render": {
                "textIncludes": [
                  "Persisted timer value: 5."
                ]
              }
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"home\">\n    <p>\n      WML timer lifecycle.\n      <a href=\"#refresh-timer\">Refresh lifecycle</a>\n      <a href=\"#exit-timer\">Exit persistence</a>\n    </p>\n  </card>\n\n  <card id=\"refresh-timer\">\n    <onevent type=\"ontimer\"><go href=\"#expired\"/></onevent>\n    <timer name=\"remaining\" value=\"5\"/>\n    <do type=\"accept\" label=\"Refresh timer\">\n      <refresh><setvar name=\"remaining\" value=\"2\"/></refresh>\n    </do>\n    <p>Press Enter after one tick to refresh the timer.</p>\n  </card>\n\n  <card id=\"exit-timer\">\n    <timer name=\"saved\" value=\"5\"/>\n    <p><a href=\"#persisted\">Leave timer card</a></p>\n  </card>\n\n  <card id=\"expired\"><p>Expired at $(remaining).</p></card>\n  <card id=\"persisted\"><p>Persisted timer value: $(saved).</p></card>\n</wml>\n"
  },
  {
    "key": "wml309FrameAffordances",
    "label": "WML-309 Frame Affordances",
    "description": "Exercises the canonical engine presentation frame for ordered active do affordances and frame-bound action dispatch.",
    "goal": "Verify that active do elements are exposed once with stable action identifiers and best-effort labels while optional and noop-masked actions stay absent.",
    "workItems": [
      "WML-309",
      "WBP-06",
      "F0-01"
    ],
    "specItems": [
      "WML-C-26",
      "RQ-RMK-002",
      "WML-CL-DO-ACTIVE-VISIBILITY",
      "WML-CL-DO-LABEL-BEST-EFFORT",
      "WML-CL-DO-UNIQUE-WIDGET"
    ],
    "testingAc": [
      "The initial frame exposes Open Ada, the accept fallback label, and template Help Ada in deterministic order.",
      "The first accept action is the logical primary control and later actions remain task affordances.",
      "Activating do:alternate through the current frame identifier reaches the second card.",
      "Optional and noop-masked do elements never appear as affordances."
    ],
    "flows": [
      {
        "id": "host-frame-affordance-contract",
        "title": "Host sample consumes ordered frame affordances and activates one by stable id",
        "target": "host-sample",
        "workItems": [
          "WML-309",
          "WBP-06",
          "F0-01"
        ],
        "specItems": [
          "WML-C-26",
          "RQ-RMK-002",
          "WML-CL-DO-ACTIVE-VISIBILITY",
          "WML-CL-DO-LABEL-BEST-EFFORT",
          "WML-CL-DO-UNIQUE-WIDGET"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0
          },
          "frame": {
            "contractVersion": 1,
            "profileId": "class-c-reference",
            "cardId": "home",
            "affordances": [
              {
                "actionId": "do:open",
                "label": "Open Ada",
                "source": "card-do",
                "control": "primary",
                "enabled": true
              },
              {
                "actionId": "do:alternate",
                "label": "accept",
                "source": "card-do",
                "control": "task",
                "enabled": true
              },
              {
                "actionId": "do:template-help",
                "label": "Help Ada",
                "source": "template-do",
                "control": "task",
                "enabled": true
              }
            ]
          }
        },
        "steps": [
          {
            "action": {
              "type": "activate-action",
              "actionId": "do:alternate"
            },
            "expect": {
              "state": {
                "activeCardId": "second",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "ACTION_AFFORDANCE",
                "ACTION_FRAGMENT"
              ],
              "frame": {
                "contractVersion": 1,
                "profileId": "class-c-reference",
                "cardId": "second",
                "affordances": [
                  {
                    "actionId": "do:template-help",
                    "label": "Help Ada",
                    "source": "template-do",
                    "control": "task",
                    "enabled": true
                  },
                  {
                    "actionId": "do:masked",
                    "label": "options",
                    "source": "template-do",
                    "control": "task",
                    "enabled": true
                  },
                  {
                    "actionId": "history:back",
                    "label": "Back",
                    "source": "history",
                    "control": "back",
                    "enabled": true
                  }
                ]
              }
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <template>\n    <do name=\"template-help\" type=\"help\" label=\"Help Ada\"><go href=\"#help\"/></do>\n    <do name=\"masked\" type=\"options\"><go href=\"#masked\"/></do>\n  </template>\n\n  <card id=\"home\">\n    <do name=\"open\" type=\"accept\" label=\"Open Ada\"><go href=\"#first\"/></do>\n    <do name=\"alternate\" type=\"accept\"><go href=\"#second\"/></do>\n    <do name=\"masked\" type=\"options\"><noop/></do>\n    <do name=\"optional\" type=\"x-vendor\" optional=\"true\"><go href=\"#optional\"/></do>\n    <p>Choose an action.</p>\n  </card>\n\n  <card id=\"first\"><p>First action.</p></card>\n  <card id=\"second\"><p>Second action.</p></card>\n  <card id=\"help\"><p>Help action.</p></card>\n  <card id=\"masked\"><p>Masked action.</p></card>\n  <card id=\"optional\"><p>Optional action.</p></card>\n</wml>\n"
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
    "flows": [
      {
        "id": "current-card-and-context-reset",
        "title": "Current-card lookup and newContext clear variables and history",
        "target": "host-sample",
        "workItems": [
          "R0-03",
          "W0-07"
        ],
        "specItems": [
          "RQ-WMLS-019",
          "RQ-WMLS-020"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0,
            "nextCardVar": null
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0,
                "nextCardVar": "#home",
                "lastScriptExecutionOk": true
              },
              "traceKinds": [
                "ACTION_SCRIPT",
                "SCRIPT_OK"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 1
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "next",
                "focusedLinkIndex": 0
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "next",
                "focusedLinkIndex": 0,
                "nextCardVar": null,
                "lastScriptExecutionOk": true
              },
              "traceKinds": [
                "ACTION_SCRIPT",
                "SCRIPT_OK"
              ]
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "next",
                "focusedLinkIndex": 0,
                "nextCardVar": null
              },
              "traceKinds": [
                "ACTION_BACK_EMPTY"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "next",
                "focusedLinkIndex": 1
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "next",
                "focusedLinkIndex": 1,
                "nextCardVar": "#next",
                "lastScriptExecutionOk": true
              },
              "traceKinds": [
                "ACTION_SCRIPT",
                "SCRIPT_OK"
              ]
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"home\">\n    <p>\n      WMLBrowser context semantics demo.\n      <a href=\"script:wmlbrowser-demo.wmlsc#readCurrentCard\">Read current card into nextCard</a>\n      <a href=\"#next\">Go to next card</a>\n    </p>\n  </card>\n  <card id=\"next\">\n    <p>\n      newContext should clear vars/history and ignore prev in same script.\n      <a href=\"script:wmlbrowser-demo.wmlsc#newContextPrev\">Run newContext + prev</a>\n      <a href=\"script:wmlbrowser-demo.wmlsc#readCurrentCard\">Read current card into nextCard</a>\n    </p>\n  </card>\n</wml>\n"
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
    "flows": [
      {
        "id": "variable-fragment-and-prev-effects",
        "title": "WMLBrowser variable, go, and prev effects apply after script invocation",
        "target": "host-sample",
        "workItems": [
          "W0-04"
        ],
        "specItems": [
          "RQ-WMLS-017",
          "RQ-WMLS-018"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0,
            "nextCardVar": null
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "next",
                "focusedLinkIndex": 0,
                "nextCardVar": "#next",
                "lastScriptExecutionOk": true
              },
              "traceKinds": [
                "ACTION_SCRIPT",
                "SCRIPT_OK"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0,
                "nextCardVar": "#next",
                "lastScriptExecutionOk": true
              },
              "traceKinds": [
                "ACTION_SCRIPT",
                "ACTION_BACK",
                "SCRIPT_OK"
              ]
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"home\">\n    <p>WMLBrowser var/nav subset demo. <a href=\"script:wmlbrowser-demo.wmlsc#main\">Script setVar + go</a></p>\n  </card>\n  <card id=\"next\">\n    <p>Navigation came from script go(). <a href=\"script:wmlbrowser-demo.wmlsc#back\">Script prev</a></p>\n  </card>\n</wml>\n"
  },
  {
    "key": "wrapStress",
    "label": "Long Token Wrap",
    "description": "Long unbroken token fixture for deterministic wrapping checks.",
    "goal": "Detect layout regressions in char-width wrapping and ensure navigation remains usable.",
    "workItems": [
      "A3-01",
      "RSL-04"
    ],
    "specItems": [
      "WML-R-004"
    ],
    "testingAc": [
      "Load the deck and confirm the long token wraps consistently in the canvas viewport.",
      "Confirm bounded legacy and presentation output render together without duplicate layout work.",
      "Reload the same deck multiple times and verify visual wrapping does not drift.",
      "Press Enter on \"Continue\" and confirm activeCardId transitions to next.",
      "Press Enter on \"Back\" and confirm return to home."
    ],
    "flows": [
      {
        "id": "long-token-navigation-stays-usable",
        "title": "Long unbroken token wraps and navigation remains usable",
        "target": "host-sample",
        "workItems": [
          "A3-01",
          "RSL-04"
        ],
        "specItems": [
          "WML-R-004"
        ],
        "initial": {
          "state": {
            "activeCardId": "home",
            "focusedLinkIndex": 0
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "next",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "home",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ]
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"home\">\n    <p>\n      supercalifragilisticpseudopneumonoultramicroscopicsilicovolcanoconiosis\n      <a href=\"#next\">Continue</a>\n    </p>\n  </card>\n  <card id=\"next\">\n    <p>Wrap test complete. <a href=\"#home\">Back</a></p>\n  </card>\n</wml>\n"
  },
  {
    "key": "yourFirstDeck",
    "label": "Your First Deck",
    "description": "Guided first-run tutorial deck teaching the Up/Down/Select/Back softkey controls.",
    "goal": "Verify a newcomer can move focus, select a link, and use Back to return through engine card history using only the four softkey controls.",
    "workItems": [
      "WBP-04"
    ],
    "specItems": [
      "WBP-04"
    ],
    "testingAc": [
      "Press Select on \"Select this link to continue\"; activeCardId should become next.",
      "Press Down then Up; focus should move to the second link then back to the first.",
      "Press Down then Select; activeCardId should become detail-two.",
      "Press Back; activeCardId should return to next.",
      "Press Select on \"First option\"; activeCardId should become detail-one."
    ],
    "flows": [
      {
        "id": "keypad-softkey-tour",
        "title": "Up/Down/Select/Back softkeys move focus, navigate, and pop history",
        "target": "host-sample",
        "workItems": [
          "WBP-04"
        ],
        "specItems": [
          "WBP-04"
        ],
        "initial": {
          "state": {
            "activeCardId": "start",
            "focusedLinkIndex": 0
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "next",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "next",
                "focusedLinkIndex": 1
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "up"
            },
            "expect": {
              "state": {
                "activeCardId": "next",
                "focusedLinkIndex": 0
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "next",
                "focusedLinkIndex": 1
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "detail-two",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ]
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "next",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "ACTION_BACK"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "detail-one",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ]
            }
          }
        ]
      },
      {
        "id": "waves-keypad-softkey-tour",
        "title": "Waves UI drives the softkey tour through the ordinary engine path",
        "target": "waves-browser",
        "setup": {
          "runMode": "local"
        },
        "workItems": [
          "WBP-04"
        ],
        "specItems": [
          "WBP-04"
        ],
        "initial": {
          "state": {
            "activeCardId": "start",
            "focusedLinkIndex": 0
          },
          "session": {
            "runMode": "local",
            "navigationStatus": "loaded"
          },
          "render": {
            "textIncludes": [
              "Welcome to Waves.",
              "Select this link to continue"
            ]
          }
        },
        "steps": [
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "next",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ],
              "render": {
                "textIncludes": [
                  "Nice work. You selected a link.",
                  "First option",
                  "Second option"
                ]
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "next",
                "focusedLinkIndex": 1
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "up"
            },
            "expect": {
              "state": {
                "activeCardId": "next",
                "focusedLinkIndex": 0
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "down"
            },
            "expect": {
              "state": {
                "activeCardId": "next",
                "focusedLinkIndex": 1
              }
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "detail-two",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ],
              "render": {
                "textIncludes": [
                  "Now try Back to return through history."
                ]
              }
            }
          },
          {
            "action": {
              "type": "back"
            },
            "expect": {
              "state": {
                "activeCardId": "next",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "ACTION_BACK"
              ]
            }
          },
          {
            "action": {
              "type": "key",
              "key": "enter"
            },
            "expect": {
              "state": {
                "activeCardId": "detail-one",
                "focusedLinkIndex": 0
              },
              "traceKinds": [
                "KEY",
                "ACTION_FRAGMENT"
              ],
              "render": {
                "textIncludes": [
                  "You selected the first option."
                ]
              }
            }
          }
        ]
      }
    ],
    "wml": "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\"\n  \"http://www.wapforum.org/DTD/wml13.dtd\">\n<wml>\n  <card id=\"start\">\n    <p>Welcome to Waves.</p>\n    <p>Up and Down move focus between links. Select activates the focused link.</p>\n    <p><a href=\"#next\">Select this link to continue</a></p>\n  </card>\n  <card id=\"next\">\n    <p>Nice work. You selected a link.</p>\n    <p>Try Down, then Select, to open the second option.</p>\n    <p>\n      <a href=\"#detail-one\">First option</a>\n      <a href=\"#detail-two\">Second option</a>\n    </p>\n  </card>\n  <card id=\"detail-one\">\n    <p>You selected the first option. <a href=\"#next\">Back to options</a></p>\n  </card>\n  <card id=\"detail-two\">\n    <p>You moved focus with Down, then selected the second option.</p>\n    <p>Now try Back to return through history.</p>\n    <p><a href=\"#next\">Back to options</a></p>\n  </card>\n</wml>\n"
  }
];
