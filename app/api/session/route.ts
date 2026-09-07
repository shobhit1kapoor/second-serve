import { environment } from '@/lib/server/store';
import { ownerFrom } from '@/lib/server/http';
export async function GET(request: Request) {
  const owner = ownerFrom(request) ?? crypto.randomUUID();
  const config = environment();
  return Response.json(
    {
      liveAvailable: Boolean(config.OPENAI_API_KEY),
      model: config.OPENAI_MODEL ?? 'gpt-4.1-mini',
    },
    {
      headers: {
        'Set-Cookie': `second_serve_session=${owner}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`,
        'Cache-Control': 'no-store',
      },
    },
  );
}
