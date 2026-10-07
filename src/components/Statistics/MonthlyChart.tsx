import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useId } from 'react';
import type { Transaction } from '../../types';
import { formatCurrency } from '../../format';
import Icon from '../Icon';

export default function MonthlyChart({ transactions }: { transactions: Transaction[] }) {
  const gradientId = useId().replace(/:/g, '');
  const totals = transactions.reduce((acc, t) => {
    const key = t.date.slice(0, 7);
    if (!acc[key]) acc[key] = { month: key, income: 0, expense: 0 };
    acc[key][t.type] += t.amount;
    return acc;
  }, {} as Record<string, { month: string; income: number; expense: number }>);
  const data = Object.values(totals).sort((a, b) => a.month.localeCompare(b.month));

  return <section className="panel chart-panel">
    <div className="panel-heading"><div><h2>Entradas e saídas</h2><p>Seu movimento ao longo dos meses</p></div><span className="subtle-icon"><Icon name="chart" /></span></div>
    {data.length === 0 ? <div className="empty-state chart-empty"><Icon name="chart" size={38} /><h3>Sua história começa aqui</h3><p>Registre uma transação para acompanhar sua evolução.</p></div> : <>
      <div className="chart-legend"><span><i className="legend-income" />Receitas</span><span><i className="legend-expense" />Despesas</span></div>
      <div className="chart-canvas"><ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
          <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-income)" stopOpacity={0.18} /><stop offset="100%" stopColor="var(--chart-income)" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid strokeDasharray="4 5" vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="month" tickFormatter={value => { const [year, month] = String(value).split('-'); return month + '/' + year.slice(2); }} axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} dy={8} />
          <YAxis width={58} axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} tickFormatter={value => new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value))} />
          <Tooltip contentStyle={{ background: 'var(--surface)', color: 'var(--chart-tooltip-text)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13 }} formatter={value => formatCurrency(Number(value))} labelFormatter={value => { const [year, month] = String(value).split('-'); return month + '/' + year; }} />
          <Area isAnimationActive={false} type="monotone" dataKey="income" name="Receitas" stroke="var(--chart-income)" strokeWidth={2.5} fill={'url(#' + gradientId + ')'} dot={{ r: 3, fill: 'var(--chart-income)', strokeWidth: 0 }} />
          <Area isAnimationActive={false} type="monotone" dataKey="expense" name="Despesas" stroke="var(--chart-expense)" strokeWidth={2.5} fill="transparent" dot={{ r: 3, fill: 'var(--chart-expense)', strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer></div>
    </>}
  </section>;
}
