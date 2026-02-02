import {mergeConfig} from '../core/config';
import {generatePasswords, getBuiltinPresets, getDictionaries, resolveActiveConfig, validateCfg} from '../core/generator';
import {loadConfig, resetConfig, saveConfig} from '../core/storage';

const extensionApi = (globalThis as typeof globalThis & {browser?: any; chrome?: any}).browser ??
  (globalThis as typeof globalThis & {chrome?: any}).chrome;

if (extensionApi?.contextMenus) {
  extensionApi.runtime.onInstalled.addListener(() => {
    extensionApi.contextMenus.create({
      id: 'xkpasswd-insert',
      title: 'Insert XKPasswd password',
      contexts: ['editable'],
    });
  });

  extensionApi.contextMenus.onClicked.addListener(async (info: any, tab: any) => {
    if (info.menuItemId !== 'xkpasswd-insert') {
      return;
    }
    const config = await loadConfig();
    if (!config.enableInsertion) {
      return;
    }
    const passwords = await generatePasswords({...config, numPasswords: 1});
    if (tab?.id) {
      extensionApi.tabs.sendMessage(tab.id, {type: 'INSERT', text: passwords[0]});
    }
  });
}

extensionApi.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
  handleMessage(message)
    .then(sendResponse)
    .catch((error) => {
      console.error('Error handling message:', error);
      sendResponse({error: error.message || 'Unknown error'});
    });
  return true; // Indicates we will respond asynchronously
});

async function handleMessage(message: any) {
  try {
    switch (message?.type) {
      case 'GENERATE': {
        const config = await loadConfig();
        const passwords = await generatePasswords(config);
        return {passwords};
      }
      case 'GET_CONFIG': {
        const config = await loadConfig();
        return {
          config,
          activeConfig: resolveActiveConfig(config),
          validation: validateCfg(resolveActiveConfig(config)),
        };
      }
      case 'SET_CONFIG': {
        const merged = mergeConfig(message.config);
        await saveConfig(merged);
        return {config: merged};
      }
      case 'RESET_CONFIG': {
        const config = await resetConfig();
        return {config, activeConfig: resolveActiveConfig(config)};
      }
      case 'GET_PRESETS': {
        const config = await loadConfig();
        return {
          builtIn: getBuiltinPresets(),
          custom: config.customPresets,
          activePresetId: config.activePresetId,
        };
      }
      case 'GET_DICTIONARIES': {
        return {dictionaries: getDictionaries()};
      }
      default:
        return {error: 'Unknown message type'};
    }
  } catch (error) {
    console.error('Error in handleMessage:', error);
    throw error;
  }
}
