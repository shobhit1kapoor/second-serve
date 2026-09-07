import { describe, expect, it } from 'vitest';
import {
  applyCommand,
  candidateAssignments,
  createScenario,
  metrics,
  reserve,
  travelMinutes,
} from '../lib/domain';
function fillBoard() {
  const s = createScenario();
  while (candidateAssignments(s).length) {
    const c = candidateAssignments(s)[0];
    reserve(s, {
      ...c,
      expectedRevision: s.revision,
      explanation: 'Verified fixture route',
    });
  }
  return s;
}
describe('dispatch consistency', () => {
  it('reserves a feasible donation exactly once', () => {
    const s = createScenario();
    const c = candidateAssignments(s)[0];
    expect(
      reserve(s, { ...c, expectedRevision: 0, explanation: 'test' }).ok,
    ).toBe(true);
    expect(
      reserve(s, {
        ...c,
        expectedRevision: s.revision,
        explanation: 'duplicate',
      }).ok,
    ).toBe(false);
    expect(s.assignments).toHaveLength(1);
  });
  it('rejects stale state without reserving anything', () => {
    const s = createScenario();
    s.revision = 2;
    const c = candidateAssignments(s)[0];
    expect(
      reserve(s, { ...c, expectedRevision: 0, explanation: 'stale' }).ok,
    ).toBe(false);
    expect(s.assignments).toHaveLength(0);
    expect(s.conflictsPrevented).toBe(1);
  });
  it('does not put chilled food in a standard vehicle', () => {
    const s = createScenario();
    expect(candidateAssignments(s, 'd3').some((c) => c.driverId === 'v1')).toBe(
      false,
    );
  });
  it('checks recipient categories and total capacity', () => {
    const s = fillBoard();
    for (const r of s.recipients) {
      const donations = s.assignments
        .filter((a) => a.recipientId === r.id)
        .map((a) => s.donations.find((d) => d.id === a.donationId)!);
      expect(
        donations.reduce((sum, d) => sum + d.portions, 0),
      ).toBeLessThanOrEqual(r.capacity);
      expect(donations.every((d) => r.accepts.includes(d.category))).toBe(true);
    }
  });
  it('keeps cumulative route arrivals inside pickup windows', () => {
    const s = fillBoard();
    for (const v of s.drivers) {
      let elapsed = 0,
        point = v.point;
      for (const a of s.assignments.filter((a) => a.driverId === v.id)) {
        const d = s.donations.find((d) => d.id === a.donationId)!;
        expect(elapsed + travelMinutes(point, d.point)).toBeLessThanOrEqual(
          d.closesAt,
        );
        elapsed += a.minutes;
        point = s.recipients.find((r) => r.id === a.recipientId)!.point;
      }
    }
  });
  it('releases cancellations and invalidates earlier board revisions', () => {
    const s = fillBoard();
    const driver = s.assignments[0].driverId;
    const revision = s.revision;
    applyCommand(s, {
      id: 'cancel',
      type: 'driver_unavailable',
      driverId: driver,
    });
    expect(s.assignments.every((a) => a.driverId !== driver)).toBe(true);
    expect(candidateAssignments(s).every((c) => c.driverId !== driver)).toBe(
      true,
    );
    expect(s.revision).toBeGreaterThan(revision);
  });
  it('removes expired reservations when scenario time advances', () => {
    const s = fillBoard();
    for (let i = 0; i < 4; i++)
      applyCommand(s, { id: String(i), type: 'advance_time', minutes: 30 });
    expect(s.assignments).toHaveLength(0);
    expect(metrics(s).portions).toBe(0);
  });
  it('deduplicates the additional donation', () => {
    const s = createScenario();
    for (let i = 0; i < 3; i++)
      applyCommand(s, { id: String(i), type: 'add_donation' });
    expect(s.donations).toHaveLength(6);
  });
  it('does not exceed any driver capacity across multiple reservations', () => {
    const s = fillBoard();
    for (const v of s.drivers) {
      const weight = s.assignments
        .filter((a) => a.driverId === v.id)
        .reduce(
          (n, a) => n + s.donations.find((d) => d.id === a.donationId)!.weight,
          0,
        );
      expect(weight).toBeLessThanOrEqual(v.capacity);
    }
  });
});
