export type Role = 'supply' | 'community' | 'dispatch';
export type Mode = 'live' | 'rehearsal';
export type Point = { x: number; y: number };
export type Donation = {
  id: string;
  name: string;
  food: string;
  category: 'Bakery' | 'Produce' | 'Prepared';
  portions: number;
  weight: number;
  closesAt: number;
  point: Point;
  address: string;
  chilled: boolean;
};
export type Recipient = {
  id: string;
  name: string;
  capacity: number;
  accepts: Donation['category'][];
  point: Point;
  address: string;
};
export type Driver = {
  id: string;
  name: string;
  initials: string;
  capacity: number;
  chilled: boolean;
  available: boolean;
  point: Point;
  color: string;
};
export type Assignment = {
  id: string;
  donationId: string;
  recipientId: string;
  driverId: string;
  minutes: number;
  revision: number;
  explanation: string;
  status: 'reserved' | 'delivered';
};
export type Finding = {
  id: string;
  role: Role;
  title: string;
  detail: string;
  donationIds: string[];
  revision: number;
};
export type AgentStatus = {
  role: Role;
  name: string;
  title: string;
  state: 'ready' | 'thinking' | 'watching' | 'error';
  turns: number;
  summary: string;
};
export type DispatchState = {
  revision: number;
  minute: number;
  donations: Donation[];
  recipients: Recipient[];
  drivers: Driver[];
  assignments: Assignment[];
  findings: Finding[];
  agents: AgentStatus[];
  cancellations: number;
  conflictsPrevented: number;
};
export type TraceEvent = {
  id: string;
  sequence: number;
  at: number;
  type: string;
  actor: string;
  title: string;
  detail: string;
  revision: number;
  data?: Record<string, unknown>;
};
export type Span = {
  id: string;
  role: Role;
  start: number;
  end?: number;
  outcome?: 'ok' | 'error';
};
export type RunRecord = {
  id: string;
  mode: Mode;
  status: 'ready' | 'running' | 'watching' | 'complete' | 'error';
  startedAt: number;
  endedAt?: number;
  state: DispatchState;
  events: TraceEvent[];
  spans: Span[];
  model: string;
  error?: string;
  calls: number;
};
export type Command = {
  id: string;
  type: 'driver_unavailable' | 'add_donation' | 'advance_time' | 'finish';
  driverId?: string;
  minutes?: number;
};
export const AGENTS: AgentStatus[] = [
  {
    role: 'supply',
    name: 'Scout',
    title: 'Donation specialist',
    state: 'ready',
    turns: 0,
    summary: 'Watching pickup windows and available food.',
  },
  {
    role: 'community',
    name: 'Bridge',
    title: 'Community specialist',
    state: 'ready',
    turns: 0,
    summary: 'Matching donations with community capacity.',
  },
  {
    role: 'dispatch',
    name: 'Relay',
    title: 'Transport specialist',
    state: 'ready',
    turns: 0,
    summary: 'Finding a feasible route for every pickup.',
  },
];
export function createScenario(): DispatchState {
  return {
    revision: 0,
    minute: 0,
    cancellations: 0,
    conflictsPrevented: 0,
    donations: [
      {
        id: 'd1',
        name: 'Sunday Bread',
        food: 'Sourdough & pastries',
        category: 'Bakery',
        portions: 24,
        weight: 12,
        closesAt: 35,
        point: { x: 24, y: 24 },
        address: '1840 W North Ave',
        chilled: false,
      },
      {
        id: 'd2',
        name: 'Green Basket',
        food: 'Seasonal vegetables',
        category: 'Produce',
        portions: 40,
        weight: 24,
        closesAt: 75,
        point: { x: 62, y: 24 },
        address: '1560 N Milwaukee Ave',
        chilled: false,
      },
      {
        id: 'd3',
        name: 'The Common Table',
        food: 'Chilled prepared meals',
        category: 'Prepared',
        portions: 32,
        weight: 20,
        closesAt: 50,
        point: { x: 40, y: 53 },
        address: '1425 N Damen Ave',
        chilled: true,
      },
      {
        id: 'd4',
        name: 'Orchard Market',
        food: 'Fresh fruit boxes',
        category: 'Produce',
        portions: 28,
        weight: 18,
        closesAt: 95,
        point: { x: 79, y: 50 },
        address: '1200 N Ashland Ave',
        chilled: false,
      },
      {
        id: 'd5',
        name: 'Little Oven',
        food: 'Bread & breakfast rolls',
        category: 'Bakery',
        portions: 18,
        weight: 8,
        closesAt: 65,
        point: { x: 27, y: 77 },
        address: '1000 N Western Ave',
        chilled: false,
      },
    ],
    recipients: [
      {
        id: 'r1',
        name: 'Neighborhood Pantry',
        capacity: 65,
        accepts: ['Bakery', 'Produce'],
        point: { x: 49, y: 18 },
        address: '1800 N Wood St',
      },
      {
        id: 'r2',
        name: 'Community Kitchen',
        capacity: 65,
        accepts: ['Bakery', 'Produce', 'Prepared'],
        point: { x: 66, y: 70 },
        address: '1100 N Paulina St',
      },
      {
        id: 'r3',
        name: 'Westside Fridge',
        capacity: 45,
        accepts: ['Bakery', 'Produce', 'Prepared'],
        point: { x: 18, y: 55 },
        address: '1350 N Western Ave',
      },
    ],
    drivers: [
      {
        id: 'v1',
        name: 'Maya',
        initials: 'MA',
        capacity: 35,
        chilled: false,
        available: true,
        point: { x: 31, y: 17 },
        color: '#e59a36',
      },
      {
        id: 'v2',
        name: 'Theo',
        initials: 'TH',
        capacity: 45,
        chilled: true,
        available: true,
        point: { x: 56, y: 59 },
        color: '#5d75c7',
      },
      {
        id: 'v3',
        name: 'Sam',
        initials: 'SA',
        capacity: 30,
        chilled: true,
        available: true,
        point: { x: 18, y: 68 },
        color: '#159477',
      },
    ],
    assignments: [],
    findings: [],
    agents: structuredClone(AGENTS),
  };
}
export const travelMinutes = (a: Point, b: Point) =>
  Math.ceil(Math.hypot(a.x - b.x, a.y - b.y) * 0.31 + 3);
export function candidateAssignments(
  state: DispatchState,
  donationId?: string,
) {
  const candidates: {
    donationId: string;
    recipientId: string;
    driverId: string;
    minutes: number;
    score: number;
  }[] = [];
  for (const donation of state.donations) {
    if (
      (donationId && donationId !== donation.id) ||
      state.assignments.some((a) => a.donationId === donation.id)
    )
      continue;
    for (const driver of state.drivers) {
      if (!driver.available || (donation.chilled && !driver.chilled)) continue;
      const used = state.assignments.filter((a) => a.driverId === driver.id);
      const weight = used.reduce(
        (s, a) =>
          s + state.donations.find((d) => d.id === a.donationId)!.weight,
        0,
      );
      if (weight + donation.weight > driver.capacity) continue;
      const last = used.at(-1);
      const origin = last
        ? state.recipients.find((r) => r.id === last.recipientId)!.point
        : driver.point;
      const elapsed = used.reduce((s, a) => s + a.minutes, 0);
      if (
        state.minute + elapsed + travelMinutes(origin, donation.point) >
        donation.closesAt
      )
        continue;
      for (const recipient of state.recipients) {
        if (!recipient.accepts.includes(donation.category)) continue;
        const occupied = state.assignments
          .filter((a) => a.recipientId === recipient.id)
          .reduce(
            (s, a) =>
              s + state.donations.find((d) => d.id === a.donationId)!.portions,
            0,
          );
        if (occupied + donation.portions > recipient.capacity) continue;
        const minutes =
          travelMinutes(origin, donation.point) +
          travelMinutes(donation.point, recipient.point) +
          4;
        candidates.push({
          donationId: donation.id,
          recipientId: recipient.id,
          driverId: driver.id,
          minutes,
          score:
            donation.closesAt +
            minutes * 0.3 +
            (!donation.chilled && driver.chilled ? 5 : 0),
        });
      }
    }
  }
  return candidates.sort(
    (a, b) => a.score - b.score || a.driverId.localeCompare(b.driverId),
  );
}
export function reserve(
  state: DispatchState,
  input: {
    donationId: string;
    recipientId: string;
    driverId: string;
    expectedRevision: number;
    explanation: string;
  },
): { ok: boolean; reason: string; assignment?: Assignment } {
  if (input.expectedRevision !== state.revision) {
    state.conflictsPrevented++;
    return {
      ok: false,
      reason: `Board changed from revision ${input.expectedRevision} to ${state.revision}. Read the latest board and retry.`,
    };
  }
  const candidate = candidateAssignments(state, input.donationId).find(
    (c) => c.driverId === input.driverId && c.recipientId === input.recipientId,
  );
  if (!candidate) {
    state.conflictsPrevented++;
    return {
      ok: false,
      reason:
        'Pickup is no longer feasible. Check availability, duplicate donations, capacity, refrigeration, and pickup window.',
    };
  }
  state.revision++;
  const assignment: Assignment = {
    id: crypto.randomUUID(),
    donationId: input.donationId,
    recipientId: input.recipientId,
    driverId: input.driverId,
    minutes: candidate.minutes,
    revision: state.revision,
    explanation: input.explanation.slice(0, 600),
    status: 'reserved',
  };
  state.assignments.push(assignment);
  return {
    ok: true,
    reason: 'Pickup reserved against the current board.',
    assignment,
  };
}
export function applyCommand(state: DispatchState, command: Command): string {
  if (command.type === 'driver_unavailable') {
    const driver = state.drivers.find((d) => d.id === command.driverId);
    if (!driver || !driver.available) return 'Driver is already unavailable.';
    driver.available = false;
    const released = state.assignments.filter(
      (a) => a.driverId === driver.id,
    ).length;
    state.assignments = state.assignments.filter(
      (a) => a.driverId !== driver.id,
    );
    state.cancellations++;
    state.revision++;
    return `${driver.name} is unavailable. ${released} pickups released for reassignment.`;
  }
  if (command.type === 'add_donation') {
    if (state.donations.some((d) => d.id === 'd6'))
      return 'The extra donation is already on the board.';
    state.donations.push({
      id: 'd6',
      name: 'Corner Deli',
      food: 'Fresh lunch boxes',
      category: 'Prepared',
      portions: 16,
      weight: 10,
      closesAt: state.minute + 45,
      point: { x: 72, y: 39 },
      address: '1300 N Wood St',
      chilled: true,
    });
    state.revision++;
    return 'Corner Deli added 16 chilled lunch portions. Pickup window: 45 minutes.';
  }
  if (command.type === 'advance_time') {
    state.minute += Math.min(30, Math.max(1, command.minutes ?? 15));
    const previous = state.assignments;
    state.assignments = [];
    state.revision++;
    for (const a of previous)
      reserve(state, { ...a, expectedRevision: state.revision });
    return `Scenario clock advanced by ${command.minutes ?? 15} minutes. Pickup windows rechecked.`;
  }
  return 'Dispatch session finished.';
}
export function metrics(state: DispatchState) {
  const assigned = new Set(state.assignments.map((a) => a.donationId));
  return {
    portions: state.donations
      .filter((d) => assigned.has(d.id))
      .reduce((s, d) => s + d.portions, 0),
    totalPortions: state.donations.reduce((s, d) => s + d.portions, 0),
    pickups: assigned.size,
    weight: state.donations
      .filter((d) => assigned.has(d.id))
      .reduce((s, d) => s + d.weight, 0),
    unassigned: state.donations.length - assigned.size,
    routeMinutes: state.assignments.reduce((s, a) => s + a.minutes, 0),
  };
}
export function maxOverlap(spans: Span[]) {
  const points = spans
    .filter((s) => s.end)
    .flatMap((s) => [
      { at: s.start, delta: 1 },
      { at: s.end!, delta: -1 },
    ])
    .sort((a, b) => a.at - b.at || a.delta - b.delta);
  let active = 0,
    max = 0;
  for (const p of points) {
    active += p.delta;
    max = Math.max(max, active);
  }
  return max;
}
