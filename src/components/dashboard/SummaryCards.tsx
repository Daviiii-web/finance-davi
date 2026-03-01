import type { FinancialSummary } from '../../types';

interface SummaryCardsProps {
  summary: FinancialSummary;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    { label: 'Saldo Total', value: summary.balance, icon: '💳', color: '#ffffff' },
    { label: 'Receitas',    value: summary.income,  icon: '📈', color: '#4ade80' },
    { label: 'Despesas',    value: summary.expense, icon: '📉', color: '#f87171' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '16px',
      marginBottom: '24px',
    }}>
      {cards.map((card) => (
        <div key={card.label} style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid rgba(255,255,255,0.15)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#c4b5fd', fontSize: '14px' }}>{card.label}</span>
            <span>{card.icon}</span>
          </div>
          <p style={{ fontSize: '22px', fontWeight: 'bold', color: card.color }}>
            {formatCurrency(card.value)}
          </p>
        </div>
      ))}
    </div>
  );
}