// src/utils/axios.js
import axios from 'axios';
import { CONFIG } from 'src/config-global';
import { STORAGE_KEY } from 'src/auth/context/jwt/constant';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: CONFIG.serverUrl });

// Ajouter un intercepteur pour les requêtes
axiosInstance.interceptors.request.use(
  (config) => {
    // Récupérer le token depuis le cookie ou sessionStorage
    const getCookie = (name) => {
      const nameWithEqualSign = `${name}=`;
      const cookies = document.cookie.split(';');
      
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.indexOf(nameWithEqualSign) === 0) {
          return decodeURIComponent(cookie.substring(nameWithEqualSign.length, cookie.length));
        }
      }
      return null;
    };

    // Essayer d'abord de récupérer le token depuis le cookie, puis depuis sessionStorage
    const token = getCookie(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response && error.response.data;
    // On conserve toujours le status HTTP pour permettre aux vues de détecter les 404,
    if (data && typeof data === 'object') {
      // eslint-disable-next-line prefer-promise-reject-errors -- convention app : on rejette le corps de réponse, pas une Error
      return Promise.reject({ ...data, status: error.response.status });
    }
    // eslint-disable-next-line prefer-promise-reject-errors -- convention app : on rejette le corps de réponse, pas une Error
    return Promise.reject({ status: error.response.status, message: data || 'Something went wrong!' });
  }
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args) => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args];

    const res = await axiosInstance.get(url, { ...config });

    return res.data;
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

export const endpoints = {
  auth: {
    me: '/api/auth/me',
    signIn: '/api/auth/sign-in',
    signUp: '/api/auth/sign-up',
  },
};