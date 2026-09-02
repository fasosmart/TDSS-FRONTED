
// src/auth/context/jwt/auth-provider.jsx

'use client';

import { useMemo, useEffect, useCallback } from 'react';

import { useSetState } from 'src/hooks/use-set-state';

import API from 'src/utils/api';
import axios from 'src/utils/axios';

import { AuthContext } from '../auth-context';
import { STORAGE_KEY } from './constant';
import { setSession, isValidToken } from './utils';

// ----------------------------------------------------------------------

export function AuthProvider({ children }) {
  const { state, setState } = useSetState({
    user: null,
    loading: true,
  });

  // Fonction pour récupérer un cookie par son nom
  const getCookie = useCallback((name) => {
    const nameWithEqualSign = `${name}=`;
    const cookies = document.cookie.split(';');
    
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.indexOf(nameWithEqualSign) === 0) {
        return decodeURIComponent(cookie.substring(nameWithEqualSign.length, cookie.length));
      }
    }
    return null;
  }, []);

  const checkUserSession = useCallback(async () => {
    try {
      // Vérifier d'abord le cookie, puis le sessionStorage comme fallback
      let access_token = getCookie(STORAGE_KEY);
      
      if (!access_token) {
        access_token = sessionStorage.getItem(STORAGE_KEY);
      }

      if (access_token && isValidToken(access_token)) {
        setSession(access_token);

        const [meRes, assignmentsRes] = await Promise.all([
          axios.get(API.me()),
          axios.get(API.myAssignments()).catch((err) => {
            if (err?.response?.status !== 404) {
              console.error('my-assignments error:', err);
            }
            return null;
          }),
        ]);

        const permissions = assignmentsRes?.data ?? {};

        const user = { ...meRes.data, permissions };

        // Le state (et les permissions) est réhydraté à chaque montage via
        // /me + /my-assignments/ ; pas de persistance des permissions côté client.
        setState({ user: { ...user, access_token }, loading: false });

      } else {
        setState({ user: null, loading: false });
      }
    } catch (error) {
      console.error(error);
      setState({ user: null, loading: false });
    }
  }, [setState]);

  useEffect(() => {
    checkUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user ?? null,
      checkUserSession,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
    }),
    [checkUserSession, state.user, status]
  );

  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}
