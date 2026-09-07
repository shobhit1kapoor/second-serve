import { env } from 'cloudflare:workers';
import type { Command, RunRecord } from '../domain';
type Environment = {
  DB: D1Database;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  OPENAI_BASE_URL?: string;
};
export function environment() {
  return env as unknown as Environment;
}
export function database() {
  const db = environment().DB;
  if (!db) throw new Error('Database binding is unavailable.');
  return db;
}
export async function saveRun(run: RunRecord, owner: string, initial = false) {
  const db = database();
  if (initial)
    await db
      .prepare(
        'INSERT INTO runs (id, owner, started_at, updated_at, status, mode, payload) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(
        run.id,
        owner,
        run.startedAt,
        Date.now(),
        run.status,
        run.mode,
        JSON.stringify(run),
      )
      .run();
  else
    await db
      .prepare(
        'UPDATE runs SET updated_at = ?, status = ?, payload = ? WHERE id = ? AND owner = ?',
      )
      .bind(Date.now(), run.status, JSON.stringify(run), run.id, owner)
      .run();
}
export async function readRun(
  id: string,
  owner: string,
): Promise<RunRecord | null> {
  const row = await database()
    .prepare('SELECT payload FROM runs WHERE id = ? AND owner = ?')
    .bind(id, owner)
    .first<{ payload: string }>();
  return row ? JSON.parse(row.payload) : null;
}
export async function listRuns(owner: string) {
  const result = await database()
    .prepare(
      'SELECT id, started_at, status, mode, payload FROM runs WHERE owner = ? ORDER BY started_at DESC LIMIT 20',
    )
    .bind(owner)
    .all<{
      id: string;
      started_at: number;
      status: string;
      mode: string;
      payload: string;
    }>();
  return result.results.map((r) => {
    const p = JSON.parse(r.payload) as RunRecord;
    return {
      id: r.id,
      startedAt: r.started_at,
      status: r.status,
      mode: r.mode,
      portions: p.state.assignments.reduce(
        (s, a) =>
          s +
          (p.state.donations.find((d) => d.id === a.donationId)?.portions ?? 0),
        0,
      ),
      events: p.events.length,
      model: p.model,
    };
  });
}
export async function pendingCommands(id: string): Promise<Command[]> {
  const result = await database()
    .prepare(
      'SELECT id, payload FROM commands WHERE run_id = ? AND handled = 0 ORDER BY created_at, id LIMIT 20',
    )
    .bind(id)
    .all<{ id: string; payload: string }>();
  if (result.results.length)
    await database().batch(
      result.results.map((r) =>
        database()
          .prepare('UPDATE commands SET handled = 1 WHERE id = ?')
          .bind(r.id),
      ),
    );
  return result.results.map((r) => JSON.parse(r.payload));
}
export async function queueCommand(runId: string, command: Command) {
  await database()
    .prepare(
      'INSERT OR IGNORE INTO commands (id, run_id, created_at, handled, payload) VALUES (?, ?, ?, 0, ?)',
    )
    .bind(command.id, runId, Date.now(), JSON.stringify(command))
    .run();
}
export async function canStart(owner: string) {
  const recent = Date.now() - 3600000;
  const row = await database()
    .prepare(
      'SELECT COUNT(*) AS count, SUM(CASE WHEN owner = ? THEN 1 ELSE 0 END) AS personal FROM runs WHERE started_at > ?',
    )
    .bind(owner, recent)
    .first<{ count: number; personal: number }>();
  return !row || (row.count < 60 && row.personal < 15);
}
