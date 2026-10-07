import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Transaction, Category, TransactionType } from '../../types';
import Icon from '../Icon';

interface AddTransactionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: Omit<Transaction, 'id'>) => void;
}
const categories: Category[] = ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Outros'];

function createInitialForm() {
  const now = new Date();
  const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  return { title: '', amount: '', type: 'expense' as TransactionType, category: 'Outros' as Category, date };
}

export default function AddTransactionPanel({ isOpen, onClose, onAdd }: AddTransactionPanelProps) {
  const [form, setForm] = useState(createInitialForm);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen) dialog?.showModal();
    else dialog?.close();
    if (!isOpen) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = oldOverflow; };
  }, [isOpen]);

  function closePanel() {
    setError(null);
    setForm(createInitialForm());
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) { setError('Digite um título para criar a transação!'); return; }
    if (!form.amount || !form.date) { setError('Preencha o valor e a data.'); return; }
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) { setError('O valor deve ser um número maior que zero!'); return; }
    onAdd({ title: form.title.trim(), amount, type: form.type, category: form.category, date: form.date });
    closePanel();
  }

  return <dialog ref={dialogRef} className="transaction-dialog" aria-labelledby="transaction-dialog-title" onCancel={event => { event.preventDefault(); closePanel(); }} onClick={event => { if (event.target === event.currentTarget) closePanel(); }}>
    <div className="dialog-content">
      <div className="dialog-heading"><div><p className="eyebrow">ORGANIZE SEU DIA A DIA</p><h2 id="transaction-dialog-title">Nova transação</h2></div><button className="icon-button" aria-label="Fechar formulário" onClick={closePanel}><Icon name="close" /></button></div>
      <form onSubmit={handleSubmit} noValidate>
        <fieldset className="type-fieldset"><legend>Tipo de movimentação</legend><div className="type-options">{(['expense', 'income'] as const).map(type => <button type="button" key={type} aria-pressed={form.type === type} className={form.type === type ? 'type-option selected ' + type : 'type-option'} onClick={() => setForm(prev => ({ ...prev, type }))}><Icon name={type === 'income' ? 'down' : 'up'} size={18} />{type === 'income' ? 'Receita' : 'Despesa'}</button>)}</div></fieldset>
        <label className="form-label" htmlFor="transaction-amount">Valor da transação</label>
        <div className="amount-field"><span>R$</span><input id="transaction-amount" type="number" inputMode="decimal" placeholder="0,00" min="0.01" step="0.01" required value={form.amount} onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))} /></div>
        <label className="form-label" htmlFor="transaction-title">Descrição</label>
        <input className="form-input" id="transaction-title" placeholder="Ex.: Compras do mercado" required value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} />
        <div className="form-grid"><div><label className="form-label" htmlFor="transaction-category">Categoria</label><select className="form-input" id="transaction-category" value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value as Category }))}>{categories.map(category => <option key={category}>{category}</option>)}</select></div>
          <div><label className="form-label" htmlFor="transaction-date">Data</label><input className="form-input" id="transaction-date" type="date" required value={form.date} onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))} /></div></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="dialog-actions"><button type="button" className="button secondary" onClick={closePanel}>Cancelar</button><button type="submit" className="button primary"><Icon name="plus" size={18} />Salvar transação</button></div>
      </form>
    </div>
  </dialog>;
}
