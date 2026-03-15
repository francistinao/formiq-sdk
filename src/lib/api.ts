import axios from 'axios';

import { getPersonalAccessToken } from '../services/personalAccessToken.service';

export function createApi(getToken?: () => string | null) {
  const api = axios.create({
    baseURL: import.meta.env.VITE_PUBLIC_API_URL ?? 'http://localhost:3000/api/external',
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: false,
  });

  api.interceptors.request.use((config) => {
    const token = getToken?.();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  return api;
}

const api = createApi(getPersonalAccessToken);
export default api;
