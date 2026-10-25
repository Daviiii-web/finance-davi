import { test } from 'node:test';
import assert from 'node:assert/strict';
import { categoryKey, categoryOptions, isCategoryName, validateCategoryName, mergeCategories } from '../src/categories.ts';

test('normalizes spaces and composed accents while preserving the display name', () => {
  assert.equal(validateCategoryName('  Sala\u0301rio   mensal  '), 'Salário mensal');
  assert.equal(categoryKey(' SALÁRIO '), categoryKey('Salário'));
});
test('rejects blank names, control characters and names beyond 60 code points', () => {
  for (const name of ['', '   ', 'x'.repeat(61), 'Pets\u0000']) assert.throws(() => validateCategoryName(name));
  assert.equal(isCategoryName(null), false);
  assert.equal(isCategoryName(' Salário'), false);
  assert.equal(isCategoryName('x'.repeat(60)), true);
  assert.equal(isCategoryName('🐶'.repeat(60)), true);
});
test('merges case-insensitive duplicates without modifying previous names', () => {
  assert.deepEqual(mergeCategories(['Salário'], ['salário', 'Pets'], [' PETS ']), ['Salário', 'Pets']);
});
test('retains defaults once and sorts custom categories', () => {
  const names = categoryOptions(['moradia', 'Salário', 'Estudos', 'salário']);
  assert.equal(names.filter(name => categoryKey(name) === 'moradia').length, 1);
  assert.deepEqual(names.slice(6), ['Estudos', 'Salário']);
});
test('treats object-property names as ordinary category labels', () => {
  assert.deepEqual(mergeCategories(['__proto__', 'constructor', 'toString']), ['__proto__', 'constructor', 'toString']);
});
