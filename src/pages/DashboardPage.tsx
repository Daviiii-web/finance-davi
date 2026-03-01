import type { Transaction, FinancialSummary } from '../types';
import SummaryCards from '../components/dashboard/SummaryCards';
import CategoryChart from '../components/Statistics/CategoryBarChart';
import TopExpenses from '../components/dashboard/TopExpenses';

interface DashboardPageProps {
  transactions: Transaction[];
  summary: FinancialSummary;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
  });
}

const cardStyle = {
  background: 'rgba(255,255,255,0.08)',
  borderRadius: '12px',
  padding: '20px',
  border: '1px solid rgba(255,255,255,0.1)',
  marginBottom: '24px',
};

export default function DashboardPage({ transactions, summary }: DashboardPageProps) {
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div>
      <SummaryCards summary={summary} />
      <CategoryChart transactions={transactions} />
      <TopExpenses transactions={transactions} />

      <div style={cardStyle}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          Transações Recentes
        </h2>

        {recentTransactions.map((t) => (
          <div key={t.id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '8px',
            background: 'rgba(255,255,255,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: t.type === 'income' ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)',
                fontSize: '16px',
              }}>
                {t.type === 'income' ? '↗' : '↘'}
              </div>
              <div>
                <p style={{ fontWeight: '500', fontSize: '14px' }}>{t.title}</p>
                <p style={{ color: '#c4b5fd', fontSize: '12px' }}>{formatDate(t.date)}</p>
              </div>
            </div>
            <span style={{
              fontWeight: '600',
              color: t.type === 'income' ? '#4ade80' : '#f87171',
            }}>
              {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}