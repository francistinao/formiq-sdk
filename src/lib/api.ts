import axios from 'axios';

import { getPersonalAccessToken } from '../services/personalAccessToken.service';
import { getApiBaseUrl } from './sdkConfig';

export function createApi(getToken?: () => string | null) {
  const baseURL = getApiBaseUrl() ?? 'http://localhost:3000/api/external';
  const api = axios.create({
    baseURL,
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
