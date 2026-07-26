# Historical Browser Profile Source Baseline

Status: active research baseline; no named profile authorized
Last updated: 2026-07-26
Scope: period WAP handset-browser interaction evidence for future Waves compatibility profiles

## Purpose and Boundary

This baseline records recoverable primary historical evidence for future device/browser profiles. It
does not define WAP requirements, alter the neutral `Class C Reference` runtime, or authorize a named
profile. All sources here are `interop-reference` evidence under
[Waves Source Authority Policy](SOURCE_AUTHORITY_POLICY.md); only the locked normative corpus may
create or redefine `RQ-*` requirements.

The research covers viewport metrics, typography, focus and roller behavior, softkeys and task
placement, Options/menu ordering, editors and forms, history, timers, documented failures, and
browser limitations. Archived folders and historical planning snapshots are outside this audit.

## Evidence and Confidence Rules

Evidence classes used below are:

- `P1`: manufacturer/browser-vendor publication with internal publication identity and notices.
- `P2`: contemporary operator or platform-owner guidance based on named devices and browser tests.
- `S1`: third-party transcription, manual mirror, or contextual recollection without a recovered
  publisher artifact. This can locate or corroborate evidence, but cannot close a profile gate alone.

Claim confidence is separate from source class:

- `high`: the recovered publisher artifact states the behavior directly, or two independent primary
  publications agree.
- `medium`: publisher-authored content is available only through a mirror/transcription, describes a
  browser family rather than one handset, or leaves an implementation detail implicit.
- `low`: only partial service documentation, a secondary account, or an unresolved conflict exists.

An archived or mirrored payload establishes research availability, not permission to republish it.
The recovered PDFs and extracted text remain outside Git. Hashes, sizes, publication identities,
source routes, and research conclusions may be recorded here. No access controls were bypassed.

## Recovered Source Index

Retrieval and verification date for all rows is 2026-07-26.

| ID           | Publisher source                                                                                                  | Retrieval and integrity                                                                                                                                                                                                                                                    | Class / provenance                                                                                  | Redistribution posture                                                                                             |
| ------------ | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `OW-2000`    | Phone.com, _WML Application Style Guide: Designing and Developing WML Applications_, `WMLS-01-001`, August 2000   | [2003 archive capture of the original Openwave URL](https://web.archive.org/web/20030313113811id_/http://demo.openwave.com:80/pdf/styleguides/wml_style.pdf); 398,527 bytes; SHA-256 `de13b6c11fd4033813b8ed3144f12e6eb41fc73d12c9b76f3b60a230ac5cda11`; PDF 1.2, 78 pages | `P1`; high content identity, medium byte lineage because no publisher checksum survives             | Copyright notice reserves rights and restricts reproduction, modification, and distribution; private research only |
| `OW-2001`    | Openwave, _Graphical Browser Application Style Guide_, Mobile Browser WAP Edition 5.0, `MBWS-50-002`, August 2001 | [public university SDK mirror](http://www1.lasalle.edu/~beatty/430/wireless/toolkit/client_tech_and_sdk/pdf/style_guide.pdf); 544,068 bytes; SHA-256 `d8a911ddb1a3de095fcdd7a387c2ad622153f47bd8f0f13a6db4cba3a3dda65b`; PDF 1.3, 86 pages                                 | `P1`; high content identity, medium byte lineage                                                    | Restricted copyright notice; private research only                                                                 |
| `NK-7110`    | Nokia, _Service Developer's Guide for the Nokia 7110_, `9359203`, issue 3, November 1999                          | [public mirror](https://www.filibeto.org/mobile/files/sservice_dev_guide.pdf); 242,486 bytes; SHA-256 `9eb8a3a4d97266f31bd3806d53d60ea8661be656d647382d365b07bdc5e2fec4`; PDF 1.2, 34 pages                                                                                | `P1`; high content identity, medium byte lineage                                                    | Notice permits personal download/printing only; private research copy retained outside Git                         |
| `NK-2000`    | Nokia, _WAP Service Designer's Guide to Nokia Handsets_, 16 June 2000                                             | [public university mirror](http://stl.cs.queensu.ca/~graham/cisc836/lectures/readings/nokia-designers-guide.pdf); 354,355 bytes; SHA-256 `7440173d99f7dbad2b08cc832d212bdeb53cf984fff87623e81a54462514241f`; PDF 1.3, 16 pages                                             | `P1`; high content identity, medium byte lineage; corroborates `NK-7110`                            | Notice permits personal download/printing only; private research copy retained outside Git                         |
| `ER-R380`    | Ericsson, _R380s Design Guidelines for WAP Services_, `LZT 108 3339`, first edition, November 1999                | [public manual mirror](https://usermanual.wiki/Ericsson/EricssonR380UsersManual540796.930088381.pdf); 667,004 bytes; SHA-256 `904dd9511ecc5605dc2fbbb35fdb7fefd518af4ac23b19b2308f9540d49ef3b0`; PDF 1.3, 25 pages                                                         | `P1`; high content identity, medium byte lineage                                                    | All-rights-reserved notice and no redistribution grant; private research only                                      |
| `ER-R320-WP` | Ericsson, _R320s White Paper_, `LZT 108 3714 R1A`, first edition, March 2000                                      | [full-text mirror](https://manualzz.com/doc/924263/ericsson-r320s-white-paper); publisher PDF not recovered                                                                                                                                                                | `S1` transcription of an identified `P1` publication; medium                                        | Mirror view only; no binary, checksum, or redistribution grant                                                     |
| `ER-WAPIDE`  | Ericsson, _WapIDE 3.1 User's Guide_, 9 April 2001                                                                 | [full-text mirror](https://manualzilla.com/doc/6879776/user-s-guide); publisher PDF not recovered                                                                                                                                                                          | `S1` transcription of an identified `P1` publication; medium                                        | Mirror view only; no binary, checksum, or redistribution grant                                                     |
| `MO-P7389`   | Motorola, _Timeport P7382i/P7389i Level III Service Manual_                                                       | [full-text mirror](https://manualzz.com/doc/1783019/motorola-timeport-p7389i-service-manual); publisher PDF not recovered                                                                                                                                                  | `S1` transcription of an identified `P1` service publication; low-to-medium for browser interaction | Mirror view only; no binary, checksum, or redistribution grant                                                     |
| `GENIE-2001` | Genie, _Application Style Guide for Openwave, Nokia 7110/6210/6250, Mitsubishi Trium_, release 1.0, February 2001 | [page-by-page mirror](https://manualsdump.com/en/manuals/genie-7110model/52158/5); original publication was linked from Openwave's developer library; publisher PDF not recovered                                                                                          | `S1` mirror of an identified `P2` publication; medium corroboration only                            | No verified redistribution grant; do not promote mirror content                                                    |

The Wayback CDX record for `OW-2000` reports a 240,928-byte capture record while the replayed PDF is
398,527 bytes. The replayed file has a valid PDF structure, matching internal publication identity,
period PDF metadata, and the original archived URL, but the size discrepancy prevents a high-confidence
byte-lineage claim without a publisher checksum.

For each recovered PDF, verification included file-signature and metadata inspection, page count,
SHA-256, text extraction, and rendered-page review. The rendered Openwave softkey template, Nokia
Options sequence, and Ericsson R380 browser layout were visually checked against the extracted text.
Encrypted Nokia PDFs were inspected within their granted print permission; their copy restrictions
were not removed.

## Interaction Evidence Matrix

`H`, `M`, and `L` are claim-confidence levels; `--` means the interaction does not apply to that form
factor or no useful evidence was recovered.

| Candidate                             | Viewport / type | Focus / controls |        Softkeys / menu | Editors / forms | History | Timers | Failures / limits |
| ------------------------------------- | --------------: | ---------------: | ---------------------: | --------------: | ------: | -----: | ----------------: |
| Nokia 7110                            |               H |                H |                      H |               H |       H |      L |                 H |
| Phone.com/Openwave 4.x family         |               M |                M | H logical / L physical |               H |       H |      M |                 H |
| Openwave Mobile Browser 5.0 graphical |               M |                M | H logical / L physical |               H |       H |      M |                 H |
| Ericsson R320s                        |               H |                M |                      M |               M |       M |      L |                 M |
| Ericsson R380s                        |               H |          H touch |                     -- |               H |       H |      M |                 H |
| Motorola P7382i/P7389i                |               M |                L |                      L |               M |       L |      L |                 M |

## Profile Assessments

### Nokia 7110: ready for profile planning

`NK-7110` and `NK-2000` agree on the profile-defining interaction model:

- 96 by 65 pixels overall, with a 96 by 44-pixel content graphics area and four data lines;
- proportional 8-pixel normal and bold fonts, header truncation, word wrapping, and underlined links
  placed on their own lines;
- inverse-video focus, line-by-line scrolling, roller movement, and roller press to select;
- left `Options` and right `Back` during normal browsing;
- fixed Options ordering: Home, Bookmarks, current Select/Edit action, card `do` actions in source
  order, conditional Use Number, Empty Cache, then Exit with confirmation;
- number, text, and password editors, with the right softkey changing between Back and Clear and
  password characters becoming masked;
- `prev`/Back history behavior and documented bookmark behavior;
- concrete rendering limitations, including flattened tables, ignored emphasis, images constrained or
  truncated to the 96 by 44 area, and no image-map links.

This is sufficient to plan fixtures and profile-specific goldens. It is not authorization to begin
implementation before the Class C, compatibility-registry, and frame/input gates. A 7110-specific
timer cadence, firmware/version matrix, and reproducible failure corpus remain open and must be
treated as explicit gaps rather than inferred from general WML behavior.

### Phone.com/Openwave: browser-family behavior recovered, handset identity still open

`OW-2000` is the missing primary browser-vendor guide and provides strong logical behavior:

- a typical four-line display, 12 to 15 characters per line, with deployed phones ranging from two
  to eight lines and using mostly variable-width fonts;
- two programmable actions: the primary `accept` action and secondary `options` access, plus a fixed
  Back/Back-Clear control;
- overflow actions placed in a numbered options menu, short labels, compact menus, and a preference
  for the common action on the primary binding;
- complete guidance for text, numeric, password, and formatted fields, validation before acceptance,
  selection lists, retained values, and clearing entry state;
- default Back/history and cache behavior, including activity/delete patterns that deliberately
  remove intermediate cards from history;
- timer/image-loading races, unsupported-character substitution, no horizontal image scrolling, and
  significant OEM variation in display and control characteristics.

The guide's display template says `accept` is on the left and `options` on the right, while adjacent
prose describes the primary key as the right softkey. `OW-2001` contains a comparable left/right
inconsistency. Both guides also say handset manufacturers can vary browser characteristics. Therefore
the logical primary/secondary precedence is high-confidence evidence, but a physical left/right
mapping is not safe at browser-family level. A future profile must name one shipped handset and
browser release, then pair the Openwave guide with that handset's manufacturer user/developer guide.

`OW-2001` is valuable successor evidence for the 5.0 graphical browser: it documents three to eight
display lines, mostly variable-width text, link styling, pop-up menus, buttons, radio controls, and
the rule that an activated editor or pop-up consumes the programmable-softkey surface. It must not be
silently projected backward onto Phone.com 4.x or onto a handset whose OEM controls differ.

### Ericsson: R320 evidence is promising; R380 is a separate touch profile

The R320 white paper provides a 101 by 65-pixel display, five full-screen rows including the header,
four selection/input rows including the header, proportional font capacity, inverse link focus, an
image focus frame, a 4 KB cache, and up to 25 bookmarks. The WapIDE guide adds short `YES` to follow or
confirm, held `YES` for Options, short `NO` for Back/history, vertical scrolling, horizontal movement
among table cells or multiple links, and a mixed menu of card actions plus fixed browser actions.

These are publisher-authored sources, but only third-party text views were recoverable. The exact R320
design guide, byte-verified developer PDFs, editor details, timer behavior, precise fixed-menu ordering,
and firmware-specific failures remain open. The consumer manual also distinguishes `Suspend` in the
browser menu from `Resume` in the phone's WAP Services menu; they must not be presented as one fixed
Options sequence.

`ER-R380` is a strong primary source for a different device class: a 360 by 120 touchscreen with a
310 by 100 browser area, breadcrumb-like title/history display, toolbar navigation, proportional
9/10/14-pixel fonts, touch focus, list and button controls, and on-screen keyboard or handwriting
entry. It should inform a later R380 touch profile, not fill R320 keypad/softkey gaps.

### Motorola: service evidence is not enough for a named profile

`MO-P7389` establishes a 96 by 54 display, WAP 1.1 support, simplified alphabetic entry, partial
display of oversized bitmaps, browser entry through Quick Access/menu paths, and pause/resume around
incoming calls. It does not establish focus traversal, exact softkey precedence, Options ordering,
history semantics, timers, or a complete editor model. A manufacturer browser/application developer
guide and a byte-verified consumer manual are still required before planning a Motorola profile.

## Conflicts and Non-Inferences

1. Openwave's logical primary/secondary action model is supported; its physical left/right mapping is
   unresolved and may be OEM-specific.
2. Openwave 5.0 graphical-browser behavior is successor/delta evidence, not proof of 4.x behavior.
3. Nokia 7110 and Nokia 6210/6250 corroboration does not make handset metrics interchangeable; the
   comparative Nokia guide lists different display heights.
4. Ericsson R320s keypad behavior and Ericsson R380s touchscreen behavior are separate profiles.
5. `Suspend` and `Resume` are different R320 state transitions in different menus, not adjacent fixed
   Options items.
6. Service-manual facts and third-party recollections are candidate-fixture context, not a basis for
   profile requirements.
7. None of these sources may redefine the neutral `Class C Reference`, WML task semantics, or a
   normative `RQ-*` item.

## Readiness Decision and Future Work

The Nokia 7110 is the first named profile ready to plan because two concordant Nokia publications
cover every requested interaction domain except device-specific timer cadence and a reproducible
failure/version matrix. Planning must preserve those gaps and the existing runtime gates.

Openwave is next only as an evidence-lock task, not an implementation profile: select a representative
shipping handset/browser version, recover its manufacturer interaction guide, resolve physical
controls and editor modes, and establish device-specific viewport, timer, and failure fixtures. The
browser-family guides alone do not justify a generic `Openwave` compatibility profile.

Ericsson R320 and Motorola remain source-recovery candidates. R380 has adequate design-guide evidence
but represents a materially different touch device and should follow, not substitute for, the keypad
profiles prioritized by the current product direction.

## Unresolved Primary-Source Queue

1. A handset-specific Openwave/UP.Browser 4.x user or developer guide that names browser version,
   physical softkeys, viewport, editors, and known failures.
2. The publisher PDF for the Ericsson R320 design/developer guide, plus byte-verified R320 user and
   WapIDE manuals.
3. A Motorola application/browser developer guide for a representative WAP handset, plus a
   byte-verified consumer manual.
4. Device/firmware release notes or test reports for timer cadence, cache faults, network failure
   presentation, and known browser defects across the selected profiles.
5. Publisher checksums or authenticated archives for all mirrored PDFs, and explicit redistribution
   permission before any binary or extracted derivative is proposed for Git.
