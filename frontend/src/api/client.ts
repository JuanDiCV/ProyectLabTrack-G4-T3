import axios from 'axios';

export const TOKEN_STORAGE_KEY = 'labtrack.token';
export const USER_STORAGE_KEY = 'labtrack.user';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Si la sesión expiró (401 fuera del login), se limpia y se vuelve al login. */
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const isSessionError =
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !error.config?.url?.includes('/auth/login');
    if (isSessionError) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      window.location.assign('/login');
    }
    return Promise.reject(error);
  },
);
