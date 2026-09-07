import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
const base = process.env.DISPATCH_URL ?? 'http://localhost:3000';
const session = await fetch(`${base}/api/session`);
assert.equal(session.status, 200);
const cookie = session.headers.get('set-cookie').split(';')[0];
const headers = { 'Content-Type': 'application/json', Cookie: cookie };
const response = await fetch(`${base}/api/runs/start`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    mode: process.env.DISPATCH_LIVE === '1' ? 'live' : 'rehearsal',
  }),
});
if (!response.ok) throw new Error(await response.text());
const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '',
  latest,
  cancelled = false,
  finished = false;
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  let at;
  while ((at = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, at);
    buffer = buffer.slice(at + 1);
    if (!line || line.startsWith(':')) continue;
    const e = JSON.parse(line.startsWith('data: ') ? line.slice(6) : line);
    if (e.type !== 'snapshot') continue;
    latest = e.run;
    if (latest.error) {
      await reader.cancel();
      throw new Error(latest.error);
    }
    assert.ok(
      Date.now() - (e.at ?? latest.events.at(-1)?.at ?? latest.startedAt) <
        20000,
      'Streaming snapshots must arrive promptly, before the session expires.',
    );
    if (!cancelled && latest.state.assignments.length >= 2) {
      cancelled = true;
      const driverId = latest.state.assignments[0].driverId;
      const r = await fetch(`${base}/api/runs/${latest.id}/commands`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: crypto.randomUUID(),
          type: 'driver_unavailable',
          driverId,
        }),
      });
      assert.equal(r.status, 200);
    }
    if (
      cancelled &&
      !finished &&
      latest.status === 'watching' &&
      latest.state.cancellations === 1
    ) {
      finished = true;
      const r = await fetch(`${base}/api/runs/${latest.id}/commands`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ type: 'finish' }),
      });
      assert.equal(r.status, 200);
    }
  }
}
assert.ok(latest);
assert.equal(latest.status, 'complete');
assert.equal(latest.state.cancellations, 1);
assert.ok(latest.state.assignments.length > 0);
assert.ok(latest.spans.some((s) => s.end));
const saved = await fetch(`${base}/api/runs/${latest.id}`, { headers });
assert.equal(saved.status, 200);
const record = await saved.json();
assert.equal(record.status, 'complete');
const foreign = await fetch(`${base}/api/runs/${latest.id}`, {
  headers: { Cookie: `second_serve_session=${crypto.randomUUID()}` },
});
assert.equal(foreign.status, 404);
const crossOrigin = await fetch(`${base}/api/runs/${latest.id}/commands`, {
  method: 'POST',
  headers: { ...headers, Origin: 'https://untrusted.example' },
  body: JSON.stringify({ type: 'add_donation' }),
});
assert.equal(crossOrigin.status, 403);
const history = await (await fetch(`${base}/api/runs`, { headers })).json();
assert.ok(history.runs.some((r) => r.id === latest.id));
await mkdir('evidence', { recursive: true });
await writeFile(
  `evidence/${record.mode}-api-run.json`,
  JSON.stringify(record, null, 2),
);
console.log(
  JSON.stringify(
    {
      status: 'passed',
      mode: record.mode,
      run: record.id,
      assignments: record.state.assignments.length,
      events: record.events.length,
      calls: record.calls,
      checks: [
        'streaming',
        'mid-run cancellation',
        'durable history',
        'ownership isolation',
        'cross-origin rejection',
      ],
    },
    null,
    2,
  ),
);
