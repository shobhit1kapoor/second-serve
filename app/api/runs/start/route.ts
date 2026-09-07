import { createDispatchEngine } from '@/lib/dispatch-engine';
import {
  canStart,
  environment,
  pendingCommands,
  saveRun,
} from '@/lib/server/store';
import { apiError, checkOrigin, ownerFrom } from '@/lib/server/http';
import type { RunRecord } from '@/lib/domain';
import { providerConfig } from '@/lib/provider-config';

export async function POST(request: Request) {
  const owner = ownerFrom(request) ?? '';
  if (!owner || !checkOrigin(request))
    return apiError('Open the workspace before starting a run.', 403);
  let body: { mode?: string };
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid request.');
  }
  if (!['live', 'rehearsal'].includes(body.mode ?? ''))
    return apiError('Choose live or rehearsal mode.');
  const mode = body.mode as 'live' | 'rehearsal';
  const provider = providerConfig(environment());
  if (mode === 'live' && !provider.apiKey)
    return apiError(
      'Live reasoning needs a configured model provider. Rehearsal remains available.',
      409,
    );
  if (!(await canStart(owner)))
    return apiError(
      'The hourly demo limit has been reached. Your saved runs are still available.',
      429,
    );
  const id = crypto.randomUUID();
  const encoder = new TextEncoder();
  const snapshot = (run: RunRecord) =>
    encoder.encode(
      'data: ' +
        JSON.stringify({ type: 'snapshot', at: Date.now(), run }) +
        '\n\n',
    );
  let disconnected = false;
  let latest: RunRecord;
  const engine = createDispatchEngine({
    id,
    mode,
    provider,
    onChange(run) {
      latest = run;
      if (!disconnected) {
        try {
          streamController?.enqueue(snapshot(run));
        } catch {
          disconnected = true;
        }
      }
    },
  });
  latest = structuredClone(engine.record);
  await saveRun(latest, owner, true);
  let streamController: ReadableStreamDefaultController<Uint8Array> | undefined;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      streamController = controller;
      void pump();
    },
    cancel() {
      disconnected = true;
      engine.finish();
    },
  });
  async function pump() {
    let lastSaved = 0;
    let lastSnapshot = 0;
    try {
      engine.start();
      while (!engine.isFinished()) {
        if (disconnected || Date.now() - engine.record.startedAt > 240000) {
          engine.finish();
          break;
        }
        for (const command of await pendingCommands(id))
          engine.command(command);
        if (Date.now() - lastSaved > 700) {
          await saveRun(latest, owner);
          lastSaved = Date.now();
        }
        // Some gateways coalesce small chunks. Repeating authoritative snapshots
        // also delivers a settled state when no further semantic events occur.
        if (!disconnected && Date.now() - lastSnapshot > 1000) {
          streamController?.enqueue(snapshot(latest));
          lastSnapshot = Date.now();
        }
        await new Promise((resolve) => setTimeout(resolve, 450));
      }
      // Let in-flight inference settle; stopped tools cannot mutate the final plan.
      const until = Date.now() + Math.max(26000, (provider.timeoutMs ?? 25000) + 1000);
      while (!engine.isIdle() && Date.now() < until)
        await new Promise((resolve) => setTimeout(resolve, 100));
      await saveRun(latest, owner);
    } catch {
      engine.record.error =
        'The dispatch connection was interrupted. The most recent saved plan remains available.';
      engine.finish();
      try {
        await saveRun(engine.record, owner);
      } catch {
        /* Preserve the response error even if storage is unavailable. */
      }
    } finally {
      if (!disconnected) {
        try {
          streamController?.enqueue(snapshot(engine.record));
          streamController?.close();
        } catch {
          /* Client closed the stream. */
        }
      }
    }
  }
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      'X-Accel-Buffering': 'no',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
