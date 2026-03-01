import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Transaction } from '../../types';

interface CategoryBarChartProps {
  transactions: Transaction[];
}

const COLORS: Record<string, string> = {
  Moradia: '#ef4444',
  Lazer: '#f97316',
  Alimentação: '#eab308',
  Saúde: '#ec4899',
  Transporte: '#8b5cf6',
  Outros: '#6b7280',
};

export default function CategoryBarChart({ transactions }: CategoryBarChartProps) {
  const data = transactions
    .filter(t => (t.type as string) === 'expense')
    .reduce((acc, t) => {
      const existing = acc.find(i => i.name === t.category);
      if (existing) {
        existing.value += t.amount;
      } else {
        acc.push({ name: t.category, value: t.amount });
      }
      return acc;
    }, [] as { name: string; value: number }[])
    .sort((a, b) => b.value - a.value);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.08)',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid rgba(255,255,255,0.1)',
      marginBottom: '24px',
    }}>
      <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
        Despesas por Categoria
      </h2>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis type="number" stroke="#c4b5fd" tick={{ fill: '#c4b5fd', fontSize: 12 }} />
          <YAxis type="category" dataKey="name" stroke="#c4b5fd" tick={{ fill: '#c4b5fd', fontSize: 12 }} width={80} />
          <Tooltip
            contentStyle={{
              background: '#2e1065',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'white',
            }}
            formatter={(value) => {
              if (typeof value === 'number') {
                return [value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), ''];
              }
              return [String(value), ''];
            }}
          />
          <Bar dataKey="value" name="Valor" radius={[0, 6, 6, 0]}>
            {data.map(entry => (
              <Cell key={entry.name} fill={COLORS[entry.name] || '#6b7280'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}