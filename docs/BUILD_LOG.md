# Build provenance

Second Serve was developed for the September 5–6, 2026 hackathon, with work continuing during the published submission window. This file distinguishes project work from existing dependencies; it is not a claim of authorship over those dependencies.

## Existing foundations

- A generated Sites/Vinext/React application scaffold and installed Shadcn/Base UI primitives.
- Mozaik 4.0.6 and its published API/types.
- React, Cloudflare Workers/D1, Drizzle, Tailwind, Lucide, and Geist.
- Standard testing and development packages, retained in the package lockfile.

## Entry-specific implementation

- Original food-rescue scenario, feasibility model, and revision-checked reservation tool.
- Three-agent event-driven Mozaik session engine and role-specific tools/instructions.
- Provider inference runner and explicitly labeled rehearsal implementation.
- D1 schema, generated migration, streaming API, command queue, and private run history.
- Dispatch desk, functional map, donation panel, network view, timeline, recorded-evidence view, and export.
- Constraint/runtime tests, HTTP verification, and actual live inference evidence.
- Local Codex development bridge, documentation, and submission/demo writing.

Dependency versions were updated to address high-severity starter advisories. The production-only npm audit reported zero known vulnerabilities at validation. The full development tree retained moderate advisories in Drizzle's transitive tooling; see current `npm audit` for the exact package report. This is a point-in-time dependency scan, not a security guarantee.

AI assistance: Codex assisted research, coding, verification, and writing under the solo participant's direction. No additional human team members are represented.
