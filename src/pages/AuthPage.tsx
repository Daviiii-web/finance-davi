import { useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  signUp, signIn, signOut, requestPasswordReset, updatePassword,
  resendConfirmation, getAuthErrorMessage,
} from '../services/authService';
import Icon from '../components/Icon';

type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset';
interface AuthPageProps {
  themeControl: ReactNode;
  recovery?: boolean;
  recoveryUnavailable?: boolean;
  onRecoveryComplete: () => void;
}
const copy = {
  signin: { title: 'Bom ter você de volta.', subtitle: 'Entre para cuidar do que é seu.', button: 'Entrar na minha conta' },
  signup: { title: 'Seu próximo passo começa aqui.', subtitle: 'Crie sua conta e organize a sua vida financeira.', button: 'Criar minha conta' },
  forgot: { title: 'Vamos recuperar seu acesso.', subtitle: 'Enviaremos um link para você criar uma nova senha.', button: 'Enviar link de recuperação' },
  reset: { title: 'Uma nova senha, um novo começo.', subtitle: 'Escolha uma senha para voltar à sua conta.', button: 'Salvar nova senha' },
};

export default function AuthPage({ themeControl, recovery = false, recoveryUnavailable = false, onRecoveryComplete }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(recovery ? 'reset' : recoveryUnavailable ? 'forgot' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(recoveryUnavailable ? 'O link não iniciou uma sessão válida. Solicite um novo link de recuperação.' : '');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const busy = useRef(false);
  const needsConfirmation = mode === 'signup' || mode === 'reset';

  function changeMode(next: AuthMode) {
    if (busy.current) return;
    setMode(next);
    setPassword('');
    setConfirmation('');
    setShowPassword(false);
    setErrorMessage('');
    setSuccessMessage('');
    setConfirmationEmail('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    setErrorMessage('');
    setSuccessMessage('');
    if (needsConfirmation && password.length < 8) {
      setErrorMessage('Use pelo menos 8 caracteres na sua senha.');
      return;
    }
    if (needsConfirmation && password !== confirmation) {
      setErrorMessage('As senhas não coincidem. Confira a confirmação.');
      return;
    }

    busy.current = true;
    setIsLoading(true);
    try {
      const address = email.trim();
      if (mode === 'signin') {
        await signIn(address, password);
      } else if (mode === 'signup') {
        const data = await signUp(address, password);
        if (!data.session) {
          setConfirmationEmail(address);
          setSuccessMessage('Confira seu e-mail para concluir o cadastro. Se você já tem conta, use a opção Entrar.');
        }
      } else if (mode === 'forgot') {
        await requestPasswordReset(address);
        setSuccessMessage('Se houver uma conta com esse e-mail, você receberá um link para redefinir a senha. Confira também o spam.');
      } else {
        await updatePassword(password);
        setPasswordUpdated(true);
        setSuccessMessage('Senha atualizada! Você já pode continuar para sua conta.');
      }
      setPassword('');
      setConfirmation('');
    } catch (error: unknown) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      busy.current = false;
      setIsLoading(false);
    }
  }

  async function handleResend() {
    if (busy.current || !confirmationEmail) return;
    busy.current = true;
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await resendConfirmation(confirmationEmail);
      setSuccessMessage('Se a confirmação estiver pendente, um novo link será enviado. Confira seu e-mail.');
    } catch (error: unknown) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      busy.current = false;
      setIsLoading(false);
    }
  }

  async function cancelRecovery() {
    if (busy.current) return;
    busy.current = true;
    setIsLoading(true);
    setErrorMessage('');
    try {
      await signOut();
      onRecoveryComplete();
    } catch (error: unknown) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      busy.current = false;
      setIsLoading(false);
    }
  }

  return <main className="auth-shell">
    <section className="auth-story" aria-label="Sobre o Poupaê">
      <div className="brand auth-brand"><span className="brand-mark"><Icon name="wallet" size={25} /></span><span>Poupaê<span className="brand-subtitle">Seu dinheiro, de perto.</span></span></div>
      <div className="auth-story-content">
        <span className="auth-story-tag"><Icon name="leaf" size={16} /> MAIS CLAREZA. MAIS TRANQUILIDADE.</span>
        <h1>Pequenos hábitos.<br />Grandes <em>possibilidades.</em></h1>
        <p>Entenda para onde seu dinheiro vai e abra espaço para o que realmente importa.</p>
        <div className="auth-illustration" aria-hidden="true">
          <div className="auth-illustration-heading"><span>Um passo de cada vez</span><Icon name="chart" /></div>
          <div className="auth-bars">{[24, 39, 32, 56, 49, 72, 88].map((height, index) => <span key={index} style={{ height: height + '%' }} />)}</div>
          <div className="auth-illustration-caption"><Icon name="leaf" size={16} /><span>Mais consciência em cada escolha.</span></div>
        </div>
      </div>
      <p className="auth-story-footer">Finanças pessoais, de um jeito mais leve.</p>
    </section>
    <section className="auth-main" aria-label="Acesso à conta">
      <header className="auth-topbar"><span className="auth-mobile-brand"><Icon name="wallet" />Poupaê</span>{themeControl}</header>
      <div className="auth-card">
        <span className="auth-heading-icon"><Icon name={mode === 'forgot' || mode === 'reset' ? 'lock' : 'wallet'} size={24} /></span>
        <p className="eyebrow">SEU ESPAÇO NO POUPAÊ</p>
        <h2>{copy[mode].title}</h2><p className="auth-subtitle">{copy[mode].subtitle}</p>
        {(mode === 'signin' || mode === 'signup') && <div className="segmented auth-tabs" aria-label="Escolher acesso">
          <button type="button" aria-pressed={mode === 'signin'} disabled={isLoading} className={mode === 'signin' ? 'selected' : ''} onClick={() => changeMode('signin')}>Entrar</button>
          <button type="button" aria-pressed={mode === 'signup'} disabled={isLoading} className={mode === 'signup' ? 'selected' : ''} onClick={() => changeMode('signup')}>Criar conta</button>
        </div>}
        <form onSubmit={handleSubmit} aria-busy={isLoading}>
          {!passwordUpdated && <>
            {mode !== 'reset' && <><label className="form-label" htmlFor="auth-email">E-mail</label><input className="form-input" id="auth-email" type="email" placeholder="voce@exemplo.com" autoComplete="email" autoCapitalize="none" spellCheck={false} required disabled={isLoading} value={email} onChange={e => setEmail(e.target.value)} /></>}
            {mode !== 'forgot' && <>
              <div className="auth-label-row"><label className="form-label" htmlFor="auth-password">{mode === 'reset' ? 'Nova senha' : 'Senha'}</label>
                {mode === 'signin' && <button className="text-button" type="button" disabled={isLoading} onClick={() => changeMode('forgot')}>Esqueci minha senha</button>}
              </div>
              <div className="password-field"><input className="form-input" id="auth-password" type={showPassword ? 'text' : 'password'} placeholder={needsConfirmation ? 'Pelo menos 8 caracteres' : 'Sua senha'} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} required disabled={isLoading} value={password} aria-describedby={needsConfirmation ? 'password-hint' : undefined} onChange={e => setPassword(e.target.value)} /><button type="button" className="icon-button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword} disabled={isLoading} onClick={() => setShowPassword(current => !current)}><Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} /></button></div>
              {needsConfirmation && <><p id="password-hint" className="auth-hint">Use 8 ou mais caracteres. Combine letras, números e símbolos.</p><label className="form-label" htmlFor="auth-confirmation">Confirmar senha</label><input className="form-input" id="auth-confirmation" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required disabled={isLoading} placeholder="Repita sua senha" value={confirmation} onChange={e => setConfirmation(e.target.value)} /></>}
            </>}
          </>}
          {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
          {successMessage && <p className="auth-success" role="status"><Icon name="check" size={18} /><span>{successMessage}</span></p>}
          {passwordUpdated ? <button type="button" className="button primary auth-submit" onClick={onRecoveryComplete}>Continuar para minha conta<Icon name="chevron" size={17} /></button>
            : <button className="button primary auth-submit" type="submit" disabled={isLoading}>{isLoading ? 'Aguarde...' : copy[mode].button}{!isLoading && <Icon name="chevron" size={17} />}</button>}
        </form>
        {confirmationEmail && <button type="button" className="text-button auth-back" disabled={isLoading} onClick={handleResend}>Reenviar confirmação de e-mail</button>}
        {mode === 'forgot' && <button type="button" className="text-button auth-back" disabled={isLoading} onClick={() => { onRecoveryComplete(); changeMode('signin'); }}>Voltar para entrar</button>}
        {mode === 'reset' && !passwordUpdated && <button type="button" className="text-button auth-back" disabled={isLoading} onClick={cancelRecovery}>Cancelar e sair</button>}
        {mode === 'signin' && <p className="auth-switch">Ainda não tem uma conta? <button type="button" disabled={isLoading} onClick={() => changeMode('signup')}>Comece por aqui</button></p>}
        {mode === 'signup' && <p className="auth-switch">Já tem uma conta? <button type="button" disabled={isLoading} onClick={() => changeMode('signin')}>Entre no Poupaê</button></p>}
        <p className="auth-security"><Icon name="shield" size={16} />Seu espaço para cuidar das suas finanças.</p>
      </div>
      <footer className="auth-footer">Poupaê · Um passo de cada vez.</footer>
    </section>
  </main>;
}
