# Loading feedback research

Status: research recommendation; no design or timing decision approved.

## Question and recommendation

How can Waves communicate a slow navigation without moving the handset or flashing a bottom bar?
Prototype a small, fixed-size activity indicator beside the address and Go/Stop control. Reserve
its space and keep Go and Stop the same width. Keep the previous deck visible, retain immediate
Stop when cancellation is available, and never invent a completion percentage. The product owner
should evaluate a prototype before selecting its visual treatment and timing.

## Evidence and interpretation

- **Documented:** Internet Explorer used an animated mark in browser chrome during loading,
  according to [Microsoft's 2004 account](https://learn.microsoft.com/en-us/archive/msdn-magazine/2004/october/advanced-basics-building-a-progress-bar-that-doesnt-progress).
- **Documented:** The [Nokia 9110i developer guide](https://manualzz.com/doc/2079412/nokia-9110i-mobile-phone-service-developer-s-guide) describes reserved indicator space and stable command-button widths. It does not establish a specific loading animation.
- **Documented:** [Apple's loading guidance](https://developer.apple.com/design/human-interface-guidelines/loading) favors retaining useful content and providing appropriate feedback. [WCAG status-message guidance](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) requires relevant status changes to be conveyed without moving focus.
- **Inference:** A reserved activity slot in browser chrome can evoke period browser hardware and
  avoid the layout shift and bottom-bar flashes observed during native Home → About testing. It
  should use a static distinct state when reduced motion is requested, with sufficient contrast
  and a concise accessible name.

## Timing and next gate

WBP-11 currently specifies initial feedback within 100 ms and delayed visual progress by 200 ms.
The user requested less visible churn during fast navigation. A roughly 500 ms delay is a
prototype hypothesis, not a historical fact or an approved replacement requirement. Test it
against real fast and slow WAP requests and reconcile any proposed change with WBP-11 before
implementation. Stop must remain immediately available independently of indicator timing.

Compare the reserved chrome indicator with the existing delayed viewport hint and no visible
indicator. Verify no layout shift on fast navigation; one polite start/end announcement only when
the slow state is presented; no stale indicator after cancellation, supersession, or completion;
and clear, reachable error recovery. Record user feedback, reduced-motion behavior, and contrast
before deciding. The recommendation has not yet been prototyped or validated with users.
