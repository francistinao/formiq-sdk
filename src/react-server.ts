const serverOnlyMessage =
  '@francistinao/formiq-sdk components must be used in a Client Component. ' +
  'Move usage to a client-only file or dynamically import with ssr: false.';

function serverOnly(): never {
  throw new Error(serverOnlyMessage);
}

export function BoardEditor() {
  return serverOnly();
}

export function FormiqProvider() {
  return serverOnly();
}

export function useBoardEditor() {
  return serverOnly();
}

export function useCanvasElement() {
  return serverOnly();
}

export function useProduce() {
  return serverOnly();
}

export function useBoardCanvas() {
  return serverOnly();
}

export function useValidatePat() {
  return serverOnly();
}

export function useCanvasStore() {
  return serverOnly();
}

export function setApiBaseUrl() {
  return serverOnly();
}

export function getApiBaseUrl() {
  return serverOnly();
}

export function getPersonalAccessToken() {
  return serverOnly();
}

export function setPersonalAccessToken() {
  return serverOnly();
}

export function clearPersonalAccessToken() {
  return serverOnly();
}
