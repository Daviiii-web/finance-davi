import type { Transaction } from '../types';
import { categoryKey, categoryOptions, isCategoryName, isDefaultCategory, mergeCategories, validateCategoryName } from '../categories';
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
  categories: string[];
  pendingCategories: string[];
}

export class OfflineStorageError extends Error {
  constructor(message = 'Não foi possível gravar ou ler neste dispositivo. Verifique o espaço disponível e as permissões do navegador. Seus dados existentes foram preservados.') {
    super(message);
    this.name = 'OfflineStorageError';
  }
}

export function emptyAccount(userId: string): OfflineAccount {
  return { userId, revision: 0, remote: [], pending: [], lastSyncedAt: null, categories: [], pendingCategories: [] };
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
      (account.categories !== undefined && (!Array.isArray(account.categories) || !account.categories.every(isCategoryName))) ||
      (account.pendingCategories !== undefined && (!Array.isArray(account.pendingCategories) || !account.pendingCategories.every(isCategoryName))) ||
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
  return { ...account, categories: account.categories ?? [], pendingCategories: account.pendingCategories ?? [] };
}

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
    if (kind === 'create') rememberCategory(account, item.category);
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
    for (const name of mergeCategories(remote.map(item => item.category))) rememberCategory(account, name);
    account.lastSyncedAt = new Date().toISOString();
  });
}

export function visibleCategories(account: OfflineAccount): string[] {
  return categoryOptions(account.categories, account.pendingCategories, visibleTransactions(account).map(item => item.category));
}

function rememberCategory(account: OfflineAccount, value: string): string {
  const name = validateCategoryName(value);
  const key = categoryKey(name);
  const canonical = categoryOptions(account.categories, account.pendingCategories).find(item => categoryKey(item) === key) ?? name;
  if (!isDefaultCategory(canonical) && !account.categories.some(item => categoryKey(item) === key)) {
    account.categories.push(canonical);
    if (!account.pendingCategories.some(item => categoryKey(item) === key)) account.pendingCategories.push(canonical);
  }
  return canonical;
}

export async function enqueueCategory(userId: string, value: string) {
  const name = validateCategoryName(value);
  let canonical = name;
  const account = await accessAccount(userId, current => { canonical = rememberCategory(current, name); });
  return { account, name: canonical };
}

export function acknowledgeCategory(userId: string, pending: string, saved: string) {
  if (!isCategoryName(saved) || categoryKey(saved) !== categoryKey(pending)) {
    return Promise.reject(new Error('Não foi possível confirmar a categoria. Ela foi preservada neste dispositivo.'));
  }
  return accessAccount(userId, account => {
    const key = categoryKey(pending);
    account.categories = mergeCategories([saved], account.categories.filter(name => categoryKey(name) !== key));
    account.pendingCategories = account.pendingCategories.filter(name => categoryKey(name) !== key);
  });
}

export function saveRemoteCategories(userId: string, remote: string[]) {
  return accessAccount(userId, account => {
    account.categories = mergeCategories(remote, account.categories);
  });
}
