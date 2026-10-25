import { useEffect, useState } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { authRedirect, supabase } from '../lib/supabase';

const RECOVERY_KEY = 'poupae:password-recovery';

function clearRecovery() {
  try { sessionStorage.removeItem(RECOVERY_KEY); } catch {}
}

function rememberRecovery(session: Session) {
  try {
    sessionStorage.setItem(RECOVERY_KEY, JSON.stringify({
      userId: session.user.id,
      expiresAt: Date.now() + 15 * 60 * 1000,
    }));
  } catch {}
}

function hasRecoveryMarker(session: Session): boolean {
  try {
    const marker: unknown = JSON.parse(sessionStorage.getItem(RECOVERY_KEY) || 'null');
    return Boolean(marker && typeof marker === 'object' &&
      'userId' in marker && marker.userId === session.user.id &&
      'expiresAt' in marker && typeof marker.expiresAt === 'number' && marker.expiresAt > Date.now());
  } catch { return false; }
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryUnavailable, setRecoveryUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    let authChanged = false;
    let initialResolved = false;

    function applySession(event: AuthChangeEvent, nextSession: Session | null) {
      if (!active) return;
      setSession(nextSession);
      setIsLoading(false);
      setError(null);

      if (!initialResolved) {
        initialResolved = true;
        if (authRedirect.recoveryRequested) {
          const validRecovery = !authRedirect.hasError && nextSession !== null &&
            (event === 'PASSWORD_RECOVERY' ||
              (authRedirect.accessToken !== null
                ? authRedirect.accessToken === nextSession.access_token
                : hasRecoveryMarker(nextSession)));
          setIsRecovering(validRecovery);
          setRecoveryUnavailable(!validRecovery);
          if (validRecovery && nextSession) rememberRecovery(nextSession);
          else clearRecovery();
          return;
        }
      }
      if (event === 'PASSWORD_RECOVERY' && nextSession) {
        rememberRecovery(nextSession);
        setIsRecovering(true);
        setRecoveryUnavailable(false);
      }
      if (event === 'SIGNED_OUT') {
        clearRecovery();
        setIsRecovering(false);
        setRecoveryUnavailable(false);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      authChanged = true;
      applySession(event, nextSession);
    });

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active || authChanged) return;
      if (sessionError) {
        setError('Não foi possível verificar sua sessão. Confira sua conexão e tente novamente.');
        setIsLoading(false);
      } else {
        applySession('INITIAL_SESSION', data.session);
      }
    }).catch(() => {
      if (!active || authChanged) return;
      setError('Não foi possível verificar sua sessão. Confira sua conexão e tente novamente.');
      setIsLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  function finishRecovery() {
    clearRecovery();
    const url = new URL(window.location.href);
    url.searchParams.delete('auth');
    url.searchParams.delete('error');
    url.searchParams.delete('error_code');
    url.searchParams.delete('error_description');
    url.hash = '';
    window.history.replaceState(null, '', url.pathname + url.search);
    setIsRecovering(false);
    setRecoveryUnavailable(false);
  }

  return { session, isLoading, error, isRecovering, recoveryUnavailable, finishRecovery };
}
