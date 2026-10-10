import { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const { transactions, summary, addTransaction, deleteTransaction, loadError } = useTransactions();

  const themeButton = (
    <button type="button" className="theme-toggle" onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}>
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
      <span>{theme === 'dark' ? 'Tema claro' : 'Tema escuro'}</span>
    </button>
  );
  if (loadError !== null) {
    return <main className="error-screen" role="alert">
      <Icon name="shield" size={36} />{themeButton}
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
        <div className="profile"><span className="avatar">P</span><div><strong>Meu espaço</strong><small>Finanças pessoais</small></div></div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <span className="breadcrumb">Meu espaço <span>/</span> <strong>{tabs.find(tab => tab.id === activeTab)?.label}</strong></span>

          <span className="mobile-brand"><Icon name="wallet" /> Poupaê</span>
          <div className="topbar-actions"><span className="date-label"><Icon name="calendar" size={16} />{date}</span>{themeButton}<span className="mobile-avatar avatar">P</span></div>
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>
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
          <footer className="page-footer"><Icon name="shield" size={15} /> Dados armazenados neste navegador <span>Feito por Davi Felipe</span></footer>
        </main>
      </div>
      <AddTransactionPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} onAdd={addTransaction} />
    </div>
  );
}
