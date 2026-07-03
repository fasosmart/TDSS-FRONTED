// src/auth/context/jwt/utils.js

import { paths } from 'src/routes/paths';

import axios from 'src/utils/axios';

import { STORAGE_KEY } from './constant';
import { STORAGE_KEY_REFRESH_TOKEN } from './constant';

// ----------------------------------------------------------------------

export function jwtDecode(token) {
  try {
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length < 2) {
      throw new Error('Invalid token!');
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));

    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export function isValidToken(access_token) {
  if (!access_token) {
    return false;
  }

  try {
    const decoded = jwtDecode(access_token);

    if (!decoded || !('exp' in decoded)) {
      return false;
    }

    const currentTime = Date.now() / 1000;

    return decoded.exp > currentTime;
  } catch (error) {
    console.error('Error during token validation:', error);
    return false;
  }
}

// ----------------------------------------------------------------------

export function tokenExpired(exp) {
  const currentTime = Date.now();
  const timeLeft = exp * 1000 - currentTime;

  if (timeLeft > 0) {
    setTimeout(() => {
      try {
        alert('Token expired!');
        sessionStorage.removeItem(STORAGE_KEY);
        window.location.href = paths.auth.jwt.signIn;
      } catch (error) {
        console.error('Error during token expiration:', error);
        throw error;
      }
    }, timeLeft);
  } else {
    alert('Token already expired!');
    sessionStorage.removeItem(STORAGE_KEY);
    window.location.href = paths.auth.jwt.signIn;
  }
}

// ----------------------------------------------------------------------

export async function setSession(access_token, refresh_token) {
  try {
    // Fonction pour définir un cookie avec expiration
    const setCookie = (name, value, days) => {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + days);
      // Secure uniquement en HTTPS pour ne pas casser le dev local en http.
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      const cookieValue = `${encodeURIComponent(value)}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Lax${secure}`;
      document.cookie = `${name}=${cookieValue}`;
    };

    // Fonction pour supprimer un cookie
    const deleteCookie = (name) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
    };

    // Store refresh token in cookie if it exists (7 days expiration)
    if (refresh_token) {
      setCookie(STORAGE_KEY_REFRESH_TOKEN, refresh_token, 7);
      // Garder aussi dans sessionStorage pour la compatibilité avec le code existant
      sessionStorage.setItem(STORAGE_KEY_REFRESH_TOKEN, refresh_token);
    }

    if (access_token) {
      // Storing access token in cookie (1 day expiration)
      setCookie(STORAGE_KEY, access_token, 1);
      // Garder aussi dans sessionStorage pour la compatibilité avec le code existant
      sessionStorage.setItem(STORAGE_KEY, access_token);

      // Set Authorization header for axios
      axios.defaults.headers.common.Authorization = `Bearer ${access_token}`;

      // Decode the access token to check its expiration
      const decodedToken = jwtDecode(access_token);

      if (decodedToken && 'exp' in decodedToken) {
        tokenExpired(decodedToken.exp); // Handle token expiration logic
      } else {
        throw new Error('Invalid access token!');
      }
    } else {
      // If no access token, remove tokens and clear Authorization header
      deleteCookie(STORAGE_KEY);
      deleteCookie(STORAGE_KEY_REFRESH_TOKEN);
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY_REFRESH_TOKEN);
      delete axios.defaults.headers.common.Authorization;
    }
  } catch (error) {
    console.error('Error during set session:', error);
    throw error;
  }
}
