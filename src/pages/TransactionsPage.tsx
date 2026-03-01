import { useState } from 'react';
import type { Transaction } from '../types';
import TransactionList from '../components/Transactions/TransactionList';
import AddTransactionPanel from '../components/Transactions/AddTransactionPanel';

interface TransactionsPageProps {
  transactions: Transaction[];
  onAdd: (data: Omit<Transaction, 'id'>) => void;
  onDelete: (id: string) => void;
}

type FilterType = 'all' | 'income' | 'expense';

export default function TransactionsPage({ transactions, onAdd, onDelete }: TransactionsPageProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return (t.type as string) === filter;
  });

  const filterButtons: { id: FilterType; label: string }[] = [
    { id: 'all',     label: 'Todas'    },
    { id: 'income',  label: 'Receitas' },
    { id: 'expense', label: 'Despesas' },
  ];

  return (
    <div style={{ position: 'relative' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Transações</h1>
          <p style={{ color: '#c4b5fd', fontSize: '14px' }}>
            {filteredTransactions.length} transação(ões) encontrada(s)
          </p>
        </div>

        <button
          onClick={() => setIsPanelOpen(true)}
          style={{
            background: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          + Nova Transação
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {filterButtons.map(btn => (
          <button
            key={btn.id}
            onClick={() => setFilter(btn.id)}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px',
              background: filter === btn.id ? '#7c3aed' : 'rgba(255,255,255,0.1)',
              color: 'white',
              transition: 'background 0.2s',
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <TransactionList
        transactions={filteredTransactions}
        onDelete={onDelete}
      />

      <AddTransactionPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onAdd={onAdd}
      />
    </div>
  );
}