'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createScenario,
  type Command,
  type Mode,
  type RunRecord,
} from '@/lib/domain';
export type RunSummary = {
  id: string;
  startedAt: number;
  status: string;
  mode: Mode;
  portions: number;
  events: number;
  model: string;
};
// oxlint-disable-next-line react/react-compiler -- Compiler internal error ("Expected a variable declaration") on the async stream parser; hook rules and TypeScript remain checked.
export function useDispatch() {
  const [run, setRun] = useState<RunRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [ready, setReady] = useState(false);
  const [liveAvailable, setLiveAvailable] = useState(false);
  const [mode, setMode] = useState<Mode>('rehearsal');
  const [history, setHistory] = useState<RunSummary[]>([]);
  const [initial] = useState(createScenario);
  const abort = useRef<AbortController | null>(null);
  const refreshHistory = useCallback(async () => {
    try {
      const r = await fetch('/api/runs');
      if (r.ok) setHistory(((await r.json()) as { runs: RunSummary[] }).runs);
    } catch {
      /* Visible error is reserved for actions; history can be refreshed. */
    }
  }, []);
  useEffect(() => {
    let mounted = true;
    void fetch('/api/session')
      .then(async (r) => {
        if (!r.ok)
          throw new Error('Workspace could not connect. Reload to try again.');
        const data = (await r.json()) as { liveAvailable: boolean };
        if (mounted) {
          setLiveAvailable(data.liveAvailable);
          setMode(data.liveAvailable ? 'live' : 'rehearsal');
          setReady(true);
          void refreshHistory();
        }
      })
      .catch((e) => setError(e.message));
    return () => {
      mounted = false;
      abort.current?.abort();
    };
  }, [refreshHistory]);
  async function start() {
    if (busy || !ready) return;
    setBusy(true);
    setError('');
    setNotice('');
    setRun(null);
    const controller = new AbortController();
    abort.current = controller;
    try {
      const response = await fetch('/api/runs/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
        signal: controller.signal,
      });
      if (!response.ok)
        throw new Error(
          ((await response.json()) as { error: string }).error ??
            'Unable to start dispatch.',
        );
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Live connection unavailable.');
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        while (buffer.includes('\n')) {
          const index = buffer.indexOf('\n');
          const line = buffer.slice(0, index);
          buffer = buffer.slice(index + 1);
          if (!line || line.startsWith(':')) continue;
          const event = JSON.parse(
            line.startsWith('data: ') ? line.slice(6) : line,
          );
          if (event.type === 'snapshot') setRun(event.run);
        }
      }
      setNotice(
        'Session saved. You can review the plan or start a new dispatch.',
      );
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError'))
        setError(
          e instanceof Error
            ? e.message
            : 'The connection was interrupted. Your last saved run is in history.',
        );
    } finally {
      setBusy(false);
      abort.current = null;
      void refreshHistory();
    }
  }
  async function command(input: Omit<Command, 'id'>) {
    if (!run || !busy) {
      setNotice('Start a dispatch session to change the scenario.');
      return;
    }
    setError('');
    try {
      const r = await fetch(`/api/runs/${run.id}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, id: crypto.randomUUID() }),
      });
      if (!r.ok) throw new Error(((await r.json()) as { error: string }).error);
      setNotice(
        input.type === 'finish'
          ? 'Finishing in-flight work and saving the session…'
          : 'Change sent to the dispatch team.',
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'The change could not be sent.',
      );
    }
  }
  async function openRun(id: string) {
    if (busy) {
      setNotice('Finish the active session before opening a saved run.');
      return;
    }
    try {
      const r = await fetch(`/api/runs/${id}`);
      if (!r.ok) throw new Error('Saved run could not be opened.');
      setRun(await r.json());
      setNotice(
        'Viewing a saved session. Start dispatch to work with a fresh scenario.',
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function openRecordedRun() {
    if (busy) return;
    try {
      const response = await fetch('/evidence/live-local-codex-run.json');
      if (!response.ok)
        throw new Error('The recorded run could not be opened.');
      setRun(await response.json());
      setNotice(
        'Recorded real-agent run · September 6, 2026 · local Codex provider. These are captured results, not a new live session.',
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Recording unavailable.',
      );
    }
  }
  function exportRun() {
    if (!run) return;
    const file = new Blob([JSON.stringify(run, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = `second-serve-${run.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return {
    run,
    state: run?.state ?? initial,
    busy,
    error,
    notice,
    ready,
    liveAvailable,
    mode,
    setMode,
    start,
    command,
    history,
    refreshHistory,
    openRun,
    openRecordedRun,
    exportRun,
    setError,
    setNotice,
  };
}
