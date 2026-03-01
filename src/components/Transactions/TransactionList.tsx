import type { Transaction } from '../../types';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const CATEGORY_COLORS: Record<string, string> = {
  Moradia:     '#ef4444',
  Lazer:       '#f97316',
  Alimentação: '#eab308',
  Saúde:       '#ec4899',
  Transporte:  '#8b5cf6',
  Outros:      '#6b7280',
};

export default function TransactionList({ transactions, onDelete }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center',
        color: '#c4b5fd',
      }}>
        Nenhuma transação encontrada.
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.08)',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      {transactions.map(t => (
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
            }}>
              {(t.type as string) === 'income' ? '↗' : '↘'}
            </div>

            <div>
              <p style={{ fontWeight: '500', fontSize: '14px' }}>{t.title}</p>
              <p style={{ color: '#c4b5fd', fontSize: '12px' }}>
                {formatDate(t.date)} · {t.category}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{
              fontWeight: '600',
              color: (t.type as string) === 'income' ? '#4ade80' : '#f87171',
            }}>
              {(t.type as string) === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
            </span>

            <button
              onClick={() => onDelete(t.id)}
              style={{
                background: 'rgba(239,68,68,0.2)',
                border: 'none',
                borderRadius: '6px',
                color: '#f87171',
                cursor: 'pointer',
                padding: '4px 10px',
                fontSize: '16px',
              }}
              title="Deletar transação"
            >
              🗑
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}