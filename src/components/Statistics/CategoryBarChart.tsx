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

function CustomTooltip({ active, payload, label }: {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
}) {
    if (!active || !payload || payload.length === 0) return null;

    return (
        <div style={{
            background: 'rgba(30,10,80,0.95)',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 16px',
        }}>
            <p style={{ color: 'white', fontSize: '12px', marginBottom: '4px' }}>{label}</p>
            <p style={{ color: 'white', fontWeight: '700', fontSize: '15px' }}>
                {Number(payload[0].value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
        </div>
    );
}

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
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255,255,255,0.1)',
            marginBottom: '24px',
        }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'white' }}>
                Despesas por Categoria
            </h2>
            <p style={{ color: 'white', fontSize: '13px', marginBottom: '24px' }}>
                Comparativo de gastos por categoria
            </p>

            <ResponsiveContainer width="100%" height={data.length * 52 + 40}>
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ left: 0, right: 24, top: 0, bottom: 0 }}
                    barSize={20}
                >
                    <CartesianGrid
                        horizontal={false}
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.08)"
                    />
                    <XAxis
                        type="number"
                        stroke="transparent"
                        tick={{ fill: '#a78bfa', fontSize: 11 }}
                        tickFormatter={(v) => `R$${v}`}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        type="category"
                        dataKey="name"
                        stroke="transparent"
                        tick={{ fill: 'white', fontSize: 13, fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                        width={90}
                    />
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: 'rgba(167,139,250,0.06)' }}
                    />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                        {data.map(entry => (
                            <Cell key={entry.name} fill={COLORS[entry.name] || '#6b7280'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}