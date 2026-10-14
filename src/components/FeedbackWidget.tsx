import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import Icon from './Icon';
import { sendFeedback } from '../services/feedbackService';
import type { FeedbackDraft, FeedbackKind } from '../services/feedbackService';

const initialDraft: FeedbackDraft = { kind: 'bug', message: '', steps: '', expected: '', device: '' };

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(initialDraft);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const busy = useRef(false);
  const attempt = useRef<{ id: string; content: string } | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open) { dialog?.close(); return; }
    dialog?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  function close() {
    if (busy.current) return;
    setOpen(false);
  }

  function update(field: keyof FeedbackDraft, value: string) {
    setDraft(previous => ({ ...previous, [field]: value }));
    setError('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    setError('');
    if (draft.message.trim().length < 20) {
      setError('Conte um pouco mais: escreva pelo menos 20 caracteres na descrição.');
      return;
    }
    if (draft.kind === 'bug' && draft.steps.trim().length < 10) {
      setError('Descreva os passos até o problema, com pelo menos 10 caracteres.');
      return;
    }
    if (!navigator.onLine) {
      setError('Conecte-se à internet para enviar. Seu texto continua neste formulário.');
      return;
    }
    const payload = { ...draft, steps: draft.kind === 'bug' ? draft.steps : '', expected: draft.kind === 'bug' ? draft.expected : '' };
    const content = JSON.stringify(payload);
    if (attempt.current?.content !== content) attempt.current = { id: crypto.randomUUID(), content };
    busy.current = true;
    setSending(true);
    try {
      await sendFeedback({ ...payload, requestId: attempt.current.id });
      setSent(true);
      setDraft(initialDraft);
      attempt.current = null;
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Não foi possível enviar. Tente novamente.');
    } finally {
      busy.current = false;
      setSending(false);
    }
  }

  return <>
    <button type="button" className="feedback-trigger" aria-haspopup="dialog" aria-controls="feedback-dialog"
      onClick={() => { setSent(false); setOpen(true); }}>
      <Icon name="message" size={20} /><span>Feedback</span>
    </button>
    <dialog id="feedback-dialog" ref={dialogRef} className="transaction-dialog feedback-dialog"
      aria-labelledby="feedback-title" aria-describedby="feedback-description"
      onCancel={event => { event.preventDefault(); close(); }}>
      <div className="dialog-content">
        <div className="dialog-heading">
          <div><p className="eyebrow">VAMOS MELHORAR O POUPAÊ</p><h2 id="feedback-title">Sua opinião conta</h2></div>
          <button type="button" className="icon-button" aria-label="Fechar feedback" disabled={sending} onClick={close}><Icon name="close" /></button>
        </div>
        <p id="feedback-description" className="feedback-description">Encontrou um bug? Conte o que aconteceu e os passos que fez até chegar ao problema. Sugestões e críticas construtivas também são bem-vindas: explique o que podemos melhorar no seu dia a dia.</p>
        {sent ? <div className="feedback-success" role="status">
          <Icon name="check" size={32} /><h3>Obrigado por ajudar!</h3>
          <p>Sua mensagem foi encaminhada para o e-mail do Davi.</p>
          <button type="button" className="button primary" onClick={close}>Concluir</button>
        </div> : <form onSubmit={submit} aria-busy={sending}>
          <label className="form-label" htmlFor="feedback-kind">O que você quer compartilhar?</label>
          <select id="feedback-kind" className="form-input" value={draft.kind} disabled={sending}
            onChange={event => update('kind', event.target.value as FeedbackKind)}>
            <option value="bug">Relatar um bug</option><option value="suggestion">Sugerir uma melhoria</option><option value="other">Outro feedback</option>
          </select>
          <label className="form-label" htmlFor="feedback-message">{draft.kind === 'bug' ? 'O que aconteceu?' : 'Conte sua ideia ou opinião'} *</label>
          <textarea id="feedback-message" className="form-input feedback-textarea" required minLength={20} maxLength={3000}
            placeholder={draft.kind === 'bug' ? 'Descreva o problema e a mensagem de erro, se houver.' : 'Explique sua sugestão ou crítica e como ela ajudaria você.'}
            value={draft.message} disabled={sending} onChange={event => update('message', event.target.value)} />
          {draft.kind === 'bug' && <>
            <label className="form-label" htmlFor="feedback-steps">Quais passos levaram ao problema? *</label>
            <textarea id="feedback-steps" className="form-input feedback-textarea" required minLength={10} maxLength={2000}
              placeholder={'1. Abri a tela de transações\n2. Toquei em...\n3. O problema apareceu quando...'}
              value={draft.steps} disabled={sending} onChange={event => update('steps', event.target.value)} />
            <label className="form-label" htmlFor="feedback-expected">O que você esperava que acontecesse? (opcional)</label>
            <textarea id="feedback-expected" className="form-input feedback-textarea short" maxLength={1000}
              value={draft.expected} disabled={sending} onChange={event => update('expected', event.target.value)} />
          </>}
          <label className="form-label" htmlFor="feedback-device">Dispositivo e navegador (opcional)</label>
          <input id="feedback-device" className="form-input" maxLength={150} placeholder="Ex.: celular Android, Chrome"
            value={draft.device} disabled={sending} onChange={event => update('device', event.target.value)} />
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="dialog-actions"><button type="button" className="button secondary" disabled={sending} onClick={close}>Fechar</button>
            <button type="submit" className="button primary" disabled={sending}><Icon name="message" size={18} />{sending ? 'Enviando...' : 'Enviar feedback'}</button></div>
        </form>}
      </div>
    </dialog>
  </>;
}
