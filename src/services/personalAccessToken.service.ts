let inMemoryToken: string | null = null;

export function getPersonalAccessToken(): string | null {
  return inMemoryToken;
}

export function setPersonalAccessToken(token: string | null) {
  inMemoryToken = token;
}

export function clearPersonalAccessToken() {
  setPersonalAccessToken(null);
}
