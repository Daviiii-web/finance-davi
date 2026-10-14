import { supabase } from '../lib/supabase';
import { readAccount, acknowledgeChange, saveRemoteSnapshot, acknowledgeCategory, saveRemoteCategories } from '../lib/offlineTransactions';
import { createCategory, listCategories } from './categoryService';
import { createTransaction, listTransactions, removeTransaction } from './transactionService';

export async function requireAccount(userId: string, signal: AbortSignal) {
  signal.throwIfAborted();
  if (!navigator.onLine) throw new Error('Sem conexão. Seus lançamentos permanecem neste dispositivo.');
  const { data, error } = await supabase.auth.getSession();
  signal.throwIfAborted();
  if (error || data.session?.user.id !== userId) {
    throw new Error('Entre novamente na conta original para enviar as pendências.');
  }
}

export async function withSyncLock<T>(
  userId: string, signal: AbortSignal, work: () => Promise<T>,
): Promise<T | undefined> {
  if (!navigator.locks) throw new Error('Atualize seu navegador para sincronizar com segurança. Seus lançamentos locais foram preservados.');
  return navigator.locks.request('poupae-sync:' + userId, { ifAvailable: true }, async lock => {
    if (!lock) return undefined;
    signal.throwIfAborted();
    return work();
  });
}

export async function syncAccount(userId: string, signal: AbortSignal) {
  return withSyncLock(userId, signal, async () => {
    await requireAccount(userId, signal);
    const initial = await readAccount(userId);
    for (const change of initial.pending) {
      await requireAccount(userId, signal);
      if (change.kind === 'create') {
        const saved = await createTransaction(userId, change.transaction, signal);
        await acknowledgeChange(userId, change, saved);
      } else {
        await removeTransaction(userId, change.transaction.id, signal);
        await acknowledgeChange(userId, change);
      }
    }
    await requireAccount(userId, signal);
    const rows = await listTransactions(userId, AbortSignal.any([signal, AbortSignal.timeout(20000)]));
    signal.throwIfAborted();
    await saveRemoteSnapshot(userId, rows);
    const latest = await readAccount(userId);
    for (const name of latest.pendingCategories) {
      await requireAccount(userId, signal);
      const saved = await createCategory(userId, name, AbortSignal.any([signal, AbortSignal.timeout(20000)]));
      signal.throwIfAborted();
      await acknowledgeCategory(userId, name, saved);
    }
    await requireAccount(userId, signal);
    const categories = await listCategories(userId, AbortSignal.any([signal, AbortSignal.timeout(20000)]));
    signal.throwIfAborted();
    return saveRemoteCategories(userId, categories);
  });
}
