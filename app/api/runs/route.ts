import { listRuns } from '@/lib/server/store';
import { apiError, json, ownerFrom } from '@/lib/server/http';
export async function GET(request: Request) {
  const owner = ownerFrom(request);
  if (!owner) return apiError('Open the workspace first.', 401);
  try {
    return json({ runs: await listRuns(owner) });
  } catch {
    return apiError('Run history is temporarily unavailable.', 503);
  }
}
