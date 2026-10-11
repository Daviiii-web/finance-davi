import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { useAuth } from './hooks/useAuth';
import { signOut, getAuthErrorMessage } from './services/authService';
import AuthPage from './pages/AuthPage';
import ThemeToggle from './components/ThemeToggle';
import { useTheme } from './hooks/useTheme';
import { useTransactions } from './hooks/useTransactions';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import StatisticsPage from './pages/StatisticsPage';
import AddTransactionPanel from './components/Transactions/AddTransactionPanel';
import Icon from './components/Icon';

type ActiveTab = 'dashboard' | 'transactions' | 'statistics';
const tabs = [
  { id: 'dashboard', label: 'Visão geral', icon: 'home' },
  { id: 'transactions', label: 'Transações', icon: 'arrows' },
  { id: 'statistics', label: 'Estatísticas', icon: 'chart' },
] as const;

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { session, isLoading, error, isRecovering, recoveryUnavailable, finishRecovery } = useAuth();
  const themeControl = <ThemeToggle theme={theme} onToggle={toggleTheme} />;

  if (isLoading) {
    return <main className="auth-loading" role="status"><Icon name="wallet" size={38} /><h1>Poupaê</h1><p>Preparando seu espaço...</p></main>;
  }
  if (error) {
    return <main className="auth-loading" role="alert">{themeControl}<h1>Vamos tentar de novo?</h1><p>{error}</p><button className="button primary" onClick={() => window.location.reload()}>Tentar novamente</button></main>;
  }
  if (!session || isRecovering || recoveryUnavailable) {
    return <AuthPage key={recoveryUnavailable ? 'recovery-unavailable' : session && isRecovering ? 'reset' : 'access'}
      themeControl={themeControl} recovery={Boolean(session && isRecovering)}
      recoveryUnavailable={recoveryUnavailable} onRecoveryComplete={finishRecovery} />;
  }
  // Remount all financial state when the account changes, so data cannot leak between accounts.
  return <FinanceApp key={session.user.id} user={session.user} theme={theme} toggleTheme={toggleTheme} />;
}

function FinanceApp({ user, theme, toggleTheme }: {
  user: User;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}) {

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const { transactions, summary, addTransaction, deleteTransaction, loadError } = useTransactions(user.id);

  const themeButton = <ThemeToggle theme={theme} onToggle={toggleTheme} />;
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const accountName = user.email?.split('@')[0] || 'Minha conta';
  const initial = accountName.charAt(0).toLocaleUpperCase('pt-BR');

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setSignOutError('');
    try {
      await signOut();
    } catch (error: unknown) {
      setSignOutError(getAuthErrorMessage(error));
    } finally {
      setIsSigningOut(false);
    }
  }

  const logoutButton = <button type="button" className="icon-button logout-button"
    disabled={isSigningOut} onClick={handleSignOut} aria-label="Sair da conta" title="Sair da conta">
    <Icon name="logout" size={18} />
  </button>;
  if (loadError !== null) {
    return <main className="error-screen" role="alert">
      <Icon name="shield" size={36} />{themeButton}{logoutButton}{signOutError && <p className="form-error">{signOutError}</p>}
      <h1>Não foi possível carregar suas transações</h1>
      <p>O aplicativo bloqueou as alterações para preservar os dados armazenados. Não limpe os dados do navegador.</p>
    </main>;
  }

  const date = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Ir para o conteúdo</a>
      <aside className="sidebar">
        <a className="brand" href="#main-content" onClick={() => setActiveTab('dashboard')}>
          <span className="brand-mark"><Icon name="wallet" size={25} /></span>
          <span>Poupaê<span className="brand-subtitle">Finanças pessoais</span></span>
        </a>
        <p className="nav-label">SEU ESPAÇO</p>
        <nav className="app-nav" aria-label="Navegação principal">
          {tabs.map(tab => <button key={tab.id} className={activeTab === tab.id ? 'nav-item active' : 'nav-item'}
            aria-current={activeTab === tab.id ? 'page' : undefined} onClick={() => setActiveTab(tab.id)}>
            <Icon name={tab.icon} /><span>{tab.label}</span>
          </button>)}
        </nav>
        <div className="sidebar-note"><Icon name="leaf" size={28} /><strong>Um passo de cada vez.</strong><p>Conhecer seus gastos é o começo de uma vida financeira mais tranquila.</p></div>
        <div className="profile"><span className="avatar">{initial}</span><div className="account-details"><strong>{accountName}</strong><small>{user.email}</small></div></div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <span className="breadcrumb">Meu espaço <span>/</span> <strong>{tabs.find(tab => tab.id === activeTab)?.label}</strong></span>

          <span className="mobile-brand"><Icon name="wallet" /> Poupaê</span>
          <div className="topbar-actions"><span className="date-label"><Icon name="calendar" size={16} />{date}</span>{themeButton}{logoutButton}</div>
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>{signOutError && <p role="alert" className="form-error session-error">{signOutError}</p>}
          <div className="page-heading">
            <div><p className="eyebrow">SUAS FINANÇAS, COM CLAREZA</p>
              <h1>{activeTab === 'dashboard' ? 'Seu dinheiro, de perto.' : activeTab === 'transactions' ? 'Suas transações' : 'Entenda seus números'}</h1>
              <p className="muted">{activeTab === 'dashboard' ? 'Uma visão simples de tudo que entra e sai.' : activeTab === 'transactions' ? 'Cada movimento conta. Acompanhe os seus por aqui.' : 'Encontre padrões e acompanhe sua vida financeira.'}</p>
            </div>
            <button className="button primary" onClick={() => setIsPanelOpen(true)}><Icon name="plus" size={18} />Nova transação</button>
          </div>
          {activeTab === 'dashboard' && <DashboardPage transactions={transactions} summary={summary} onViewAll={() => setActiveTab('transactions')} onNew={() => setIsPanelOpen(true)} />}
          {activeTab === 'transactions' && <TransactionsPage transactions={transactions} onDelete={deleteTransaction} onNew={() => setIsPanelOpen(true)} />}
          {activeTab === 'statistics' && <StatisticsPage transactions={transactions} />}
          <footer className="page-footer"><Icon name="shield" size={15} /> Dados desta conta armazenados neste navegador <span>Feito por Davi Felipe</span></footer>
        </main>
      </div>
      <AddTransactionPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} onAdd={addTransaction} />
    </div>
  );
}
