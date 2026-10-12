import { useState } from 'react';
import type { Transaction } from '../../types';
import { isTransaction, getTransactionErrorMessage } from '../../services/transactionService';

interface LocalSource {
  key: string;
  marker: string;
  label: string;
  unassigned: boolean;
  transactions: Transaction[];
}

function readSources(userId: string): { sources: LocalSource[]; warning: string | null } {
  const sources: LocalSource[] = [];
  let warning: string | null = null;
  for (const [key, label, unassigned] of [
    ['poupae:transactions:' + userId, 'Lançamentos locais desta conta', false],
    ['transactions', 'Lançamentos antigos sem conta vinculada', true],
  ] as const) {
    try {
      const marker = 'poupae:imported:' + userId + ':' + key;
      if (localStorage.getItem(marker) === 'done') continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const data: unknown = JSON.parse(raw);
      if (!Array.isArray(data) || !data.every(isTransaction) ||
          new Set(data.map(t => t.id)).size !== data.length) {
        warning = 'Alguns dados locais não puderam ser importados. Os originais foram preservados neste navegador.';
        continue;
      }
      if (data.length) sources.push({ key, marker, label, unassigned, transactions: data });
    } catch {
      warning = 'Não foi possível ler os dados locais. Seus lançamentos no banco continuam disponíveis.';
    }
  }
  return { sources, warning };
}

interface Props {
  userId: string;
  email: string;
  disabled: boolean;
  onImport: (transactions: Transaction[]) => Promise<void>;
}

export default function LocalTransactionsImport({ userId, email, disabled, onImport }: Props) {
  const [initial] = useState(() => readSources(userId));
  const [completed, setCompleted] = useState<string[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const sources = initial.sources.filter(source => !completed.includes(source.key));

  async function handleImport(source: LocalSource) {
    if (pending || disabled) return;
    const question = source.unassigned
      ? 'Estes lançamentos são anteriores ao login e podem pertencer a outra pessoa. Confirma que são seus e deseja copiá-los para a conta ' + email + '?'
      : 'Copiar ' + source.transactions.length + ' lançamentos locais para o banco da conta ' + email + '?';
    if (!window.confirm(question)) return;
    setPending(source.key);
    setError('');
    setMessage('');
    try {
      await onImport(source.transactions);
      setCompleted(current => [...current, source.key]);
      try {
        localStorage.setItem(source.marker, 'done');
        setMessage('Importação concluída. Os originais continuam preservados neste navegador.');
      } catch {
        setMessage('Importação concluída, mas este navegador não conseguiu registrar a conclusão. Os originais foram preservados.');
      }
    } catch (error) {
      setError(getTransactionErrorMessage(error) + ' Os originais foram preservados; você pode tentar novamente.');
    } finally {
      setPending(null);
    }
  }

  if (!sources.length && !initial.warning && !message && !error) return null;
  return <section className="local-import" aria-label="Importar dados deste navegador">
    {sources.map(source => <div className="local-import-row" key={source.key}>
      <div><strong>{source.label}</strong><p>{source.transactions.length} registros neste navegador. {source.unassigned ? 'Importe apenas se reconhecer esses dados como seus.' : 'Copie para acessar também em outros dispositivos.'}</p></div>
      <button type="button" className="button secondary" disabled={disabled || pending !== null} onClick={() => void handleImport(source)}>
        {pending === source.key ? 'Importando...' : source.unassigned ? 'Importar dados antigos' : 'Importar desta conta'}
      </button>
    </div>)}
    {initial.warning && <p role="status">{initial.warning}</p>}
    {message && <p role="status">{message}</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </section>;
}
