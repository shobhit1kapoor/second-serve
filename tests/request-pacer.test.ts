import { afterEach, expect, it, vi } from 'vitest';
import { RequestPacer } from '../lib/request-pacer';
afterEach(() => vi.useRealTimers());
it('allows concurrent admission and waits until the rolling budget reopens', async () => {
  vi.useFakeTimers();
  const pacer = new RequestPacer(3, 1000);
  expect(
    await Promise.all([
      pacer.acquire(() => false),
      pacer.acquire(() => false),
      pacer.acquire(() => false),
    ]),
  ).toEqual([true, true, true]);
  let admitted = false;
  const next = pacer
    .acquire(() => false)
    .then((ok) => {
      admitted = ok;
    });
  await vi.advanceTimersByTimeAsync(999);
  expect(admitted).toBe(false);
  await vi.advanceTimersByTimeAsync(1);
  await next;
  expect(admitted).toBe(true);
});
it('stops a waiting turn without making another provider request', async () => {
  vi.useFakeTimers();
  const pacer = new RequestPacer(1, 1000);
  await pacer.acquire(() => false);
  let stopped = false;
  const next = pacer.acquire(() => stopped);
  stopped = true;
  await vi.advanceTimersByTimeAsync(200);
  expect(await next).toBe(false);
});
