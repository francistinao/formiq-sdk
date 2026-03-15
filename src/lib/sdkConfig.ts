let apiBaseUrl: string | null = null;

export function setApiBaseUrl(url?: string | null) {
  const next = (url ?? '').trim();
  apiBaseUrl = next.length ? next : null;
}

export function getApiBaseUrl() {
  return apiBaseUrl;
}
