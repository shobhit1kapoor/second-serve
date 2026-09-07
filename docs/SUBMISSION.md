# Submission copy

## Project name

Second Serve

## Tagline

Good food. Another chance.

## Short description

The food is ready. The pantry has room. Then the driver cancels.

Second Serve is a food-rescue dispatch desk built for that moment. Three Mozaik agents work together on donation deadlines, community capacity, and transport. When the situation changes, the team revises its plan while the system checks every reservation against the latest shared board.

You can remove a driver mid-run, add a late donation, and inspect exactly what changed. The app includes a working backend, saved sessions, a neighborhood map, and an evidence timeline. A captured real-agent run shows three overlapping model requests and a stale reservation being rejected before the team replans.

The neighborhood is simulated; the model reasoning and coordination in live mode are real. The goal is practical: help a coordinator turn a changing list of good intentions into a pickup plan they can actually review.

## How the agents run concurrently

Second Serve uses `@mozaik-ai/core` 4.0.6. Each dispatch session creates a typed Mozaik runtime with three joined agents: Scout checks donation windows and transport needs, Bridge checks recipient acceptance and capacity, and Relay creates pickup reservations.

Their `runLoop` calls start independently. Scout and Bridge publish findings as semantic events; Relay's situation handler reacts to those findings. A human coordinator can send a driver cancellation or a new donation while inference is in flight. Updates are coalesced per busy agent and reconsidered against the latest board after its current turn, while other agents keep working.

Reservations carry an expected board revision. The tool rejects stale decisions and enforces driver, recipient, time-window, and duplicate-pickup constraints before changing state. In our recorded real-model run, a cancellation arrived while Relay was reasoning. Its stale request was rejected, the specialists shared updated findings, and the team produced a revised four-pickup plan. The exported trace contains actual request timestamps, events, findings, and tool outcomes, with three overlapping model requests at the peak.

Rehearsal mode uses explicitly labeled deterministic inference and is not presented as LLM evidence. Real inference can use a configured compatible API provider, or the optional local Codex bridge for development.

## Solo builder bio

I'm Shobhit Kapoor, building solo. For this hackathon, I wanted to explore what happens after an agent makes a reasonable plan and the world changes. Second Serve puts that question into a familiar setting: getting surplus food to people before the pickup window closes. I focused on a complete, inspectable workflow where the interface, agent behavior, and backend checks tell the same story.

## AI assistance disclosure

I used Codex to assist with research, implementation, writing, and verification. Existing open-source dependencies and generated UI primitives are credited in the repository. The project-specific dispatch logic, Mozaik orchestration, interface, persistence, and evidence scripts were developed for this entry. AI assistance is part of the build process; live application inference is separately observable in the exported run records.

## Fields to finish after publication

- Repository URL: use the final accessible GitHub repository.
- Deployment URL: use the final published link after verifying judge access.
- Demo video URL: use the uploaded demonstration if available; the written walkthrough is in `docs/DEMO.md`.
- Contact email: use the participant's registered address.
- Team name: leave blank for solo.

Do not submit placeholder links or describe a private deployment as judge-accessible. Confirm the event's eligibility and submission attestations from the participant before making personal declarations on their behalf.
