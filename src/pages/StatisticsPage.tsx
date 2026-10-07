import type { Transaction } from '../types';
import MonthlyChart from '../components/Statistics/MonthlyChart';
import CategoryBarChart from '../components/Statistics/CategoryBarChart';
import SummaryCards from '../components/dashboard/SummaryCards';
import TransactionList from '../components/Transactions/TransactionList';

export default function StatisticsPage({ transactions }: { transactions: Transaction[] }) {
  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const savingsRate = income > 0 ? Math.round((income - expense) / income * 100) : null;
  const top = transactions.filter(t => t.type === 'expense').sort((a, b) => b.amount - a.amount).slice(0, 5);
  return <div className="page-stack">
    <SummaryCards summary={{ income, expense, balance: income - expense }} />
    <section className="insight-strip"><div><h2>Quanto das suas receitas ficou?</h2><p>Percentual restante após as despesas de todo o histórico.</p></div><strong>{savingsRate === null ? '—' : savingsRate + '%'}</strong></section>
    <div className="dashboard-charts"><MonthlyChart transactions={transactions} /><CategoryBarChart transactions={transactions} /></div>
    <section className="panel"><div className="panel-heading"><div><h2>Maiores despesas</h2><p>Os cinco maiores gastos registrados</p></div></div><TransactionList transactions={top} /></section>
  </div>;
}
