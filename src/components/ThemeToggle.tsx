import Icon from './Icon';

export default function ThemeToggle({ theme, onToggle }: {
  theme: 'light' | 'dark';
  onToggle: () => void;
}) {
  const label = theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro';
  return <button type="button" className="theme-toggle" onClick={onToggle} aria-label={label} title={label}>
    <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
    <span>{theme === 'dark' ? 'Tema claro' : 'Tema escuro'}</span>
  </button>;
}
