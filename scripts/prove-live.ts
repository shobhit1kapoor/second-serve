import { createDispatchEngine } from '../lib/dispatch-engine';
import { maxOverlap, metrics } from '../lib/domain';
import { writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

if (!process.env.OPENAI_API_KEY)
  throw new Error(
    'Configure a server-side provider key before collecting live evidence.',
  );
let cancelled = false;
let latestEvents = 0;
const engine = createDispatchEngine({
  id: crypto.randomUUID(),
  mode: 'live',
  provider: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
    baseUrl: process.env.OPENAI_BASE_URL,
    timeoutMs: 90000,
  },
  onChange(run) {
    for (const event of run.events.slice(latestEvents))
      if (!event.type.startsWith('inference.'))
        console.log(`${event.actor}: ${event.title}`);
    latestEvents = run.events.length;
  },
});
engine.start();
const deadline = Date.now() + 600000;
while (Date.now() < deadline) {
  await new Promise((resolve) => setTimeout(resolve, 150));
  if (engine.record.error) break;
  if (!cancelled && engine.record.state.assignments.length >= 2) {
    const driverId = engine.record.state.assignments[0].driverId;
    engine.command({
      id: crypto.randomUUID(),
      type: 'driver_unavailable',
      driverId,
    });
    cancelled = true;
  }
  if (cancelled && engine.isIdle()) break;
}
engine.finish();
while (!engine.isIdle() && Date.now() < deadline)
  await new Promise((resolve) => setTimeout(resolve, 100));
await mkdir('evidence', { recursive: true });
const provider = process.env.OPENAI_BASE_URL?.includes('127.0.0.1')
  ? 'local-codex'
  : 'api';
await writeFile(
  `evidence/live-${provider}-run.json`,
  JSON.stringify(engine.record, null, 2),
);
assert.equal(engine.record.error, undefined, 'Live inference must succeed.');
assert.ok(
  cancelled,
  'A real model must reserve at least two pickups before cancellation.',
);
assert.ok(engine.isIdle(), 'All agent turns must settle.');
assert.ok(
  maxOverlap(engine.record.spans) >= 2,
  'Real model requests must overlap.',
);
assert.ok(
  engine.record.state.findings.length >= 2,
  'Agents must publish shared findings.',
);
assert.ok(
  engine.record.state.assignments.length > 0,
  'Replanning must produce a feasible plan.',
);
assert.ok(
  engine.record.state.assignments.every(
    (a) =>
      engine.record.state.drivers.find((d) => d.id === a.driverId)?.available,
  ),
);
console.log(
  JSON.stringify(
    {
      provider,
      concurrentPeak: maxOverlap(engine.record.spans),
      calls: engine.record.calls,
      metrics: metrics(engine.record.state),
    },
    null,
    2,
  ),
);
