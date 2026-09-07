# Release validation

Validated locally on September 6, 2026 with Node.js 25.3.0. The supported minimum declared in the project is Node 22.13; CI uses Node 22.

| Check | Result |
| --- | --- |
| TypeScript strict check | Passed |
| Application lint | Passed |
| Domain and actual Mozaik runtime tests | 11 passed |
| Provider transport and request pacing tests | Ten passed: metadata round-trip, batched tool delivery, quota redaction, transient retry, invalid action rejection, rolling admission, cancelled waits |
| Production Worker build | Passed |
| Production dependency audit | Zero known vulnerabilities at validation |
| Fresh D1 migration in a separate local store | Passed |
| Rehearsal streaming API integration | Passed |
| Real-model streaming API integration | Passed: 17 calls, 59 events, four final reservations |
| Live overlap/replanning evidence script | Passed: three overlapping model requests, one stale rejection |
| Hosted streaming API integration | Passed: timely SSE snapshots, cancellation, durable history, owner isolation, origin rejection |
| Clean GitHub CI on Node 22 | Passed for the deployed release |

## Browser verification

The app was tested in the Codex in-app browser at desktop and mobile viewport overrides. No horizontal document overflow was observed at the tested mobile width (approximately 391 CSS pixels). The browser's viewport scaling differs from its override dimensions, so the measured CSS viewport was used when interpreting responsive behavior.

Verified through the visible interface:

- Start a rehearsal and receive streamed agent/plan updates.
- Cancel an assigned driver; observe released reservations and revised state.
- Add Corner Deli's late donation; observe total portions increasing to 158.
- Advance scenario time by 15 minutes; observe changed pickup windows.
- Open the network view and inspect driver weights and partner capacity.
- Finish a session and reopen it from durable history after a page update.
- Export a JSON file; the downloaded file parsed successfully with `status: complete` and 99 recorded events. The browser automation download notification timed out, so the actual downloaded artifact was verified directly.
- Open the captured real-agent run and inspect its evidence.
- Open donation details and dismiss the drawer with Escape.
- Activate a map pin using Enter; operate zoom/reset controls.
- Filter to donations needing pickup; the recorded run correctly showed only Orchard Market.
- Use the mobile menu; selecting a destination closes it and reveals the destination view.
- Read the browser's recorded warning/error logs after the checks; none were reported for those checks.

Browser testing found and corrected mobile menu dismissal, narrow driver-card wrapping, inaccessible SVG pin descendants, misleading saved-agent statuses, and raw update payloads in the visible event trail.

The deployed browser also passed start, streamed five reservations, cancel Maya, revised four-reservation plan, and Finish & save. No browser warning or error was reported for that check. A gateway buffering issue was resolved by periodically repeating the authoritative SSE snapshot; the hosted integration asserts snapshot delivery age below 20 seconds.

Screenshots in `docs/images/` show actual app states, including a captured real-agent run. These checks are not a full accessibility certification, load test, security assessment, or verification of real logistics operations.
