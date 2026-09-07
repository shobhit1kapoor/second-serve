import { environment } from '@/lib/server/store';
import { ownerFrom } from '@/lib/server/http';
import { providerConfig } from '@/lib/provider-config';
export async function GET(request: Request) {
  const owner = ownerFrom(request) ?? crypto.randomUUID();
  const config = providerConfig(environment());
  return Response.json(
    {
      liveAvailable: Boolean(config.apiKey),
      model: config.model,
    },
    {
      headers: {
        'Set-Cookie': `second_serve_session=${owner}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`,
        'Cache-Control': 'no-store',
      },
    },
  );
}
