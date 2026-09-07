export function ownerFrom(request: Request): string | null {
  const value = request.headers
    .get('cookie')
    ?.match(/(?:^|;\s*)second_serve_session=([a-f0-9-]{36})(?:;|$)/)?.[1];
  return value ?? null;
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
export function apiError(message: string, status = 400) {
  return json({ error: message }, status);
}
