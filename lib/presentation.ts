import type { DispatchState } from './domain';

/** Keep the raw export intact while presenting domain names in the interface. */
export function readableText(text: string, state: DispatchState): string {
  let display = text;
  const prefix = text.startsWith('Peer finding: ')
    ? 'Peer finding: '
    : text.startsWith('Coordinator update: ')
      ? 'Coordinator update: '
      : null;
  if (prefix) {
    try {
      const update = JSON.parse(text.slice(prefix.length)) as {
        title?: string;
        detail?: string;
      };
      display =
        [update.title, update.detail].filter(Boolean).join('. ') || text;
    } catch {
      /* Older plain-text events are already readable. */
    }
  }
  const names = new Map(
    [...state.donations, ...state.recipients, ...state.drivers].map((item) => [
      item.id,
      item.name,
    ]),
  );
  return display.replace(/\b[drv]\d+\b/g, (id) => names.get(id) ?? id);
}
