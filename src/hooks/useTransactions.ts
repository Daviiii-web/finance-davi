import { useState, useMemo, useEffect } from 'react';
import type { Transaction, FinancialSummary } from '../types';
import initialData from '../data/transactions.json';

const typedInitialData = initialData.transactions as Transaction[];

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? (JSON.parse(saved) as Transaction[]) : typedInitialData;
  });

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  const summary: FinancialSummary = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return { income, expense, balance: income - expense };
  }, [transactions]);

  function addTransaction(data: Omit<Transaction, 'id'>) {
    const newTransaction: Transaction = {
      ...data,
      id: crypto.randomUUID(),
    };
    setTransactions((prev) => [newTransaction, ...prev]);
  }

  function deleteTransaction(id: string) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  return { transactions, summary, addTransaction, deleteTransaction };
}