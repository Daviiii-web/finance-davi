import { supabase } from '../lib/supabase';
import { categoryKey, isCategoryName, validateCategoryName } from '../categories';

function fromRow(value: unknown, userId: string): string {
  if (!value || typeof value !== 'object') throw new Error('O banco retornou uma categoria inválida.');
  const row = value as Record<string, unknown>;
  if (row.user_id !== userId || !isCategoryName(row.name) || row.name_key !== categoryKey(row.name)) {
    throw new Error('O banco retornou uma categoria inválida.');
  }
  return row.name;
}

function checkError(error: { code?: string } | null) {
  if (!error) return;
  if (error.code === 'PGRST205' || error.code === '42P01') {
    throw new Error('As categorias estão salvas neste dispositivo, mas o serviço de categorias ainda não está disponível. Entre em contato com o suporte.');
  }
  throw error;
}

export async function listCategories(userId: string, signal: AbortSignal): Promise<string[]> {
  const names: string[] = [];
  let cursor: string | undefined;
  while (true) {
    let query = supabase.from('categories').select('user_id,name,name_key')
      .eq('user_id', userId).order('name_key', { ascending: true }).limit(500);
    if (cursor) query = query.gt('name_key', cursor);
    const { data, error } = await query.abortSignal(signal);
    checkError(error);
    const rows = data ?? [];
    names.push(...rows.map(row => fromRow(row, userId)));
    if (rows.length < 500) return names;
    cursor = rows[rows.length - 1].name_key;
  }
}

export async function createCategory(userId: string, value: string, signal: AbortSignal): Promise<string> {
  const name = validateCategoryName(value);
  const nameKey = categoryKey(name);
  const result = await supabase.from('categories')
    .upsert({ user_id: userId, name, name_key: nameKey }, { onConflict: 'user_id,name_key', ignoreDuplicates: true })
    .abortSignal(signal);
  checkError(result.error);
  const saved = await supabase.from('categories').select('user_id,name,name_key')
    .eq('user_id', userId).eq('name_key', nameKey).abortSignal(signal).single();
  checkError(saved.error);
  return fromRow(saved.data, userId);
}
