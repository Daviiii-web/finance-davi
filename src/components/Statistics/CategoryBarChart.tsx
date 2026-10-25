import type { Transaction } from '../../types';
import { formatCurrency } from '../../format';
import Icon from '../Icon';
import { categoryKey } from '../../categories';

const colors = ['#16866b', '#64a894', '#d1a16a', '#83a2c3', '#ac98bb', '#acb6b0'];

export default function CategoryBarChart({ transactions }: { transactions: Transaction[] }) {

  const totals = new Map<string, { name: string; cents: number }>();
  for (const transaction of transactions.filter(item => item.type === 'expense')) {
    const key = categoryKey(transaction.category);
    const group = totals.get(key) ?? { name: transaction.category, cents: 0 };
    group.cents += Math.round(transaction.amount * 100);
    totals.set(key, group);
  }
  const data: [string, number][] = [...totals.values()].sort((a, b) => b.cents - a.cents)
    .map(group => [group.name, group.cents / 100]);
  const total = data.reduce((sum, [, value]) => sum + value, 0);

  return <section className="panel category-panel">
    <div className="panel-heading"><div><h2>Para onde vai?</h2><p>Despesas por categoria</p></div><span className="subtle-icon"><Icon name="wallet" /></span></div>
    {data.length === 0 ? <div className="empty-state chart-empty"><Icon name="wallet" size={38} /><h3>Tudo em seu lugar</h3><p>Suas despesas serão organizadas por categoria aqui.</p></div> : <div className="category-content">
      <div className="category-total"><span>Total de despesas</span><strong>{formatCurrency(total)}</strong></div>
      <div className="distribution-bar" aria-hidden="true">{data.map(([name, amount], index) => <span key={name} style={{ width: (amount / total * 100) + '%', background: colors[index % colors.length] }} />)}</div>
      <ul className="category-list">{data.map(([name, amount], index) => <li key={name}><span className="category-name"><i style={{ background: colors[index % colors.length] }} />{name}</span><strong>{formatCurrency(amount)}</strong><small>{Math.round(amount / total * 100)}%</small></li>)}</ul>
    </div>}
  </section>;
}
