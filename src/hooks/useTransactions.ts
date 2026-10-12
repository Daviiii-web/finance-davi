import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Transaction, FinancialSummary } from '../types';
import {
  readAccount, enqueueChange, visibleTransactions, subscribeAccount, OfflineStorageError,
} from '../lib/offlineTransactions';
import type { OfflineAccount } from '../lib/offlineTransactions';
import { importTransactions, getTransactionErrorMessage } from '../services/transactionService';
import { syncAccount, requireAccount, withSyncLock } from '../services/transactionSync';

export function useTransactions(userId: string) {
  const [account, setAccount] = useState<OfflineAccount | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const mounted = useRef(false);
  const busy = useRef(false);
  const syncController = useRef<AbortController | null>(null);
  const importController = useRef<AbortController | null>(null);

  const loadLocal = useCallback(async () => {
    const next = await readAccount(userId);
    if (mounted.current) {
      setAccount(current => !current || next.revision >= current.revision ? next : current);
      setStorageError(null);
    }
    return next;
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!mounted.current || busy.current ||
        (syncController.current && !syncController.current.signal.aborted)) return;
    const controller = new AbortController();
    syncController.current = controller;
    try {
      await loadLocal();
      if (!navigator.onLine || controller.signal.aborted || !mounted.current) return;
      setIsRefreshing(true);
      await syncAccount(userId, controller.signal);
      if (mounted.current && !controller.signal.aborted) {
        await loadLocal();
        setLoadError(null);
      }
    } catch (error) {
      if (!mounted.current || controller.signal.aborted) return;
      if (error instanceof OfflineStorageError) setStorageError(error.message);
      setLoadError(getTransactionErrorMessage(error));
    } finally {
      if (syncController.current === controller) {
        syncController.current = null;
        if (mounted.current) setIsRefreshing(false);
      }
    }
  }, [userId, loadLocal]);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    const reread = () => { void loadLocal().catch(error => {
      if (mounted.current) setStorageError(getTransactionErrorMessage(error));
    }); };
    const handleVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    const handleOnline = () => { setIsOffline(false); void refresh(); };
    const handleOffline = () => {
      setIsOffline(true);
      syncController.current?.abort();
      importController.current?.abort();
    };
    const unsubscribe = subscribeAccount(userId, reread);
    const interval = window.setInterval(handleVisible, 30000);
    window.addEventListener('focus', handleVisible);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisible);
    return () => {
      mounted.current = false;
      syncController.current?.abort();
      importController.current?.abort();
      unsubscribe();
      window.clearInterval(interval);
      window.removeEventListener('focus', handleVisible);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisible);
    };
  }, [userId, refresh, loadLocal]);

  async function saveLocally(kind: 'create' | 'delete', transaction: Transaction) {
    if (busy.current) throw new Error('Aguarde a gravação atual terminar.');
    if (!account || storageError) throw new Error('O armazenamento local está indisponível. Tente carregar novamente.');
    busy.current = true;
    setIsMutating(true);
    setMutationError(null);
    try {
      // The visible change and its queue entry derive from the same committed record.
      const saved = await enqueueChange(userId, kind, transaction);
      if (mounted.current) setAccount(current => !current || saved.revision >= current.revision ? saved : current);
    } finally {
      busy.current = false;
      if (mounted.current) {
        setIsMutating(false);
        void refresh();
      }
    }
  }

  async function addTransaction(data: Omit<Transaction, 'id'>) {
    await saveLocally('create', { ...data, id: crypto.randomUUID() });
  }

  async function deleteTransaction(id: string) {
    try {
      const latest = await readAccount(userId);
      const transaction = visibleTransactions(latest).find(t => t.id === id);
      if (transaction) await saveLocally('delete', transaction);
    } catch (error) {
      if (mounted.current) setMutationError(getTransactionErrorMessage(error));
    }
  }

  async function importLocalTransactions(items: Transaction[]) {
    if (busy.current || !navigator.onLine) throw new Error('Conecte-se para importar os dados antigos.');
    busy.current = true;
    setIsMutating(true);
    const controller = new AbortController();
    importController.current = controller;
    try {
      const completed = await withSyncLock(userId, controller.signal, async () => {
        await requireAccount(userId, controller.signal);
        await importTransactions(userId, items, controller.signal);
        return true;
      });
      if (!completed) throw new Error('Outra aba está sincronizando. Aguarde e tente importar novamente.');
    } finally {
      busy.current = false;
      importController.current = null;
      if (mounted.current) {
        setIsMutating(false);
        void refresh();
      }
    }
  }

  const transactions = useMemo(() => account ? visibleTransactions(account) : [], [account]);
  const pendingIds = useMemo(() => new Set(account?.pending.map(change => change.transaction.id)), [account]);
  const summary: FinancialSummary = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.round(t.amount * 100), 0);
    const expense = transactions.filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.round(t.amount * 100), 0);
    return { income: income / 100, expense: expense / 100, balance: (income - expense) / 100 };
  }, [transactions]);

  return {
    transactions, summary, addTransaction, deleteTransaction, importLocalTransactions,
    isLoading: account === null && storageError === null,
    isRefreshing, isMutating, isOffline, storageError, hasLocalAccount: account !== null,
    lastUpdated: account?.lastSyncedAt ? new Date(account.lastSyncedAt) : null,
    pendingCount: account?.pending.length ?? 0, pendingIds,
    pendingDeletes: account?.pending.filter(change => change.kind === 'delete').length ?? 0,
    loadError, mutationError, refresh,
  };
}
