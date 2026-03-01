import type { Transaction } from '../../types';

interface TopExpensesProps {
  transactions: Transaction[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Moradia:     '#ef4444',
  Lazer:       '#f97316',
  Alimentação: '#eab308',
  Saúde:       '#ec4899',
  Transporte:  '#8b5cf6',
  Outros:      '#6b7280',
};

function isExpense(t: Transaction): boolean {
  return t.type === 'expense';
}

export default function TopExpenses({ transactions }: TopExpensesProps) {
  const top5 = transactions
    .filter(isExpense)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.08)',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid rgba(255,255,255,0.1)',
      marginBottom: '24px',
    }}>
      <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
        Maiores Despesas
      </h2>

      {top5.map((t) => (
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
              background: CATEGORY_COLORS[t.category] || '#6b7280',
            }} />
            <div>
              <p style={{ fontWeight: '500', fontSize: '14px' }}>{t.title}</p>
              <p style={{ color: '#c4b5fd', fontSize: '12px' }}>{t.category}</p>
            </div>
          </div>
          <span style={{ color: '#f87171', fontWeight: '600' }}>
            R$ {t.amount.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}