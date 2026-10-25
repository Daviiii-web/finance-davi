import { useState } from 'react';
import FeedbackWidget from './components/FeedbackWidget';
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
import LocalTransactionsImport from './components/Transactions/LocalTransactionsImport';

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
  return <>
    <FinanceApp key={'finance-' + session.user.id} user={session.user} theme={theme} toggleTheme={toggleTheme} />
    <FeedbackWidget key={'feedback-' + session.user.id} />
  </>;
}

function FinanceApp({ user, theme, toggleTheme }: {
  user: User;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}) {

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const {
    transactions, summary, addTransaction, deleteTransaction, importLocalTransactions, categories, addCategory,
    isLoading, isRefreshing, isMutating, isOffline, lastUpdated, loadError, mutationError, refresh, storageError, hasLocalAccount, pendingCount, pendingIds, pendingDeletes,
  } = useTransactions(user.id);
  const cannotWrite = isLoading || isMutating || storageError !== null;

  const themeButton = <ThemeToggle theme={theme} onToggle={toggleTheme} />;
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const accountName = user.email?.split('@')[0] || 'Minha conta';
  const initial = accountName.charAt(0).toLocaleUpperCase('pt-BR');

  async function handleSignOut() {
    if (isSigningOut) return;
    if (pendingCount > 0 && !window.confirm('Existem alterações ainda não enviadas. Elas continuarão neste dispositivo e serão enviadas quando você entrar novamente nesta conta. Deseja sair?')) return;
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
  if (isLoading) {
    return <main className="auth-loading" role="status">{themeButton}{logoutButton}
      <Icon name="wallet" size={36} /><h1>Carregando seus lançamentos...</h1>
      <p>Abrindo os lançamentos deste dispositivo.</p>
      {signOutError && <p className="form-error">{signOutError}</p>}
    </main>;
  }
  if (!hasLocalAccount && storageError) {
    return <main className="auth-loading" role="alert">{themeButton}{logoutButton}
      <Icon name="shield" size={36} /><h1>Não foi possível carregar suas transações</h1>
      <p>{storageError}</p><p>Seus dados locais foram preservados.</p>
      {signOutError && <p className="form-error">{signOutError}</p>}
      <button className="button primary" disabled={isRefreshing} onClick={() => void refresh()}>{isRefreshing ? 'Atualizando...' : 'Tentar novamente'}</button>
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
            <button className="button primary" disabled={cannotWrite} onClick={() => setIsPanelOpen(true)}><Icon name="plus" size={18} />Nova transação</button>
          </div>
          <div className="sync-status" aria-live="polite">
            <div><span>{isOffline ? 'Sem conexão. Você pode cadastrar e excluir neste dispositivo.' : isRefreshing ? 'Sincronizando com sua conta...' : lastUpdated ? 'Última consulta às ' + lastUpdated.toLocaleTimeString('pt-BR') : 'O histórico completo será consultado quando houver conexão.'}</span>
              {pendingCount > 0 && <p className="sync-detail">{pendingCount} alteração(ões) pendente(s) de envio. {pendingDeletes > 0 && pendingDeletes + ' exclusão(ões) aguardando confirmação.'}</p>}
            </div>
            <button type="button" className="text-button" disabled={isRefreshing || isMutating || isOffline} onClick={() => void refresh()}>Sincronizar agora</button>
          </div>
          {loadError && <p className="form-error session-error" role="alert">{loadError} As alterações pendentes continuam neste dispositivo para uma nova tentativa.</p>}
          {storageError && <p className="form-error session-error" role="alert">{storageError}</p>}
          {mutationError && <p className="form-error session-error" role="alert">{mutationError}</p>}
          <LocalTransactionsImport userId={user.id} email={user.email || 'atual'} disabled={cannotWrite || isOffline || isRefreshing || pendingCount > 0} onImport={importLocalTransactions} />
          {activeTab === 'dashboard' && <DashboardPage pendingIds={pendingIds} isBusy={cannotWrite} transactions={transactions} summary={summary} onViewAll={() => setActiveTab('transactions')} onNew={() => setIsPanelOpen(true)} />}
          {activeTab === 'transactions' && <TransactionsPage pendingIds={pendingIds} isBusy={cannotWrite} transactions={transactions} onDelete={deleteTransaction} onNew={() => setIsPanelOpen(true)} />}
          {activeTab === 'statistics' && <StatisticsPage transactions={transactions} />}
          <footer className="page-footer"><Icon name="shield" size={15} /> Salvo neste dispositivo · Confira as pendências de envio acima <span>Feito por Davi Felipe</span></footer>
        </main>
      </div>
      <AddTransactionPanel categories={categories} onCreateCategory={addCategory} existingTransactions={transactions} isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} onAdd={addTransaction} />
    </div>
  );
}
