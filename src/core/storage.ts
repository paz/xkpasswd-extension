import {DEFAULT_CONFIG, ExtensionConfig, mergeConfig} from './config';

function getExtensionApi() {
  return (globalThis as typeof globalThis & {browser?: any; chrome?: any}).browser ??
    (globalThis as typeof globalThis & {chrome?: any}).chrome;
}

function getStorageArea() {
  const api = getExtensionApi();
  if (!api?.storage) {
    throw new Error('Storage API unavailable');
  }
  return api.storage.sync ?? api.storage.local;
}

export async function loadConfig(): Promise<ExtensionConfig> {
  const storage = getStorageArea();
  const result = await storage.get('config');
  return mergeConfig(result?.config ?? {});
}

export async function saveConfig(config: ExtensionConfig): Promise<void> {
  const storage = getStorageArea();
  await storage.set({config});
}

export async function resetConfig(): Promise<ExtensionConfig> {
  const storage = getStorageArea();
  await storage.set({config: DEFAULT_CONFIG});
  return DEFAULT_CONFIG;
}
