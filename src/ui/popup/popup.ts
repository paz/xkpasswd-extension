import type {ExtensionConfig} from '../../core/config';

const numPasswordsInput = document.querySelector<HTMLInputElement>('#num-passwords');
const numWordsInput = document.querySelector<HTMLInputElement>('#num-words');
const separatorInput = document.querySelector<HTMLInputElement>('#separator');
const presetSelect = document.querySelector<HTMLSelectElement>('#preset');
const generateButton = document.querySelector<HTMLButtonElement>('#generate');
const copyAllButton = document.querySelector<HTMLButtonElement>('#copy-all');
const passwordList = document.querySelector<HTMLUListElement>('#password-list');
const toast = document.querySelector<HTMLDivElement>('#toast');
const optionsButton = document.querySelector<HTMLButtonElement>('#open-options');

if (!numPasswordsInput || !numWordsInput || !separatorInput || !presetSelect || !generateButton || !copyAllButton || !passwordList || !toast || !optionsButton) {
  throw new Error('Popup elements missing');
}

const runtime = chrome.runtime;

async function sendMessage<T>(type: string, payload?: Record<string, unknown>): Promise<T> {
  return runtime.sendMessage({type, ...payload});
}

let currentConfig: ExtensionConfig | null = null;

function showToast(message: string) {
  toast.textContent = message;
  toast.hidden = false;
  window.setTimeout(() => {
    toast.hidden = true;
  }, 1500);
}

function renderPasswords(passwords: string[]) {
  passwordList.innerHTML = '';
  passwords.forEach(password => {
    const item = document.createElement('li');
    item.className = 'password-item';

    const text = document.createElement('span');
    text.className = 'password-text';
    text.textContent = password;

    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.textContent = 'Copy';
    copyButton.addEventListener('click', async () => {
      await navigator.clipboard.writeText(password);
      showToast('Copied');
    });

    item.append(text, copyButton);
    passwordList.appendChild(item);
  });
}

function updateInputsFromConfig(config: ExtensionConfig, activeConfig: any) {
  numPasswordsInput.value = String(config.numPasswords);
  numWordsInput.value = String(activeConfig.num_words ?? config.customConfig.num_words);
  if (activeConfig.separator_type === 'FIXED') {
    separatorInput.value = activeConfig.separator_character ?? '';
  } else {
    separatorInput.value = '';
  }
  presetSelect.value = config.activePresetId;
}

async function loadPresets() {
  const response = await sendMessage<{builtIn: Array<{id: string; name: string}>; custom: Array<{id: string; name: string}>; activePresetId: string}>('GET_PRESETS');
  presetSelect.innerHTML = '';

  const builtinGroup = document.createElement('optgroup');
  builtinGroup.label = 'Built-in';
  response.builtIn.forEach(preset => {
    const option = document.createElement('option');
    option.value = preset.id;
    option.textContent = preset.name;
    builtinGroup.appendChild(option);
  });
  presetSelect.appendChild(builtinGroup);

  const customGroup = document.createElement('optgroup');
  customGroup.label = 'Custom';
  response.custom.forEach(preset => {
    const option = document.createElement('option');
    option.value = preset.id;
    option.textContent = preset.name;
    customGroup.appendChild(option);
  });
  const customOption = document.createElement('option');
  customOption.value = 'CUSTOM';
  customOption.textContent = 'Custom (unsaved)';
  customGroup.appendChild(customOption);
  presetSelect.appendChild(customGroup);

  presetSelect.value = response.activePresetId;
}

async function refreshConfig() {
  const response = await sendMessage<{config: ExtensionConfig; activeConfig: any}>('GET_CONFIG');
  currentConfig = response.config;
  updateInputsFromConfig(response.config, response.activeConfig);
}

async function saveQuickSettings() {
  if (!currentConfig) {
    return;
  }
  const updated: ExtensionConfig = {
    ...currentConfig,
    numPasswords: Number(numPasswordsInput.value) || 1,
  };

  const updatedCustom = {
    ...updated.customConfig,
    num_words: Number(numWordsInput.value) || updated.customConfig.num_words,
  };

  if (separatorInput.value.trim().length > 0) {
    updatedCustom.separator_type = 'FIXED';
    updatedCustom.separator_character = separatorInput.value.trim().slice(0, 1);
  } else {
    updatedCustom.separator_type = 'RANDOM';
    updatedCustom.separator_character = '';
  }

  updated.customConfig = updatedCustom;
  if (updated.activePresetId !== 'CUSTOM') {
    updated.activePresetId = 'CUSTOM';
  }

  const result = await sendMessage<{config: ExtensionConfig}>('SET_CONFIG', {config: updated});
  currentConfig = result.config;
}

async function generate() {
  const response = await sendMessage<{passwords: string[]}>('GENERATE');
  renderPasswords(response.passwords);
}

numPasswordsInput.addEventListener('change', async () => {
  await saveQuickSettings();
});

numWordsInput.addEventListener('change', async () => {
  await saveQuickSettings();
});

separatorInput.addEventListener('change', async () => {
  await saveQuickSettings();
});

presetSelect.addEventListener('change', async () => {
  if (!currentConfig) {
    return;
  }
  const updated: ExtensionConfig = {
    ...currentConfig,
    activePresetId: presetSelect.value,
  };
  const result = await sendMessage<{config: ExtensionConfig}>('SET_CONFIG', {config: updated});
  currentConfig = result.config;
  await refreshConfig();
});

generateButton.addEventListener('click', generate);

copyAllButton.addEventListener('click', async () => {
  const passwords = Array.from(passwordList.querySelectorAll('.password-text')).map(node => node.textContent ?? '');
  await navigator.clipboard.writeText(passwords.join('\n'));
  showToast('Copied all');
});

optionsButton.addEventListener('click', () => {
  runtime.openOptionsPage();
});

await loadPresets();
await refreshConfig();
await generate();
