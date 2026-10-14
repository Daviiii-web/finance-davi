import { useRef, useState } from 'react';
import { CATEGORY_NAME_LIMIT, categoryKey, validateCategoryName } from '../../categories';
import Icon from '../Icon';

interface CategoryPickerProps {
  categories: string[];
  value: string;
  disabled: boolean;
  onChange: (name: string) => void;
  onCreate: (name: string) => Promise<string>;
}

export default function CategoryPicker({ categories, value, disabled, onChange, onCreate }: CategoryPickerProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const busy = useRef(false);

  function cancel() {
    if (busy.current) return;
    setEditing(false);
    setName('');
    setError('');
    addButtonRef.current?.focus();
  }

  async function save() {
    if (busy.current || disabled) return;
    setError('');
    let normalized: string;
    try { normalized = validateCategoryName(name); }
    catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Confira o nome da categoria.');
      inputRef.current?.focus();
      return;
    }
    const existing = categories.find(category => categoryKey(category) === categoryKey(normalized));
    if (existing) {
      onChange(existing);
      setNotice('Essa categoria já existe e foi selecionada.');
      cancel();
      return;
    }
    busy.current = true;
    setCreating(true);
    try {
      const saved = await onCreate(normalized);
      onChange(saved);
      setNotice('Categoria criada e selecionada.');
      setEditing(false);
      setName('');
      requestAnimationFrame(() => addButtonRef.current?.focus());
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Não foi possível salvar a categoria. Tente novamente.');
    } finally {
      busy.current = false;
      setCreating(false);
    }
  }

  return <div className={'category-field' + (editing ? ' category-field-expanded' : '')}>
    <label className="form-label" htmlFor="transaction-category">Categoria</label>
    <select className="form-input" id="transaction-category" disabled={disabled || creating} value={value}
      onChange={event => { onChange(event.target.value); setNotice(''); }}>
      {categories.map(category => <option key={category} value={category}>{category}</option>)}
    </select>
    <button type="button" ref={addButtonRef} className="text-button category-add" disabled={disabled || creating}
      aria-expanded={editing} aria-controls="category-editor" onClick={() => {
        setEditing(true); setNotice('');
        requestAnimationFrame(() => inputRef.current?.focus());
      }}><Icon name="plus" size={15} />Nova categoria</button>
    {editing && <div id="category-editor" className="category-editor" role="group" aria-labelledby="category-name-label">
      <label id="category-name-label" className="form-label" htmlFor="category-name">Nome da nova categoria</label>
      <input ref={inputRef} className="form-input" id="category-name" value={name} maxLength={CATEGORY_NAME_LIMIT * 2}
        disabled={disabled || creating} placeholder="Ex.: Salário, Estudos ou Pets" aria-invalid={Boolean(error)}
        aria-describedby={error ? 'category-error' : 'category-help'} onChange={event => { setName(event.target.value); setError(''); }}
        onKeyDown={event => {
          if (event.key === 'Enter') { event.preventDefault(); void save(); }
          if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); cancel(); }
        }} />
      <p id="category-help" className="category-help">Até {CATEGORY_NAME_LIMIT} caracteres. Você poderá usá-la em receitas e despesas.</p>
      {error && <p id="category-error" className="form-error" role="alert">{error}</p>}
      <div className="category-actions"><button type="button" className="button secondary" disabled={disabled || creating} onClick={cancel}>Cancelar</button>
        <button type="button" className="button primary" disabled={disabled || creating} onClick={() => void save()}>{creating ? 'Criando...' : 'Criar categoria'}</button></div>
    </div>}
    <p className="category-notice" role="status">{notice}</p>
  </div>;
}
