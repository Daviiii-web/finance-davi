import type { Transaction, FinancialSummary } from '../types';
import SummaryCards from '../components/dashboard/SummaryCards';
import CategoryBarChart from '../components/Statistics/CategoryBarChart';
import MonthlyChart from '../components/Statistics/MonthlyChart';
import TransactionList from '../components/Transactions/TransactionList';
import Icon from '../components/Icon';

interface DashboardPageProps {
  transactions: Transaction[];
  pendingIds?: Set<string>;
  summary: FinancialSummary;
  onViewAll: () => void;
  onNew: () => void;
  isBusy: boolean;
}

export default function DashboardPage({ transactions, summary, onViewAll, onNew, isBusy, pendingIds }: DashboardPageProps) {
  const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  return <div className="page-stack">
    <SummaryCards summary={summary} />
    <div className="section-caption"><h2>Seu panorama financeiro</h2><span>Todo o histórico</span></div>
    <div className="dashboard-charts"><MonthlyChart transactions={transactions} /><CategoryBarChart transactions={transactions} /></div>
    <section className="panel">
      <div className="panel-heading"><div><h2>Últimas transações</h2><p>Os movimentos mais recentes por data</p></div><button className="text-button" onClick={onViewAll}>Ver todas <Icon name="chevron" size={16} /></button></div>
      <TransactionList pendingIds={pendingIds} transactions={recent} />
      {transactions.length === 0 && <div className="empty-action"><button className="button secondary" disabled={isBusy} onClick={onNew}><Icon name="plus" size={17} />Registrar meu primeiro lançamento</button></div>}
    </section>
  </div>;
}
