import { supabase } from '../lib/supabase';
import type { Transaction } from '../types';

function requestSignal(signal?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(20000);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}
const COLUMNS = 'id,user_id,title,amount_cents,type,category,date';
const CATEGORIES = ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Outros'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function amountToCents(amount: number): number {
  const cents = Math.round(amount * 100);
  if (!Number.isFinite(amount) || cents <= 0 || cents > 2147483647 ||
      Math.abs(amount * 100 - cents) > 0.000001) {
    throw new Error('Use um valor entre R$ 0,01 e R$ 21.474.836,47, com até duas casas decimais.');
  }
  return cents;
}

export function isTransaction(value: unknown): value is Transaction {
  if (!value || typeof value !== 'object') return false;
  const t = value as Record<string, unknown>;
  if (typeof t.id !== 'string' || !UUID.test(t.id) ||
      typeof t.title !== 'string' || !t.title.trim() ||
      typeof t.amount !== 'number' || !Number.isFinite(t.amount) ||
      (t.type !== 'income' && t.type !== 'expense') ||
      typeof t.category !== 'string' || !CATEGORIES.includes(t.category) ||
      typeof t.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(t.date)) return false;
  const date = new Date(t.date + 'T00:00:00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== t.date) return false;
  try { amountToCents(t.amount); return true; } catch { return false; }
}

function fromRow(value: unknown, userId: string): Transaction {
  if (!value || typeof value !== 'object') throw new Error('O banco retornou uma transação inválida.');
  const row = value as Record<string, unknown>;
  if (row.user_id !== userId || typeof row.amount_cents !== 'number' ||
      !Number.isInteger(row.amount_cents)) throw new Error('O banco retornou uma transação inválida.');
  const transaction = {
    id: row.id, title: row.title, amount: row.amount_cents / 100,
    type: row.type, category: row.category, date: row.date,
  };
  if (!isTransaction(transaction)) throw new Error('O banco retornou uma transação inválida.');
  return transaction;
}

function toRow(transaction: Transaction, userId: string) {
  if (!isTransaction(transaction)) throw new Error('Confira a descrição, o valor, a categoria e a data da transação.');
  return {
    id: transaction.id, user_id: userId, title: transaction.title.trim(),
    amount_cents: amountToCents(transaction.amount), type: transaction.type,
    category: transaction.category, date: transaction.date,
  };
}

export async function listTransactions(userId: string, signal: AbortSignal): Promise<Transaction[]> {
  const transactions: Transaction[] = [];
  let cursor: string | undefined;
  // Keyset pagination avoids silently truncating accounts with more than 1,000 records.
  while (true) {
    let query = supabase.from('transactions').select(COLUMNS)
      .eq('user_id', userId).order('id', { ascending: true }).limit(500);
    if (cursor) query = query.gt('id', cursor);
    const { data, error } = await query.abortSignal(signal);
    if (error) throw error;
    const page = (data ?? []).map(row => fromRow(row, userId));
    transactions.push(...page);
    if (page.length < 500) return transactions;
    cursor = page[page.length - 1].id;
  }
}

export async function createTransaction(userId: string, transaction: Transaction, signal?: AbortSignal): Promise<Transaction> {
  // Retrying the same draft cannot insert it twice. This never updates existing rows.
  const { error } = await supabase.from('transactions')
    .upsert(toRow(transaction, userId), { onConflict: 'id', ignoreDuplicates: true })
    .abortSignal(requestSignal(signal));
  if (error) throw error;
  const result = await supabase.from('transactions').select(COLUMNS)
    .eq('user_id', userId).eq('id', transaction.id).abortSignal(requestSignal(signal)).single();
  if (result.error) throw result.error;
  const saved = fromRow(result.data, userId);
  if (saved.title !== transaction.title.trim() || amountToCents(saved.amount) !== amountToCents(transaction.amount) ||
      saved.type !== transaction.type || saved.category !== transaction.category || saved.date !== transaction.date) {
    throw new Error('Esse ID já existe com dados diferentes. O lançamento local foi preservado para revisão.');
  }
  return saved;
}

export async function removeTransaction(userId: string, id: string, signal?: AbortSignal): Promise<void> {
  const { error } = await supabase.from('transactions').delete()
    .eq('user_id', userId).eq('id', id).abortSignal(requestSignal(signal));
  if (error) throw error;
  // A policy can silently hide a row from DELETE; don't report success if it remains.
  const check = await supabase.from('transactions').select('id')
    .eq('user_id', userId).eq('id', id).abortSignal(requestSignal(signal)).maybeSingle();
  if (check.error) throw check.error;
  if (check.data) throw new Error('Não foi possível excluir a transação. Verifique a permissão da sua conta.');
}

export async function importTransactions(userId: string, transactions: Transaction[], signal?: AbortSignal): Promise<void> {
  const rows = transactions.map(transaction => toRow(transaction, userId));
  for (let index = 0; index < rows.length; index += 100) {
    const { error } = await supabase.from('transactions')
      .upsert(rows.slice(index, index + 100), { onConflict: 'id', ignoreDuplicates: true })
      .abortSignal(requestSignal(signal));
    if (error) throw error;
    const expected = rows.slice(index, index + 100);
    const check = await supabase.from('transactions').select(COLUMNS)
      .eq('user_id', userId).in('id', expected.map(row => row.id))
      .abortSignal(requestSignal(signal));
    if (check.error) throw check.error;
    if (expected.some(row => !check.data?.some(saved =>
      saved.id === row.id && saved.title === row.title && saved.amount_cents === row.amount_cents &&
      saved.type === row.type && saved.category === row.category && saved.date === row.date))) {
      throw new Error('Alguns registros já existem com dados diferentes ou não estão acessíveis. Nenhum registro existente foi sobrescrito.');
    }
  }
}

export function getTransactionErrorMessage(error: unknown): string {
  if (!navigator.onLine) return 'Você está sem conexão. Conecte-se à internet e tente novamente.';
  if (error && typeof error === 'object' && 'code' in error) {
    if (error.code === '42501') return 'Sua conta não tem permissão para essa operação. Entre em contato com o suporte.';
    if (error.code === 'PGRST205' || error.code === '42703') return 'O serviço de lançamentos está indisponível. Entre em contato com o suporte.';
    if (error.code === '23514' || error.code === '22003') return 'O banco recusou os dados. Confira o valor, o tipo e a categoria.';
    if (error.code === 'PGRST301' || error.code === 'PGRST303') return 'Sua sessão expirou. Entre novamente.';
  }
  if (error instanceof Error && (error.name === 'Error' || error.name === 'OfflineStorageError')) return error.message;
  return 'Não foi possível confirmar a operação no banco. Confira a conexão e tente novamente.';
}
