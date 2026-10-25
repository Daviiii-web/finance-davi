import { supabase } from '../lib/supabase';

export type FeedbackKind = 'bug' | 'suggestion' | 'other';
export type FeedbackDraft = { kind: FeedbackKind; message: string; steps: string; expected: string; device: string };

export async function sendFeedback(feedback: FeedbackDraft & { requestId: string }): Promise<void> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error('Entre novamente na sua conta para enviar o feedback.');
  let response: Response;
  try {
    response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + data.session.access_token },
      body: JSON.stringify(feedback),
      signal: AbortSignal.timeout(25000),
    });
  } catch {
    throw new Error('Não foi possível confirmar o envio. Confira sua conexão e tente novamente; seu texto foi mantido.');
  }
  const result = await response.json().catch(() => null) as { ok?: boolean } | null;
  if (response.ok && result?.ok === true) return;
  const messages: Record<number, string> = {
    400: 'Confira a descrição e os passos informados antes de enviar.',
    401: 'Sua sessão expirou. Entre novamente para enviar o feedback.',
    403: 'Confirme o e-mail da sua conta antes de enviar o feedback.',
    409: 'Não foi possível repetir esse envio. Copie seu texto e recarregue a página antes de preparar uma nova mensagem.',
    413: 'A mensagem ficou muito grande. Resuma os detalhes e tente novamente.',
    429: 'Você já enviou vários relatos. Aguarde uma hora antes de enviar uma nova mensagem.',
    503: 'O envio de feedback está temporariamente indisponível. Seu texto foi mantido; tente novamente mais tarde.',
  };
  throw new Error(messages[response.status] || 'Não foi possível confirmar o envio. Seu texto foi mantido; tente novamente.');
}
