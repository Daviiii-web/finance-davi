import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Transaction } from '../../types';

interface MonthlyChartProps {
    transactions: Transaction[];
}

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function MonthlyChart({ transactions }: MonthlyChartProps) {
    const monthlyData = transactions.reduce((acc, t) => {
        const date = new Date(t.date + 'T00:00:00');
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        const label = `${MONTH_NAMES[date.getMonth()]}/${String(date.getFullYear()).slice(2)}`;

        if (!acc[key]) {
            acc[key] = { label, income: 0, expense: 0, balance: 0, sortKey: key };
        }

        if ((t.type as string) === 'income') {
            acc[key].income += t.amount;
        } else {
            acc[key].expense += t.amount;
        }

        acc[key].balance = acc[key].income - acc[key].expense;
        return acc;
    }, {} as Record<string, { label: string; income: number; expense: number; balance: number; sortKey: string }>);

    const data = Object.values(monthlyData)
        .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    return (
        <div style={{
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid rgba(255,255,255,0.1)',
            marginBottom: '24px',
        }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
                Evolução Mensal
            </h2>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="label" stroke="#c4b5fd" tick={{ fill: '#c4b5fd', fontSize: 12 }} />
                    <YAxis stroke="#c4b5fd" tick={{ fill: '#c4b5fd', fontSize: 12 }} />
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
                    <Legend wrapperStyle={{ color: '#c4b5fd' }} />
                    <Line type="monotone" dataKey="income" name="Receitas" stroke="#4ade80" strokeWidth={2} dot={{ fill: '#4ade80' }} />
                    <Line type="monotone" dataKey="expense" name="Despesas" stroke="#f87171" strokeWidth={2} dot={{ fill: '#f87171' }} />
                    <Line type="monotone" dataKey="balance" name="Saldo" stroke="#a78bfa" strokeWidth={2} dot={{ fill: '#a78bfa' }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}