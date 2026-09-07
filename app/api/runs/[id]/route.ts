import { readRun } from '@/lib/server/store';
import { apiError, json, ownerFrom } from '@/lib/server/http';
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const owner = ownerFrom(request);
  if (!owner) return apiError('Open the workspace first.', 401);
  const { id } = await context.params;
  const run = await readRun(id, owner);
  return run
    ? json(run)
    : apiError('This run is unavailable in your workspace.', 404);
}
