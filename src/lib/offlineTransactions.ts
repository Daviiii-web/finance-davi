import type { Transaction } from '../types';
import { isTransaction } from '../services/transactionService';

export interface PendingChange {
  operationId: string;
  kind: 'create' | 'delete';
  transaction: Transaction;
}
export interface OfflineAccount {
  userId: string;
  revision: number;
  remote: Transaction[];
  pending: PendingChange[];
  lastSyncedAt: string | null;
}

export class OfflineStorageError extends Error {
  constructor(message = 'Não foi possível gravar ou ler neste dispositivo. Verifique o espaço disponível e as permissões do navegador. Seus dados existentes foram preservados.') {
    super(message);
    this.name = 'OfflineStorageError';
  }
}

export function emptyAccount(userId: string): OfflineAccount {
  return { userId, revision: 0, remote: [], pending: [], lastSyncedAt: null };
}

let opening: Promise<IDBDatabase> | undefined;
function openDatabase(): Promise<IDBDatabase> {
  if (!opening) {
    opening = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('poupae-offline', 1);
      let failed = false;
      request.onupgradeneeded = () => request.result.createObjectStore('accounts', { keyPath: 'userId' });
      request.onerror = () => { failed = true; reject(new OfflineStorageError()); };
      request.onblocked = () => { failed = true; reject(new OfflineStorageError('Feche outras abas do Poupaê e tente novamente.')); };
      request.onsuccess = () => {
        if (failed) { request.result.close(); return; }
        request.result.onversionchange = () => { request.result.close(); opening = undefined; };
        resolve(request.result);
      };
    }).catch(error => { opening = undefined; throw error; });
  }
  return opening;
}

function validateAccount(value: unknown, userId: string): OfflineAccount {
  if (value === undefined) return emptyAccount(userId);
  const account = value as OfflineAccount | null;
  if (!account || account.userId !== userId || !Number.isSafeInteger(account.revision) ||
      account.revision < 0 || !Array.isArray(account.remote) || !account.remote.every(isTransaction) ||
      !Array.isArray(account.pending) || !account.pending.every(change => change &&
        typeof change.operationId === 'string' && (change.kind === 'create' || change.kind === 'delete') &&
        isTransaction(change.transaction)) ||
      new Set(account.pending.map(change => change.operationId)).size !== account.pending.length ||
      new Set(account.remote.map(t => t.id)).size !== account.remote.length ||
      (account.lastSyncedAt !== null && (typeof account.lastSyncedAt !== 'string' ||
        !Number.isFinite(Date.parse(account.lastSyncedAt))))) {
    throw new OfflineStorageError('Os dados locais precisam de revisão. Não limpe o armazenamento do navegador: ele pode conter lançamentos ainda não enviados.');
  }
  return account;
}

// Financial data is not included in notifications; each tab rereads its own account.
function notify(userId: string) {
  window.dispatchEvent(new CustomEvent('poupae-offline-change', { detail: userId }));
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel('poupae-offline');
    channel.postMessage(userId);
    channel.close();
  }
}

export function subscribeAccount(userId: string, callback: () => void): () => void {
  const local = (event: Event) => { if ((event as CustomEvent).detail === userId) callback(); };
  window.addEventListener('poupae-offline-change', local);
  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('poupae-offline') : null;
  if (channel) channel.onmessage = event => { if (event.data === userId) callback(); };
  return () => { window.removeEventListener('poupae-offline-change', local); channel?.close(); };
}

async function accessAccount(
  userId: string, update?: (account: OfflineAccount) => void,
): Promise<OfflineAccount> {
  try {
    const database = await openDatabase();
    return await new Promise<OfflineAccount>((resolve, reject) => {
      const transaction = database.transaction('accounts', update ? 'readwrite' : 'readonly', { durability: 'strict' });
      const store = transaction.objectStore('accounts');
      const request = store.get(userId);
      let result: OfflineAccount;
      let failure: unknown;
      request.onsuccess = () => {
        try {
          result = validateAccount(request.result, userId);
          if (update) {
            update(result);
            result.revision++;
            store.put(result);
          }
        } catch (error) { failure = error; transaction.abort(); }
      };
      transaction.oncomplete = () => {
        // A request's onsuccess alone does not confirm the transaction was committed.
        resolve(result);
        if (update) notify(userId);
      };
      transaction.onabort = () => reject(failure || new OfflineStorageError());
      transaction.onerror = () => reject(new OfflineStorageError());
    });
  } catch (error) {
    throw error instanceof OfflineStorageError ? error : new OfflineStorageError();
  }
}

export function readAccount(userId: string) { return accessAccount(userId); }

export function visibleTransactions(account: OfflineAccount): Transaction[] {
  const visible = new Map(account.remote.map(t => [t.id, t]));
  for (const change of account.pending) {
    if (change.kind === 'create') visible.set(change.transaction.id, change.transaction);
    else visible.delete(change.transaction.id);
  }
  return [...visible.values()];
}

export function enqueueChange(userId: string, kind: PendingChange['kind'], item: Transaction) {
  if (!isTransaction(item)) return Promise.reject(new Error('Confira os dados da transação.'));
  return accessAccount(userId, account => {
    account.pending.push({ operationId: crypto.randomUUID(), kind, transaction: item });
  });
}

export function acknowledgeChange(userId: string, change: PendingChange, saved?: Transaction) {
  return accessAccount(userId, account => {
    if (!account.pending.some(item => item.operationId === change.operationId)) return;
    account.remote = account.remote.filter(t => t.id !== change.transaction.id);
    if (saved) account.remote.push(saved);
    account.pending = account.pending.filter(item => item.operationId !== change.operationId);
  });
}

export function saveRemoteSnapshot(userId: string, remote: Transaction[]) {
  return accessAccount(userId, account => {
    account.remote = remote;
    account.lastSyncedAt = new Date().toISOString();
    // Never replace the outbox with a network snapshot.
  });
}
