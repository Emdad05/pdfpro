export const runtime = 'edge';

export async function GET() {
  try {
    const url = process.env.GOTENBERG_URL;
    if (!url) return Response.json({ ok: false, message: 'No server configured' }, { status: 200 });

    // Ping the health endpoint
    const res = await fetch(`${url}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
    });

    return Response.json({ ok: res.ok, status: res.status, timestamp: new Date().toISOString() });
  } catch {
    return Response.json({ ok: false, message: 'Server unreachable' }, { status: 200 });
  }
}
