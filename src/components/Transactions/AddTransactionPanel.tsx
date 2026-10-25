import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Transaction, Category, TransactionType } from '../../types';
import Icon from '../Icon';
import CategoryPicker from './CategoryPicker';
import { categoryKey } from '../../categories';
import { amountToCents } from '../../services/transactionService';

interface AddTransactionPanelProps {
  isOpen: boolean;
  existingTransactions: Transaction[];
  categories: string[];
  onCreateCategory: (name: string) => Promise<string>;
  onClose: () => void;
  onAdd: (data: Omit<Transaction, 'id'>) => Promise<void>;
}

function createInitialForm() {
  const now = new Date();
  const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  return { title: '', amount: '', type: 'expense' as TransactionType, category: 'Outros' as Category, date };
}

export default function AddTransactionPanel({ isOpen, onClose, onAdd, existingTransactions, categories, onCreateCategory }: AddTransactionPanelProps) {
  const [form, setForm] = useState(createInitialForm);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const isBusy = isSaving || isCreatingCategory;
  const selectedCategory = categories.find(name => categoryKey(name) === categoryKey(form.category)) ?? form.category;
  const saving = useRef(false);
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
    if (saving.current) return;
    setError(null);
    setForm(createInitialForm());
    onClose();
  }

  async function handleCreateCategory(name: string): Promise<string> {
    if (saving.current) throw new Error('Aguarde a gravação atual terminar.');
    saving.current = true;
    setIsCreatingCategory(true);
    try { return await onCreateCategory(name); }
    finally { saving.current = false; setIsCreatingCategory(false); }
  }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    setError(null);
    if (!form.title.trim()) { setError('Digite um título para criar a transação!'); return; }
    if (!form.amount || !form.date) { setError('Preencha o valor e a data.'); return; }
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) { setError('O valor deve ser um número maior que zero!'); return; }
    try { amountToCents(amount); } catch (error) {
      setError(error instanceof Error ? error.message : 'Confira o valor informado.');
      return;
    }
    const similar = existingTransactions.some(t =>
      t.title.trim().toLocaleLowerCase('pt-BR') === form.title.trim().toLocaleLowerCase('pt-BR') &&
      Math.round(t.amount * 100) === Math.round(amount * 100) && t.type === form.type && t.date === form.date);
    if (similar && !window.confirm('Já existe um lançamento com a mesma descrição, valor, tipo e data. Deseja cadastrar outro mesmo assim?')) return;
    saving.current = true;
    setIsSaving(true);
    try {
      await onAdd({ title: form.title.trim(), amount, type: form.type, category: selectedCategory, date: form.date });
      saving.current = false;
      closePanel();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Não foi possível salvar. Tente novamente.');
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  }

  return <dialog ref={dialogRef} className="transaction-dialog" aria-labelledby="transaction-dialog-title" onCancel={event => { event.preventDefault(); closePanel(); }} onClick={event => { if (event.target === event.currentTarget) closePanel(); }}>
    <div className="dialog-content">
      <div className="dialog-heading"><div><p className="eyebrow">ORGANIZE SEU DIA A DIA</p><h2 id="transaction-dialog-title">Nova transação</h2></div><button className="icon-button" aria-label="Fechar formulário" disabled={isBusy} onClick={closePanel}><Icon name="close" /></button></div>
      <p className="offline-form-note">Salvamos primeiro neste dispositivo. O envio para sua conta acontece quando houver conexão.</p><form onSubmit={handleSubmit} noValidate aria-busy={isBusy}>
        <fieldset className="type-fieldset" disabled={isBusy}><legend>Tipo de movimentação</legend><div className="type-options">{(['expense', 'income'] as const).map(type => <button type="button" key={type} aria-pressed={form.type === type} className={form.type === type ? 'type-option selected ' + type : 'type-option'} onClick={() => setForm(prev => ({ ...prev, type }))}><Icon name={type === 'income' ? 'down' : 'up'} size={18} />{type === 'income' ? 'Receita' : 'Despesa'}</button>)}</div></fieldset>
        <label className="form-label" htmlFor="transaction-amount">Valor da transação</label>
        <div className="amount-field"><span>R$</span><input id="transaction-amount" type="number" inputMode="decimal" placeholder="0,00" min="0.01" step="0.01" required disabled={isBusy} value={form.amount} onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))} /></div>
        <label className="form-label" htmlFor="transaction-title">Descrição</label>
        <input className="form-input" id="transaction-title" placeholder="Ex.: Compras do mercado" required disabled={isBusy} value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} />
        <div className="form-grid"><CategoryPicker key={isOpen ? 'open' : 'closed'} categories={categories} value={selectedCategory} disabled={isBusy}
          onChange={category => setForm(previous => ({ ...previous, category }))} onCreate={handleCreateCategory} />
          <div><label className="form-label" htmlFor="transaction-date">Data</label><input className="form-input" id="transaction-date" type="date" required disabled={isBusy} value={form.date} onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))} /></div></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="dialog-actions"><button type="button" className="button secondary" disabled={isBusy} onClick={closePanel}>Cancelar</button><button type="submit" className="button primary" disabled={isBusy}><Icon name="plus" size={18} />{isSaving ? 'Salvando...' : 'Salvar transação'}</button></div>
      </form>
    </div>
  </dialog>;
}
