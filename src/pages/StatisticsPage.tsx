import type { Transaction } from '../types';
import MonthlyChart from '../components/Statistics/MonthlyChart';
import CategoryBarChart from '../components/Statistics/CategoryBarChart';

interface StatisticsPageProps {
  transactions: Transaction[];
}

export default function StatisticsPage({ transactions }: StatisticsPageProps) {
  const totalIncome = transactions
    .filter(t => (t.type as string) === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => (t.type as string) === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const savingsRate = totalIncome > 0
    ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100)
    : 0;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Estatísticas</h1>
        <p style={{ color: '#c4b5fd', fontSize: '14px' }}>Análise detalhada</p>
      </div>


      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Recebido', value: `R$ ${totalIncome.toFixed(2)}`, color: '#4ade80' },
          { label: 'Total Gasto',    value: `R$ ${totalExpense.toFixed(2)}`, color: '#f87171' },
          { label: 'Taxa de Poupança', value: `${savingsRate}%`,            color: '#a78bfa' },
        ].map(card => (
          <div key={card.label} style={{
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(255,255,255,0.1)',
            textAlign: 'center',
          }}>
            <p style={{ color: '#c4b5fd', fontSize: '13px', marginBottom: '8px' }}>{card.label}</p>
            <p style={{ fontSize: '22px', fontWeight: 'bold', color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>

      <MonthlyChart transactions={transactions} />
      <CategoryBarChart transactions={transactions} />
    </div>
  );
}