import { createHash } from 'node:crypto';

const recipient = 'dev.davifelipe@gmail.com';
const labels = { bug: 'Relato de bug', suggestion: 'Sugestão de melhoria', other: 'Feedback' };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function reply(status: number, code: string) {
  return Response.json({ ok: status === 200, code }, { status, headers: { 'Cache-Control': 'no-store' } });
}
function field(data: Record<string, unknown>, name: string, max: number): string | null {
  const value = data[name];
  return typeof value === 'string' && value.length <= max ? value.trim() : null;
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
    if (!request.headers.get('content-type')?.startsWith('application/json')) return reply(400, 'invalid_body');
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ') || authorization.length > 10000) return reply(401, 'unauthorized');
    if (Number(request.headers.get('content-length')) > 32000) return reply(413, 'too_large');
    let data: Record<string, unknown>;
    try {
      const raw = await request.text();
      if (Buffer.byteLength(raw, 'utf8') > 32000) return reply(413, 'too_large');
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return reply(400, 'invalid_body');
      data = parsed as Record<string, unknown>;
    } catch { return reply(400, 'invalid_body'); }
    const { kind, requestId } = data;
    if (typeof kind !== 'string' || !Object.hasOwn(labels, kind) || typeof requestId !== 'string' || !uuid.test(requestId)) return reply(400, 'invalid_body');
    const message = field(data, 'message', 3000);
    const steps = field(data, 'steps', 2000);
    const expected = field(data, 'expected', 1000);
    const device = field(data, 'device', 150);
    if (message === null || message.length < 20 || steps === null || expected === null || device === null || (kind === 'bug' && steps.length < 10)) return reply(400, 'invalid_body');

  
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.FEEDBACK_FROM_EMAIL;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!apiKey || !from || !supabaseUrl || !supabaseKey) return reply(503, 'not_configured');
    const authHeaders = { apikey: supabaseKey, Authorization: authorization };
    try {
   
      const auth = await fetch(new URL('/auth/v1/user', supabaseUrl), { headers: authHeaders, signal: AbortSignal.timeout(5000) });
      if (!auth.ok) return reply(auth.status >= 500 || auth.status === 429 ? 503 : 401, 'auth_unavailable');
      const user = await auth.json() as { id?: string; email?: string; email_confirmed_at?: string };
      if (!user.id || !user.email || !user.email_confirmed_at) return reply(403, 'email_not_confirmed');
      const text = [
        'Novo feedback do Poupaê',
        'Tipo: ' + labels[kind as keyof typeof labels],
        'Responder para: ' + user.email,
        '', 'Descrição:', message,
        ...(kind === 'bug' ? ['', 'Passos para reproduzir:', steps, '', 'Resultado esperado:', expected || 'Não informado'] : []),
        '', 'Dispositivo e navegador:', device || 'Não informado',
      ].join('\n');
      const email = { from, to: [recipient], reply_to: user.email, subject: '[Poupaê] ' + labels[kind as keyof typeof labels], text };
      const body = JSON.stringify(email);
      const reservation = await fetch(new URL('/rest/v1/rpc/reserve_feedback', supabaseUrl), {
        method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: requestId, payload_hash: createHash('sha256').update(body).digest('hex') }),
        signal: AbortSignal.timeout(5000),
      });
      if (!reservation.ok) {
        console.error('Feedback reservation failed:', reservation.status);
        return reply(503, 'reservation_unavailable');
      }
      const reserved: unknown = await reservation.json();
      if (reserved === 'rate_limited') return reply(429, 'rate_limited');
      if (reserved === 'conflict' || reserved === 'expired') return reply(409, 'invalid_retry');
      if (reserved !== 'allowed') return reply(503, 'reservation_unavailable');
      const sent = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json', 'Idempotency-Key': 'feedback/' + user.id + '/' + requestId },
        body, signal: AbortSignal.timeout(10000),
      });
      if (!sent.ok) {
        console.error('Feedback email provider failed:', sent.status);
        return reply(503, 'email_unavailable');
      }
      const receipt = await sent.json() as { id?: string };
      if (!receipt.id) return reply(503, 'email_unavailable');
      return reply(200, 'accepted');
    } catch {
      console.error('Feedback request could not be completed.');
      return reply(503, 'temporarily_unavailable');
    }
  },
};
