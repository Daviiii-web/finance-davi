import { useState, useMemo, useEffect } from 'react';
import type { Transaction, FinancialSummary } from '../types';


type LoadResult = {
  transactions: Transaction[];
  error: string | null;
}

function loadTransactions(storageKey: string): LoadResult {
  try {
    const saved = localStorage.getItem(storageKey);

    if (saved === null) {
      return { transactions: [], error: null };
    }

    const data: unknown = JSON.parse(saved);

    if (!Array.isArray(data)) {
      throw new Error('Os dados salvos não são uma lista');
    }

    return { transactions: data as Transaction[], error: null };
  }

  catch (error) {
    console.error('Erro ao carregar transações:', error);
    return { transactions: [], error: 'Erro ao carregar transações' };
  }
}



export function useTransactions(userId: string) {
  // Account-specific storage; legacy data is preserved without assigning it to another user.
  const storageKey = 'poupae:transactions:' + userId;
  const [loadResult] = useState<LoadResult>(() => loadTransactions(storageKey));

  const [transactions, setTransactions] = useState<Transaction[]>(
    loadResult.transactions
  );

  const loadError = loadResult.error;

  useEffect(() => {
    if (loadError !== null) {
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify(transactions));
  }, [transactions, loadError, storageKey]);

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
    if (loadError !== null) {
      return;
    }

    const newTransaction: Transaction = {
      ...data,
      id: crypto.randomUUID(),
    };
    setTransactions((prev) => [newTransaction, ...prev]);
  }

  function deleteTransaction(id: string) {
    if (loadError !== null) {
      return;
    }

    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  return { transactions, summary, addTransaction, deleteTransaction, loadError };
}