'use client';
import {
  ArrowRight,
  Clock3,
  Leaf,
  Snowflake,
  Truck,
  Users,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  maxOverlap,
  type Command,
  type DispatchState,
  type RunRecord,
} from '@/lib/domain';
import type { RunSummary } from '@/hooks/use-dispatch';
import { readableText } from '@/lib/presentation';
export function NetworkPanel({
  state,
  busy,
  command,
}: {
  state: DispatchState;
  busy: boolean;
  command: (c: Omit<Command, 'id'>) => void;
}) {
  return (
    <section className="network-grid">
      <div className="panel network-section">
        <div className="panel-heading">
          <div>
            <Truck size={18} />
            <h2>Volunteer drivers</h2>
          </div>
          <span className="count-chip">
            {state.drivers.filter((d) => d.available).length} available
          </span>
        </div>
        <p className="section-description">
          Capacity is reserved across each driver’s planned pickups.
        </p>
        {state.drivers.map((driver) => {
          const assigned = state.assignments.filter(
            (a) => a.driverId === driver.id,
          );
          const weight = assigned.reduce(
            (s, a) =>
              s + state.donations.find((d) => d.id === a.donationId)!.weight,
            0,
          );
          return (
            <div className="network-row" key={driver.id}>
              <span
                className="driver-avatar"
                style={{ background: driver.color }}
              >
                {driver.initials}
              </span>
              <div className="network-person">
                <strong>{driver.name}</strong>
                <span>
                  {driver.chilled ? (
                    <>
                      <Snowflake size={12} /> Chilled transport
                    </>
                  ) : (
                    'Standard transport'
                  )}{' '}
                  · {weight}/{driver.capacity} kg reserved
                </span>
              </div>
              <button
                className={`button ${driver.available ? 'secondary' : 'unavailable'}`}
                disabled={!busy || !driver.available}
                onClick={() =>
                  command({ type: 'driver_unavailable', driverId: driver.id })
                }
              >
                {driver.available ? 'Make unavailable' : 'Unavailable'}
              </button>
            </div>
          );
        })}
        <div className="network-explainer">
          <strong>See the team adapt</strong>
          <p>
            Make a driver unavailable during a session. Their reservations will
            be released, and the agents will reconsider the affected pickups.
          </p>
        </div>
      </div>
      <div className="panel network-section">
        <div className="panel-heading">
          <div>
            <Users size={18} />
            <h2>Community partners</h2>
          </div>
        </div>
        {state.recipients.map((r) => {
          const used = state.assignments
            .filter((a) => a.recipientId === r.id)
            .reduce(
              (s, a) =>
                s +
                state.donations.find((d) => d.id === a.donationId)!.portions,
              0,
            );
          return (
            <div className="recipient-row" key={r.id}>
              <div>
                <strong>{r.name}</strong>
                <span>
                  {used} / {r.capacity} portions
                </span>
              </div>
              <progress
                value={used}
                max={r.capacity}
                aria-label={`${r.name} reserved capacity`}
              />
              <p>{r.accepts.join(' · ')}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
export function ActivityPanel({ run }: { run: RunRecord | null }) {
  if (!run)
    return (
      <div className="panel empty-state">
        <Clock3 size={30} />
        <h2>The next good decision starts here.</h2>
        <p>
          Start dispatch to see agent reasoning, shared findings, and
          reservation decisions.
        </p>
      </div>
    );
  const now = run.events.at(-1)?.at ?? run.startedAt;
  const duration = Math.max(1000, (run.endedAt ?? now) - run.startedAt);
  const overlap = maxOverlap(run.spans);
  return (
    <section className="activity-layout">
      <div className="panel timeline-panel">
        <div className="panel-heading">
          <div>
            <Clock3 size={18} />
            <h2>Agents working together</h2>
          </div>
          <span className="mode-label">
            {run.mode === 'live'
              ? run.endedAt
                ? 'Recorded model calls'
                : 'Live model calls'
              : 'Simulated inference'}
          </span>
        </div>
        <div className="proof-metrics">
          <div>
            <strong>{overlap}</strong>
            <span>Peak overlapping calls</span>
          </div>
          <div>
            <strong>{run.calls}</strong>
            <span>
              {run.mode === 'live' ? 'Model requests' : 'Rehearsal requests'}
            </span>
          </div>
          <div>
            <strong>{run.state.conflictsPrevented}</strong>
            <span>Invalid reservations blocked</span>
          </div>
        </div>
        <div className="timeline" aria-label="Agent inference intervals">
          {run.state.agents.map((a) => (
            <div className="timeline-lane" key={a.role}>
              <span>{a.name}</span>
              <div>
                {run.spans
                  .filter((s) => s.role === a.role)
                  .map((s) => (
                    <span
                      key={s.id}
                      className={`time-span span-${a.role} ${s.outcome === 'error' ? 'span-error' : ''}`}
                      style={{
                        left: `${((s.start - run.startedAt) / duration) * 100}%`,
                        width: `${Math.max(0.4, (((s.end ?? now) - s.start) / duration) * 100)}%`,
                      }}
                      title={`${a.name}: ${s.end ? ((s.end - s.start) / 1000).toFixed(2) : 'in progress'} seconds`}
                    />
                  ))}
              </div>
            </div>
          ))}
          <div className="timeline-scale">
            <span>0 s</span>
            <span>{(duration / 1000).toFixed(1)} s</span>
          </div>
        </div>
        <p className="proof-caption">
          {run.mode === 'live'
            ? 'Intervals use actual request start and completion timestamps. Overlap measures simultaneous inference, not successful real-world deliveries.'
            : 'This run uses deterministic simulated inference and deliberately added latency. It demonstrates the app and coordination logic, not LLM performance.'}
        </p>
      </div>
      <div className="panel event-panel">
        <div className="panel-heading">
          <div>
            <h2>The decision trail</h2>
            <span className="count-chip">{run.events.length} events</span>
          </div>
        </div>
        <ol className="event-list">
          {[...run.events].reverse().map((event) => (
            <li key={event.id}>
              <span className={`event-dot event-${event.actor}`} />
              <div>
                <div className="event-title">
                  <strong>{event.title}</strong>
                  <time>{((event.at - run.startedAt) / 1000).toFixed(1)}s</time>
                </div>
                {event.detail && <p>{readableText(event.detail, run.state)}</p>}
                <span className="event-meta">
                  {event.actor} · board v{event.revision} · #{event.sequence}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
export function HistoryPanel({
  history,
  onOpen,
  onRefresh,
  busy,
}: {
  history: RunSummary[];
  onOpen: (id: string) => void;
  onRefresh: () => void;
  busy: boolean;
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <Clock3 size={18} />
          <h2>Saved dispatch sessions</h2>
        </div>
        <button className="text-button" onClick={onRefresh}>
          Refresh
        </button>
      </div>
      {!history.length ? (
        <div className="empty-state">
          <Leaf size={30} />
          <h2>Your first rescue story is still ahead.</h2>
          <p>
            Dispatch sessions are saved here with their plan and decision trail.
          </p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((run) => (
            <button
              key={run.id}
              className="history-row"
              disabled={busy}
              onClick={() => onOpen(run.id)}
            >
              <span className="history-icon">
                <Clock3 size={20} />
              </span>
              <div>
                <strong>
                  Evening rescue ·{' '}
                  {new Date(run.startedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </strong>
                <span>
                  {new Date(run.startedAt).toLocaleTimeString(undefined, {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}{' '}
                  · {run.mode === 'live' ? 'Live model run' : 'Rehearsal'} ·{' '}
                  {run.status}
                </span>
              </div>
              <div>
                <strong>{run.portions} portions</strong>
                <span>{run.events} recorded events</span>
              </div>
              <ArrowRight size={18} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
export function DonationDetail({
  state,
  id,
  onClose,
}: {
  state: DispatchState;
  id: string | null;
  onClose: () => void;
}) {
  const donation = state.donations.find((d) => d.id === id);
  const assignment = state.assignments.find((a) => a.donationId === id);
  return (
    <Sheet
      open={Boolean(donation)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="detail-sheet">
        <SheetHeader>
          <SheetTitle>{donation?.name}</SheetTitle>
          <SheetDescription>{donation?.food}</SheetDescription>
        </SheetHeader>
        {donation && (
          <div className="detail-content">
            <span className="detail-category">
              {donation.category}{' '}
              {donation.chilled && '· Chilled transport required'}
            </span>
            <div className="detail-stats">
              <div>
                <strong>{donation.portions}</strong>
                <span>portions available</span>
              </div>
              <div>
                <strong>{Math.max(0, donation.closesAt - state.minute)}</strong>
                <span>minutes to pickup</span>
              </div>
            </div>
            <p className="detail-address">
              {donation.address}
              <br />
              <small>Simulated donor at an illustrative location.</small>
            </p>
            <h3>
              {assignment
                ? 'A pickup is reserved'
                : 'Waiting for a feasible pickup'}
            </h3>
            {assignment ? (
              <div className="assignment-detail">
                <strong>
                  {
                    state.drivers.find((d) => d.id === assignment.driverId)
                      ?.name
                  }{' '}
                  <ArrowRight size={16} />{' '}
                  {
                    state.recipients.find(
                      (r) => r.id === assignment.recipientId,
                    )?.name
                  }
                </strong>
                <p>{readableText(assignment.explanation, state)}</p>
                <span>
                  {assignment.minutes} estimated route minutes · Reserved at v
                  {assignment.revision}
                </span>
              </div>
            ) : (
              <p className="muted-copy">
                The dispatch team will check driver capacity, community needs,
                and the pickup window before making a reservation.
              </p>
            )}
            <h3>Finding history</h3>
            <p className="muted-copy">
              Newest first. Earlier findings may have been superseded as the
              board changed.
            </p>
            {state.findings
              .filter((f) => f.donationIds.includes(donation.id))
              .toReversed()
              .map((f) => (
                <div className="finding-card" key={f.id}>
                  <strong>{f.title}</strong>
                  <p>{readableText(f.detail, state)}</p>
                  <span>
                    {f.role} · Board v{f.revision}
                  </span>
                </div>
              ))}
            {!state.findings.some((f) =>
              f.donationIds.includes(donation.id),
            ) && (
              <p className="muted-copy">
                Shared findings will appear when the team starts investigating.
              </p>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
