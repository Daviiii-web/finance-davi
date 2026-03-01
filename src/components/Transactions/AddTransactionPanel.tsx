import { useState } from 'react';
import type { Transaction, Category, TransactionType } from '../../types';

interface AddTransactionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: Omit<Transaction, 'id'>) => void;
}

const CATEGORIES: Category[] = [
  'Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Outros'
];

const initialForm = {
  title: '',
  amount: '',
  type: 'expense' as TransactionType,
  category: 'Outros' as Category,
  date: new Date().toISOString().split('T')[0],
};

export default function AddTransactionPanel({ isOpen, onClose, onAdd }: AddTransactionPanelProps) {
  const [form, setForm] = useState(initialForm);

  function handleSubmit() {
    if (!form.title.trim() || !form.amount || !form.date) {
      alert('Preencha todos os campos!');
      return;
    }

    onAdd({
      title: form.title.trim(),
      amount: parseFloat(form.amount),
      type: form.type,
      category: form.category,
      date: form.date,
    });

    setForm(initialForm);
    onClose();
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    display: 'block',
    color: '#c4b5fd',
    fontSize: '13px',
    marginBottom: '6px',
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
          }}
        />
      )}

      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100vh',
        width: '360px',
        background: 'linear-gradient(180deg, #2e1065, #4c1d95)',
        borderLeft: '1px solid rgba(255,255,255,0.15)',
        zIndex: 50,
        padding: '24px',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease',
        overflowY: 'auto',
      }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Nova Transação</h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              borderRadius: '8px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div>
            <label style={labelStyle}>Tipo</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['income', 'expense'] as TransactionType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setForm(prev => ({ ...prev, type }))}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    background: form.type === type
                      ? (type === 'income' ? '#16a34a' : '#dc2626')
                      : 'rgba(255,255,255,0.1)',
                    color: 'white',
                  }}
                >
                  {type === 'income' ? '↗ Receita' : '↘ Despesa'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Título</label>
            <input
              style={inputStyle}
              placeholder="Ex: Salário, Mercado..."
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div>
            <label style={labelStyle}>Valor (R$)</label>
            <input
              style={inputStyle}
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))}
            />
          </div>

          <div>
            <label style={labelStyle}>Categoria</label>
            <select
              style={inputStyle}
              value={form.category}
              onChange={e => setForm(prev => ({ ...prev, category: e.target.value as Category }))}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat} style={{ background: '#4c1d95' }}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Data</label>
            <input
              style={inputStyle}
              type="date"
              value={form.date}
              onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>

          <button
            onClick={handleSubmit}
            style={{
              background: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '14px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginTop: '8px',
            }}
          >
            Salvar Transação
          </button>
        </div>
      </div>
    </>
  );
}