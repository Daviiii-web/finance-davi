import type { Transaction } from '../../types';
import { formatCurrency, formatDate } from '../../format';
import Icon from '../Icon';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
}

export default function TransactionList({ transactions, onDelete }: TransactionListProps) {
  if (transactions.length === 0) {
    return <div className="empty-state"><span className="empty-icon"><Icon name="arrows" size={28} /></span><h3>Nenhuma transação por aqui</h3><p>Seus lançamentos aparecerão nesta lista.</p></div>;
  }

  return <ul className="transaction-list">
    {transactions.map(t => <li key={t.id} className="transaction-row">
      <span className={'transaction-icon ' + t.type}><Icon name={t.type === 'income' ? 'down' : 'up'} /></span>
      <div className="transaction-info"><strong>{t.title}</strong><span>{t.category}<span className="mobile-date"> · {formatDate(t.date)}</span></span></div>
      <span className="transaction-date">{formatDate(t.date)}</span>
      <div className={'transaction-amount ' + t.type}><strong>{t.type === 'income' ? '+' : '−'} {formatCurrency(t.amount)}</strong><small>{t.type === 'income' ? 'Receita' : 'Despesa'}</small></div>
      {onDelete && <button className="icon-button delete-button" aria-label={'Excluir ' + t.title} title={'Excluir ' + t.title} onClick={() => {
        if (window.confirm('Excluir a transação "' + t.title + '"?')) onDelete(t.id);
      }}><Icon name="trash" size={17} /></button>}
    </li>)}
  </ul>;
}
