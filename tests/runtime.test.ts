import { describe, expect, it } from 'vitest';
import { createDispatchEngine } from '../lib/dispatch-engine';
import { maxOverlap } from '../lib/domain';
const waitUntil = async (check: () => boolean, timeout = 25000) => {
  const end = Date.now() + timeout;
  while (!check()) {
    if (Date.now() > end) throw new Error('Runtime did not settle');
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
};
describe('real Mozaik runtime with explicitly simulated inference', () => {
  it('overlaps agents, shares evidence, and repairs a cancellation', async () => {
    const engine = createDispatchEngine({
      id: 'runtime-proof',
      mode: 'rehearsal',
      provider: { model: 'rehearsal' },
      onChange() {},
    });
    engine.start();
    await waitUntil(() => engine.record.state.assignments.length >= 2);
    const driver = engine.record.state.assignments[0].driverId;
    engine.command({
      id: 'cancel-once',
      type: 'driver_unavailable',
      driverId: driver,
    });
    engine.command({
      id: 'cancel-once',
      type: 'driver_unavailable',
      driverId: driver,
    });
    await waitUntil(() => engine.isIdle());
    expect(maxOverlap(engine.record.spans)).toBeGreaterThanOrEqual(2);
    expect(engine.record.state.cancellations).toBe(1);
    expect(
      engine.record.state.assignments.every((a) => a.driverId !== driver),
    ).toBe(true);
    expect(engine.record.events.some((e) => e.type === 'finding.shared')).toBe(
      true,
    );
    expect(
      engine.record.events.some(
        (e) =>
          e.type === 'agent.awakened' && e.detail.startsWith('Peer finding'),
      ),
    ).toBe(true);
    expect(engine.record.state.agents.every((a) => a.turns >= 2)).toBe(true);
    const before = JSON.stringify(engine.record.state.assignments);
    engine.finish();
    engine.command({ id: 'after-finish', type: 'add_donation' });
    expect(JSON.stringify(engine.record.state.assignments)).toBe(before);
    expect(engine.record.status).toBe('complete');
  });
  it('records provider failure and settles without a fabricated model success', async () => {
    const engine = createDispatchEngine({
      id: 'failure-proof',
      mode: 'live',
      provider: { model: 'missing-key' },
      onChange() {},
    });
    engine.start();
    await waitUntil(() => engine.isIdle());
    engine.finish();
    expect(engine.record.status).toBe('error');
    expect(engine.record.state.assignments).toHaveLength(0);
    expect(engine.record.spans.every((s) => s.outcome === 'error')).toBe(true);
  });
});
