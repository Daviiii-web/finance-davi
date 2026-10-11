import { supabase } from '../lib/supabase';

function appUrl(recovery = false): string {
  const url = new URL(window.location.pathname, window.location.origin);
  if (recovery) url.searchParams.set('auth', 'recovery');
  return url.toString();
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: appUrl() },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: appUrl(true),
  });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function resendConfirmation(email: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup', email, options: { emailRedirectTo: appUrl() },
  });
  if (error) throw error;
}

// Keep provider-specific error codes out of the interface.
export function getAuthErrorMessage(error: unknown): string {
  const messages: Record<string, string> = {
    invalid_credentials: 'E-mail ou senha incorretos. Confira os dados e tente novamente.',
    email_not_confirmed: 'Confirme seu e-mail antes de entrar. Confira também a pasta de spam.',
    user_already_exists: 'Não foi possível criar a conta. Tente entrar ou recuperar sua senha.',
    email_exists: 'Não foi possível criar a conta. Tente entrar ou recuperar sua senha.',
    weak_password: 'Escolha uma senha mais forte, com pelo menos 8 caracteres.',
    same_password: 'A nova senha precisa ser diferente da senha atual.',
    over_email_send_rate_limit: 'Muitos e-mails solicitados. Aguarde alguns minutos e tente novamente.',
    over_request_rate_limit: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    email_address_invalid: 'Confira se o endereço de e-mail está correto.',
    email_address_not_authorized: 'O envio para este e-mail está indisponível no momento. Entre em contato com o suporte do Poupaê.',
    signup_disabled: 'O cadastro está temporariamente indisponível.',
    otp_expired: 'Este link expirou ou já foi usado. Solicite um novo e-mail.',
    session_not_found: 'Sua sessão expirou. Entre novamente ou solicite outro link.',
    reauthentication_needed: 'Por segurança, entre novamente antes de alterar sua senha.',
  };
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    if (messages[error.code]) return messages[error.code];
  }
  if (error instanceof TypeError || (error instanceof Error && error.name === 'AuthRetryableFetchError')) {
    return 'Não foi possível conectar. Confira sua internet e tente novamente.';
  }
  return 'Não foi possível concluir a operação. Tente novamente em instantes.';
}
