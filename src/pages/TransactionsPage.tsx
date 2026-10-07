import { useState } from 'react';
import type { Transaction } from '../types';
import TransactionList from '../components/Transactions/TransactionList';
import Icon from '../components/Icon';
import { formatCurrency } from '../format';

interface TransactionsPageProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onNew: () => void;
}
type FilterType = 'all' | 'income' | 'expense';

export default function TransactionsPage({ transactions, onDelete, onNew }: TransactionsPageProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
  const filtered = transactions.filter(t =>
    (filter === 'all' || t.type === filter) &&
    normalize(t.title + ' ' + t.category).includes(normalize(search.trim()))
  ).sort((a, b) => b.date.localeCompare(a.date));
  const net = filtered.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);

  return <section className="panel">
    <div className="panel-heading"><div><h2>Seu extrato</h2><p>Todos os períodos</p></div><span className="count-badge">{filtered.length} registros</span></div>
    <div className="transaction-toolbar">
      <div className="segmented" aria-label="Filtrar por tipo">
        {([{ id: 'all', label: 'Todas' }, { id: 'income', label: 'Receitas' }, { id: 'expense', label: 'Despesas' }] as const).map(item =>
          <button key={item.id} aria-pressed={filter === item.id} className={filter === item.id ? 'selected' : ''} onClick={() => setFilter(item.id)}>{item.label}</button>)}
      </div>
      <label className="search-field"><Icon name="search" size={18} /><input aria-label="Buscar por descrição ou categoria" placeholder="Buscar transação..." value={search} onChange={e => setSearch(e.target.value)} /></label>
    </div>
    <TransactionList transactions={filtered} onDelete={onDelete} />
    {transactions.length === 0 && <div className="empty-action"><button className="button secondary" onClick={onNew}><Icon name="plus" size={17} />Adicionar primeiro lançamento</button></div>}
    <div className="list-footer"><span>Saldo dos resultados</span><strong>{formatCurrency(net)}</strong></div>
  </section>;
}
