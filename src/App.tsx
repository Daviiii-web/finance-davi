import { useState, useEffect } from 'react';
import { useTransactions } from './hooks/useTransactions';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import StatisticsPage from './pages/StatisticsPage';

type ActiveTab = 'dashboard' | 'transactions' | 'statistics';

const TABS = [
  { id: 'dashboard',    label: 'Dashboard',    icon: '⊞' },
  { id: 'transactions', label: 'Transações',   icon: '↕' },
  { id: 'statistics',   label: 'Estatísticas', icon: '↗' },
] as const;

function useCurrentDateTime() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return now;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const { transactions, summary, addTransaction, deleteTransaction } = useTransactions();
  const now = useCurrentDateTime();

  const formattedDate = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  const formattedTime = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #6d28d9 100%)',
      color: 'white',
      fontFamily: 'system-ui, sans-serif',
    }}>

      <header style={{
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.2)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          padding: '0 24px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>

     
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #200352, #4f46e5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              boxShadow: '0 0 12px rgba(124,58,237,0.5)',
            }}>
              💰
            </div>
            <div>
              <p style={{ fontWeight: '700', fontSize: '16px', lineHeight: 1 }}>Financias Davi</p>
              <p style={{ fontSize: '11px', color: '#a78bfa', lineHeight: 1.4 }}>Controle Financeiro</p>
            </div>
          </div>

          <nav style={{
            display: 'flex',
            gap: '4px',
            background: 'rgba(255,255,255,0.07)',
            borderRadius: '12px',
            padding: '4px',
          }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: activeTab === tab.id ? '600' : '400',
                  background: activeTab === tab.id
                    ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                    : 'transparent',
                  color: activeTab === tab.id ? 'white' : '#c4b5fd',
                  transition: 'all 0.2s',
                  boxShadow: activeTab === tab.id
                    ? '0 2px 8px rgba(124,58,237,0.4)'
                    : 'none',
                }}
              >
                <span style={{ fontSize: '14px' }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '13px', fontWeight: '500', color: 'white', lineHeight: 1 }}>
              {formattedTime}
            </p>
            <p style={{ fontSize: '11px', color: '#a78bfa', lineHeight: 1.6, textTransform: 'capitalize' }}>
              {formattedDate}
            </p>
          </div>

        </div>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px' }}>
        {activeTab === 'dashboard' && (
          <DashboardPage transactions={transactions} summary={summary} />
        )}
        {activeTab === 'transactions' && (
          <TransactionsPage
            transactions={transactions}
            onAdd={addTransaction}
            onDelete={deleteTransaction}
          />
        )}
        {activeTab === 'statistics' && (
          <StatisticsPage transactions={transactions} />
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '16px 0', color: '#a78bfa', fontSize: '12px' }}>
        Desenvolvido por Davi Felipe
      </footer>

    </div>
  );
}