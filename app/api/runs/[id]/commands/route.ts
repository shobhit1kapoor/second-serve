import { queueCommand, readRun } from '@/lib/server/store';
import { apiError, checkOrigin, json, ownerFrom } from '@/lib/server/http';
import type { Command } from '@/lib/domain';
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const owner = ownerFrom(request);
  if (!owner || !checkOrigin(request))
    return apiError('Request not authorized.', 403);
  const { id } = await context.params;
  const run = await readRun(id, owner);
  if (!run) return apiError('Run not found.', 404);
  if (
    !['running', 'watching'].includes(run.status) ||
    Date.now() - run.startedAt > 300000
  )
    return apiError('This session has finished. Start a new dispatch.', 409);
  let command: Command;
  try {
    command = await request.json();
  } catch {
    return apiError('Invalid command.');
  }
  if (
    !command ||
    !['driver_unavailable', 'add_donation', 'advance_time', 'finish'].includes(
      command.type,
    )
  )
    return apiError('Unknown command.');
  if (
    command.type === 'driver_unavailable' &&
    !run.state.drivers.some((d) => d.id === command.driverId)
  )
    return apiError('Unknown driver.');
  if (
    command.type === 'advance_time' &&
    command.minutes !== undefined &&
    (!Number.isInteger(command.minutes) ||
      command.minutes < 1 ||
      command.minutes > 30)
  )
    return apiError('Advance by 1–30 minutes.');
  command.id =
    typeof command.id === 'string' && /^[a-f0-9-]{36}$/.test(command.id)
      ? command.id
      : crypto.randomUUID();
  await queueCommand(id, command);
  return json({ accepted: true, commandId: command.id });
}
