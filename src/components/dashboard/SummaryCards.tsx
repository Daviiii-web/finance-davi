import type { FinancialSummary } from '../../types';
import { formatCurrency } from '../../format';
import Icon from '../Icon';

export default function SummaryCards({ summary }: { summary: FinancialSummary }) {
  return <div className="summary-grid">
    <section className="balance-card">
      <div className="card-label"><span>Saldo total</span><Icon name="wallet" /></div>
      <strong className="balance-value">{formatCurrency(summary.balance)}</strong>
      <p><span className="balance-dot" /> Receitas menos despesas registradas</p>
      <div className="balance-decoration" aria-hidden="true" />
    </section>
    <section className="metric-card"><span className="metric-icon income"><Icon name="down" /></span><p className="muted">Total de receitas</p><strong className="metric-value">{formatCurrency(summary.income)}</strong><small>Entradas no seu histórico</small></section>
    <section className="metric-card"><span className="metric-icon expense"><Icon name="up" /></span><p className="muted">Total de despesas</p><strong className="metric-value">{formatCurrency(summary.expense)}</strong><small>Saídas no seu histórico</small></section>
  </div>;
}
