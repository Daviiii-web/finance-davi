export const DEFAULT_CATEGORIES = ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Outros'] as const;
export const CATEGORY_NAME_LIMIT = 60;

export function normalizeCategoryName(value: string): string {
  return value.normalize('NFC').trim().replace(/\s+/gu, ' ');
}

export function categoryKey(name: string): string {
  return normalizeCategoryName(name).toLocaleLowerCase('pt-BR');
}

export function isCategoryName(value: unknown): value is string {
  return typeof value === 'string' && value === normalizeCategoryName(value) &&
    [...value].length > 0 && [...value].length <= CATEGORY_NAME_LIMIT && !/\p{Cc}/u.test(value);
}

export function validateCategoryName(value: string): string {
  const name = normalizeCategoryName(value);
  if (!name) throw new Error('Digite um nome para a categoria.');
  if ([...name].length > CATEGORY_NAME_LIMIT) throw new Error('Use até 60 caracteres no nome da categoria.');
  if (!isCategoryName(name)) throw new Error('Use um nome sem caracteres de controle.');
  return name;
}

export function isDefaultCategory(name: string): boolean {
  return DEFAULT_CATEGORIES.some(category => categoryKey(category) === categoryKey(name));
}

export function mergeCategories(...groups: (readonly string[])[]): string[] {
  const names = new Map<string, string>();
  for (const group of groups) {
    for (const name of group) {
      const normalized = validateCategoryName(name);
      const key = categoryKey(normalized);
      if (!names.has(key)) names.set(key, normalized);
    }
  }
  return [...names.values()];
}

export function categoryOptions(...groups: (readonly string[])[]): string[] {
  const all = mergeCategories(DEFAULT_CATEGORIES, ...groups);
  return [...DEFAULT_CATEGORIES, ...all.filter(name => !isDefaultCategory(name)).sort((a, b) => a.localeCompare(b, 'pt-BR'))];
}
