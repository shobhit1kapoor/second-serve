'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowDownToLine,
  ArrowUpRight,
  Boxes,
  Clock3,
  HeartHandshake,
  LayoutDashboard,
  Leaf,
  MapPin,
  Network,
  Play,
  Plus,
  Route,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  Zap,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import NeighborhoodMap from './neighborhood-map';
import { metrics, type Mode } from '@/lib/domain';
import { useDispatch } from '@/hooks/use-dispatch';
import { readableText } from '@/lib/presentation';
import {
  ActivityPanel,
  DonationDetail,
  HistoryPanel,
  NetworkPanel,
} from './operations-panels';
function DeskMenuButton(props: React.ComponentProps<typeof SidebarMenuButton>) {
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <SidebarMenuButton
      {...props}
      onClick={(event) => {
        props.onClick?.(event);
        if (isMobile) setOpenMobile(false);
      }}
    />
  );
}
export default function DispatchDesk() {
  const desk = useDispatch();
  const { state, run, busy } = desk;
  const [selected, setSelected] = useState<string | null>('d1');
  const [detail, setDetail] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('desk');
  const totals = metrics(state);
  return (
    <SidebarProvider
      style={{ '--sidebar-width': '222px' } as React.CSSProperties}
    >
      <Sidebar className="app-sidebar">
        <SidebarHeader>
          <Link className="brand" href="/">
            <span className="brand-mark">
              <HeartHandshake size={24} />
            </span>
            <span>
              second serve
              <span className="brand-sub">Good food. Another chance.</span>
            </span>
          </Link>
          <div className="workspace-switch">
            <span className="workspace-icon">W</span>
            <span>
              Wicker Park<span>Community workspace</span>
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <p className="nav-heading">WORKSPACE</p>
          <SidebarMenu>
            {[
              { id: 'desk', name: 'Dispatch desk', icon: LayoutDashboard },
              { id: 'network', name: 'Our network', icon: Network },
              { id: 'activity', name: 'Agent activity', icon: Zap },
              { id: 'history', name: 'Run history', icon: Clock3 },
            ].map((n) => (
              <SidebarMenuItem key={n.id}>
                <DeskMenuButton
                  isActive={view === n.id}
                  onClick={() => setView(n.id)}
                  className="nav-link"
                >
                  <n.icon size={18} />
                  <span>{n.name}</span>
                  {n.id === 'desk' && (
                    <span className="nav-count">{totals.unassigned}</span>
                  )}
                </DeskMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <div className="sidebar-note">
            <div className="small-leaf">
              <Leaf size={19} />
            </div>
            <strong>
              A little coordination.
              <br />A lot less waste.
            </strong>
            <p>Every pickup starts with people looking out for each other.</p>
            <span>
              Built for the neighborhood <ArrowUpRight size={13} />
            </span>
          </div>
        </SidebarContent>
        <SidebarFooter>
          <div className="runtime-tag">
            <i className="live-dot" /> Powered by Mozaik
          </div>
          <div className="profile">
            <span>SK</span>
            <div>
              Shobhit Kapoor<small>Workspace coordinator</small>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <main className="main-shell">
        <header className="topbar">
          <div>
            <SidebarTrigger className="mobile-menu" />
            <span className="breadcrumb">
              Workspace <span>/</span>{' '}
              <strong>
                {
                  {
                    desk: 'Dispatch desk',
                    network: 'Our network',
                    activity: 'Agent activity',
                    history: 'Run history',
                  }[view]
                }
              </strong>
            </span>
          </div>
          <div className="topbar-right">
            <span className="scenario-badge">
              <i /> Demo neighborhood
            </span>
            <span className="topbar-divider" />
            <span className="avatar">SK</span>
          </div>
        </header>
        <div className="workspace-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <i className="live-dot" /> THE EVENING RESCUE
              </div>
              <h1>
                {
                  {
                    desk: 'Good food. Still in play.',
                    network: 'The people behind every pickup.',
                    activity: 'Every decision has a trail.',
                    history: 'Good work, worth keeping.',
                  }[view]
                }
              </h1>
              <p>
                {
                  {
                    desk: 'Bring the neighborhood together, one pickup at a time.',
                    network:
                      'See who can drive, what they can carry, and where food can go.',
                    activity:
                      'Follow the findings, timing, and checks behind the plan.',
                    history: 'Reopen a dispatch session and pick up its story.',
                  }[view]
                }
              </p>
            </div>
            <div className="heading-actions">
              <button
                className="button secondary"
                disabled={!run}
                onClick={desk.exportRun}
              >
                <ArrowDownToLine size={16} /> Export plan
              </button>
              <button
                className="button primary"
                disabled={!desk.ready}
                onClick={() =>
                  busy ? desk.command({ type: 'finish' }) : desk.start()
                }
              >
                <Play size={16} fill="currentColor" />{' '}
                {busy ? 'Finish & save' : 'Start dispatch'}
              </button>
            </div>
          </div>
          <div className="dispatch-toolbar">
            <span className="mode-caption">New session</span>
            <RadioGroup
              value={desk.mode}
              onValueChange={(value) => desk.setMode(value as Mode)}
              className="mode-options"
              disabled={busy}
              aria-label="Dispatch reasoning mode"
            >
              <label htmlFor="mode-rehearsal">
                <RadioGroupItem id="mode-rehearsal" value="rehearsal" />{' '}
                Rehearsal
              </label>
              <label
                htmlFor="mode-live"
                title={
                  desk.liveAvailable
                    ? 'Uses a real model provider'
                    : 'Configure a provider key to enable live reasoning'
                }
              >
                <RadioGroupItem
                  id="mode-live"
                  value="live"
                  disabled={!desk.liveAvailable}
                />{' '}
                Live agents
              </label>
            </RadioGroup>
            <span className="mode-explanation">
              {(run?.mode ?? desk.mode) === 'rehearsal'
                ? 'Deterministic simulation · no model calls'
                : 'Real model reasoning · simulated neighborhood'}
            </span>
            {run && (
              <span className={`run-status status-${run.status}`}>
                <i className="live-dot" />
                {run.status === 'error'
                  ? 'Needs attention'
                  : busy
                    ? run.endedAt
                      ? 'Finishing session'
                      : run.status === 'watching'
                        ? 'Watching for changes'
                        : 'Agents at work'
                    : 'Saved session'}
              </span>
            )}
          </div>
          {!busy && !run && view === 'desk' && (
            <div className="recording-invitation">
              <span>
                <strong>Watch a plan survive a last-minute change.</strong>{' '}
                Review a captured run with three real agents, a driver
                cancellation, and a rejected stale reservation.
              </span>
              <button
                className="text-button"
                onClick={async () => {
                  await desk.openRecordedRun();
                  setView('activity');
                }}
              >
                Review real-agent run <ArrowUpRight size={15} />
              </button>
            </div>
          )}
          {desk.error && (
            <div className="message-banner error-banner" role="alert">
              {desk.error}
              <button
                onClick={() => desk.setError('')}
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}
          {desk.notice && (
            <output className="message-banner">
              {desk.notice}
              <button
                onClick={() => desk.setNotice('')}
                aria-label="Dismiss notice"
              >
                ×
              </button>
            </output>
          )}
          {run?.error && (
            <div className="message-banner error-banner" role="alert">
              A model request failed: {run.error} Completed reservations are
              preserved.
            </div>
          )}
          {view === 'desk' && (
            <>
              <div className="metrics-grid">
                <Metric
                  icon={Boxes}
                  label="Portions available"
                  value={String(totals.totalPortions)}
                  detail={`Across ${state.donations.length} neighborhood donations`}
                />
                <Metric
                  icon={Route}
                  label="Pickups coordinated"
                  value={`${totals.pickups} / ${state.donations.length}`}
                  detail={`${totals.portions} portions assigned for pickup`}
                />
                <Metric
                  icon={Truck}
                  label="Volunteer drivers"
                  value={String(
                    state.drivers.filter((d) => d.available).length,
                  )}
                  detail={`${state.drivers.filter((d) => d.available && d.chilled).length} with chilled transport`}
                />
                <Metric
                  icon={HeartHandshake}
                  label="Community capacity"
                  value={String(
                    state.recipients.reduce((s, r) => s + r.capacity, 0) -
                      totals.portions,
                  )}
                  detail="Remaining portions partners can accept"
                />
              </div>
              <div className="main-grid">
                <section className="map-panel panel">
                  <div className="panel-heading">
                    <div>
                      <MapPin size={18} />
                      <h2>The neighborhood</h2>
                      <span className="count-chip">
                        {state.donations.length + state.recipients.length}{' '}
                        locations
                      </span>
                    </div>
                    <span className="quiet-label">
                      <Clock3 size={14} /> {5 + Math.floor(state.minute / 60)}:
                      {String(state.minute % 60).padStart(2, '0')} PM · Scenario
                      time
                    </span>
                  </div>
                  <NeighborhoodMap
                    state={state}
                    selected={selected}
                    onSelect={(id) => {
                      setSelected(id);
                      setDetail(id);
                    }}
                  />
                  <div className="map-footer">
                    <span>
                      <ShieldCheck size={16} /> Every route checked for capacity
                      & pickup windows
                    </span>
                    <span>
                      Shared board <strong>v{state.revision}</strong>
                    </span>
                  </div>
                </section>
                <aside className="agent-panel panel">
                  <div className="panel-heading">
                    <div>
                      <Sparkles size={17} />
                      <h2>Your dispatch team</h2>
                    </div>
                    <span className="count-chip">3 agents</span>
                  </div>
                  <p className="agent-intro">
                    Different perspectives. One shared plan.
                  </p>
                  <div className="agent-stack">
                    {state.agents.map((a, i) => (
                      <div
                        className={`agent-card agent-${a.role}`}
                        key={a.role}
                      >
                        <div className="agent-top">
                          <span className="agent-avatar">
                            {i === 0 ? (
                              <Leaf size={20} />
                            ) : i === 1 ? (
                              <Users size={20} />
                            ) : (
                              <Route size={20} />
                            )}
                          </span>
                          <div>
                            <strong>{a.name}</strong>
                            <span>{a.title}</span>
                          </div>
                          <span
                            className={`agent-state agent-state-${a.state}`}
                          >
                            {!busy && run && a.state !== 'error'
                              ? 'Finished'
                              : a.state}
                          </span>
                        </div>
                        <p>{readableText(a.summary, state)}</p>
                        <div className="agent-bottom">
                          <span>
                            <i />{' '}
                            {!busy && run
                              ? 'Saved assessment'
                              : a.state === 'thinking'
                                ? 'Working on the shared board'
                                : a.state === 'watching'
                                  ? 'Listening for updates'
                                  : a.state === 'error'
                                    ? 'Needs attention'
                                    : 'Waiting for dispatch'}
                          </span>
                          <span>{a.turns} turns</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="team-note">
                    <Network size={17} />
                    <p>
                      Agents work at the same time and share discoveries as they
                      happen.
                    </p>
                  </div>
                </aside>
              </div>
              <section className="donation-panel panel">
                <div className="panel-heading">
                  <div>
                    <h2>On the rescue board</h2>
                    <span className="count-chip">
                      {state.donations.length} donations
                    </span>
                  </div>
                  <Tabs
                    value={filter}
                    onValueChange={(value) => setFilter(String(value))}
                  >
                    <TabsList className="board-tabs">
                      <TabsTrigger value="all">All donations</TabsTrigger>
                      <TabsTrigger value="pending">Needs a pickup</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <button
                    className="text-button"
                    disabled={
                      !busy || state.donations.some((d) => d.id === 'd6')
                    }
                    onClick={() => desk.command({ type: 'add_donation' })}
                  >
                    <Plus size={15} /> Add late donation
                  </button>
                </div>
                <div className="donation-grid">
                  {state.donations
                    .filter(
                      (d) =>
                        filter === 'all' ||
                        !state.assignments.some((a) => a.donationId === d.id),
                    )
                    .map((d) => (
                      <button
                        className={`donation-card ${selected === d.id ? 'is-selected' : ''}`}
                        key={d.id}
                        onClick={() => {
                          setSelected(d.id);
                          setDetail(d.id);
                        }}
                      >
                        <div className="donation-card-top">
                          <span
                            className={`food-icon food-${d.category.toLowerCase()}`}
                          >
                            {d.category === 'Bakery' ? (
                              <Boxes size={20} />
                            ) : d.category === 'Produce' ? (
                              <Leaf size={20} />
                            ) : (
                              <HeartHandshake size={20} />
                            )}
                          </span>
                          <span
                            className={
                              d.closesAt <= 35
                                ? 'window-tag urgent'
                                : 'window-tag'
                            }
                          >
                            <Clock3 size={12} />
                            {Math.max(0, d.closesAt - state.minute)} min left
                          </span>
                        </div>
                        <span className="donor-name">{d.name}</span>
                        <span className="food-name">{d.food}</span>
                        <div className="portion-line">
                          <strong>{d.portions}</strong> portions <span>·</span>{' '}
                          {d.weight} kg
                        </div>
                        <div className="donation-status">
                          <i />
                          {state.assignments.some((a) => a.donationId === d.id)
                            ? 'Pickup reserved'
                            : 'Needs a pickup'}{' '}
                          <ArrowUpRight size={15} />
                        </div>
                      </button>
                    ))}
                  {filter === 'pending' && totals.unassigned === 0 && (
                    <p className="board-empty">
                      Every donation has a pickup. Good work, neighborhood.
                    </p>
                  )}
                </div>
              </section>
              <div className="scenario-controls">
                <span>
                  <Zap size={16} /> Change the situation
                </span>
                {state.drivers.map((d) => (
                  <button
                    key={d.id}
                    className="button secondary"
                    disabled={!busy || !d.available}
                    onClick={() =>
                      desk.command({
                        type: 'driver_unavailable',
                        driverId: d.id,
                      })
                    }
                  >
                    {d.available
                      ? `${d.name} cancels`
                      : `${d.name} unavailable`}
                  </button>
                ))}
                <button
                  className="button secondary"
                  disabled={!busy}
                  onClick={() =>
                    desk.command({ type: 'advance_time', minutes: 15 })
                  }
                >
                  <Clock3 size={14} /> +15 min
                </button>
                <button
                  className="text-button"
                  onClick={() => setView('activity')}
                >
                  See decision trail <ArrowUpRight size={14} />
                </button>
              </div>
              {state.assignments.length > 0 && (
                <section className="panel plan-panel">
                  <div className="panel-heading">
                    <div>
                      <Route size={18} />
                      <h2>The pickup plan</h2>
                    </div>
                    <span className="count-chip">
                      {totals.weight} kg assigned
                    </span>
                  </div>
                  <div className="pickup-list">
                    {state.assignments.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setDetail(a.donationId)}
                      >
                        <span className="pickup-check">
                          <ShieldCheck size={18} />
                        </span>
                        <div>
                          <strong>
                            {
                              state.donations.find((d) => d.id === a.donationId)
                                ?.name
                            }{' '}
                            <ArrowUpRight size={13} />{' '}
                            {
                              state.recipients.find(
                                (r) => r.id === a.recipientId,
                              )?.name
                            }
                          </strong>
                          <span>
                            {
                              state.drivers.find((d) => d.id === a.driverId)
                                ?.name
                            }{' '}
                            · {a.minutes} estimated route min ·{' '}
                            {
                              state.donations.find((d) => d.id === a.donationId)
                                ?.portions
                            }{' '}
                            portions
                          </span>
                        </div>
                        <span className="reserved-badge">Reserved</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
          {view === 'network' && (
            <NetworkPanel state={state} busy={busy} command={desk.command} />
          )}
          {view === 'activity' && <ActivityPanel run={run} />}
          {view === 'history' && (
            <HistoryPanel
              history={desk.history}
              busy={busy}
              onRefresh={desk.refreshHistory}
              onOpen={async (id) => {
                await desk.openRun(id);
                setView('activity');
              }}
            />
          )}
          <footer className="page-footer">
            <span>
              <Leaf size={14} /> A second chance for good food.
            </span>
            <span>
              Simulated locations and inventory · Plans require coordinator
              review.
            </span>
          </footer>
        </div>
      </main>
      <DonationDetail
        state={state}
        id={detail}
        onClose={() => setDetail(null)}
      />
    </SidebarProvider>
  );
}
function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Boxes;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="metric-card">
      <div className="metric-label">
        <span>{label}</span>
        <Icon size={18} />
      </div>
      <strong className="metric-value">{value}</strong>
      <span className="metric-detail">{detail}</span>
    </div>
  );
}
