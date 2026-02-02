import type {ExtensionConfig, XkpasswdConfig} from '../../core/config';
import {calculateStrength} from '../../core/strength';

// ===== DOM Elements =====
const elements = {
  // Header
  openOptionsBtn: document.querySelector<HTMLButtonElement>('#open-options')!,

  // Preset
  presetSelect: document.querySelector<HTMLSelectElement>('#preset')!,
  presetDescription: document.querySelector<HTMLParagraphElement>('#preset-description')!,

  // Quick options
  numPasswordsInput: document.querySelector<HTMLInputElement>('#num-passwords')!,
  numWordsInput: document.querySelector<HTMLInputElement>('#num-words')!,

  // Generate
  generateBtn: document.querySelector<HTMLButtonElement>('#generate')!,

  // Results
  emptyState: document.querySelector<HTMLDivElement>('#empty-state')!,
  passwordList: document.querySelector<HTMLUListElement>('#password-list')!,
  copyAllBtn: document.querySelector<HTMLButtonElement>('#copy-all')!,

  // Strength Indicator
  strengthIndicator: document.querySelector<HTMLDivElement>('#strength-indicator')!,
  strengthLabel: document.querySelector<HTMLSpanElement>('#strength-label')!,
  strengthBarFill: document.querySelector<HTMLDivElement>('#strength-bar-fill')!,
  entropyDisplay: document.querySelector<HTMLSpanElement>('#entropy-display')!,
  crackTimeDisplay: document.querySelector<HTMLSpanElement>('#crack-time')!,

  validationMessage: document.querySelector<HTMLDivElement>('#validation')!,

  // Toast
  toast: document.querySelector<HTMLDivElement>('#toast')!,
};

// Verify all elements exist
Object.entries(elements).forEach(([key, element]) => {
  if (!element) {
    throw new Error(`Required element not found: ${key}`);
  }
});

// ===== State =====
let currentConfig: ExtensionConfig | null = null;
const presetDescriptions = new Map<string, string>();
let generatedPasswords: string[] = [];

// ===== Utility Functions =====
async function sendMessage<T>(type: string, payload?: Record<string, unknown>): Promise<T> {
  try {
    const response = await chrome.runtime.sendMessage({type, ...payload});
    if (response && response.error) {
      throw new Error(response.error);
    }
    return response;
  } catch (error) {
    console.error(`Message error (${type}):`, error);
    throw error;
  }
}

function showToast(message: string, duration = 1500) {
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  setTimeout(() => {
    elements.toast.hidden = true;
  }, duration);
}

function showError(message: string) {
  elements.validationMessage.textContent = message;
  elements.validationMessage.hidden = false;
  setTimeout(() => {
    elements.validationMessage.hidden = true;
  }, 5000);
}

// ===== UI Updates =====
function updateStrengthIndicator(passwords: string[]) {
  if (passwords.length === 0) {
    elements.strengthIndicator.hidden = true;
    return;
  }

  // Calculate strength of the first password
  const password = passwords[0];
  const strength = calculateStrength(password);

  // Update label
  elements.strengthLabel.textContent = strength.label;
  elements.strengthLabel.className = `strength-indicator__value strength-indicator__value--${strength.label.toLowerCase()}`;

  // Update bar
  elements.strengthBarFill.className = `strength-indicator__fill strength-indicator__fill--${strength.label.toLowerCase()}`;

  // Update details
  elements.entropyDisplay.textContent = `${strength.entropy} bits of entropy`;
  elements.crackTimeDisplay.textContent = `Time to crack: ${strength.crackTime}`;

  elements.strengthIndicator.hidden = false;
}

function renderPasswords(passwords: string[]) {
  elements.passwordList.innerHTML = '';
  generatedPasswords = passwords;

  if (passwords.length === 0) {
    elements.emptyState.hidden = false;
    elements.passwordList.hidden = true;
    elements.copyAllBtn.hidden = true;
    elements.strengthIndicator.hidden = true;
    return;
  }

  elements.emptyState.hidden = true;
  elements.passwordList.hidden = false;
  elements.copyAllBtn.hidden = false;

  passwords.forEach((password, index) => {
    const item = document.createElement('li');
    item.className = 'password-item';

    const text = document.createElement('span');
    text.className = 'password-text';
    text.textContent = password;

    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.textContent = 'Copy';
    copyButton.setAttribute('aria-label', `Copy password ${index + 1}`);
    copyButton.addEventListener('click', async () => {
      await navigator.clipboard.writeText(password);
      showToast('Copied to clipboard');
    });

    item.append(text, copyButton);
    elements.passwordList.appendChild(item);
  });

  // Update strength indicator
  updateStrengthIndicator(passwords);
}

// ===== Data Operations =====
async function loadPresets() {
  try {
    const response = await sendMessage<{
      builtIn: Array<{id: string; name: string; description: string}>;
      custom: Array<{id: string; name: string; description: string}>;
      activePresetId: string;
    }>('GET_PRESETS');

    if (!response) {
      throw new Error('No response from background script');
    }

    elements.presetSelect.innerHTML = '';
    presetDescriptions.clear();

    // Built-in presets
    const builtinGroup = document.createElement('optgroup');
    builtinGroup.label = 'Built-in';
    response.builtIn.forEach((preset) => {
      const option = document.createElement('option');
      option.value = preset.id;
      option.textContent = preset.name;
      builtinGroup.appendChild(option);
      presetDescriptions.set(preset.id, preset.description);
    });
    elements.presetSelect.appendChild(builtinGroup);

    // Custom presets
    if (response.custom && response.custom.length > 0) {
      const customGroup = document.createElement('optgroup');
      customGroup.label = 'Custom';
      response.custom.forEach((preset) => {
        const option = document.createElement('option');
        option.value = preset.id;
        option.textContent = preset.name;
        customGroup.appendChild(option);
        presetDescriptions.set(preset.id, preset.description);
      });
      elements.presetSelect.appendChild(customGroup);
    }

    elements.presetSelect.value = response.activePresetId;
    elements.presetDescription.textContent = presetDescriptions.get(response.activePresetId) ?? '';
  } catch (error) {
    console.error('Error loading presets:', error);
    showError('Failed to load presets. Please reload the extension.');
  }
}

async function generate() {
  try {
    const response = await sendMessage<{passwords: string[]}>('GENERATE');
    if (!response || !response.passwords) {
      throw new Error('No passwords generated');
    }
    renderPasswords(response.passwords);
  } catch (error) {
    console.error('Error generating passwords:', error);
    showError('Failed to generate passwords. Please check your settings.');
  }
}

async function saveQuickSettings() {
  if (!currentConfig) return;

  try {
    const updated: ExtensionConfig = {
      ...currentConfig,
      numPasswords: parseInt(elements.numPasswordsInput.value) || 3,
      customConfig: {
        ...currentConfig.customConfig,
        num_words: parseInt(elements.numWordsInput.value) || 3,
      },
    };

    const result = await sendMessage<{config: ExtensionConfig}>('SET_CONFIG', {config: updated});
    if (!result || !result.config) {
      throw new Error('Failed to save settings');
    }
    currentConfig = result.config;
  } catch (error) {
    console.error('Error saving quick settings:', error);
    showError('Failed to save settings.');
  }
}

// ===== Event Handlers =====
elements.openOptionsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

elements.generateBtn.addEventListener('click', generate);

elements.copyAllBtn.addEventListener('click', async () => {
  await navigator.clipboard.writeText(generatedPasswords.join('\n'));
  showToast('All passwords copied');
});

elements.presetSelect.addEventListener('change', async () => {
  if (!currentConfig) return;

  try {
    const updated: ExtensionConfig = {
      ...currentConfig,
      activePresetId: elements.presetSelect.value,
    };

    const result = await sendMessage<{config: ExtensionConfig}>('SET_CONFIG', {config: updated});
    if (!result || !result.config) {
      throw new Error('Failed to update preset');
    }
    currentConfig = result.config;

    // Update description
    elements.presetDescription.textContent = presetDescriptions.get(result.config.activePresetId) ?? '';

    // Reload config to get preset values
    const configResponse = await sendMessage<{
      config: ExtensionConfig;
      activeConfig: XkpasswdConfig;
    }>('GET_CONFIG');

    if (configResponse) {
      currentConfig = configResponse.config;
      // Update quick options with preset values
      elements.numPasswordsInput.value = String(configResponse.config.numPasswords);
      elements.numWordsInput.value = String(configResponse.activeConfig.num_words);
    }

    // Auto-generate with new preset
    await generate();
  } catch (error) {
    console.error('Error changing preset:', error);
    showError('Failed to change preset.');
  }
});

elements.numPasswordsInput.addEventListener('change', async () => {
  await saveQuickSettings();
});

elements.numWordsInput.addEventListener('change', async () => {
  await saveQuickSettings();
});

// ===== Initialization =====
async function initialize() {
  try {
    // Load config first
    const response = await sendMessage<{
      config: ExtensionConfig;
      activeConfig: XkpasswdConfig;
      validation: {ok: boolean; errors: string[]};
    }>('GET_CONFIG');

    if (!response || !response.config) {
      throw new Error('Failed to load config');
    }

    currentConfig = response.config;

    // Update quick options
    elements.numPasswordsInput.value = String(response.config.numPasswords);
    elements.numWordsInput.value = String(response.activeConfig.num_words);

    // Then load presets
    await loadPresets();

    // Finally generate passwords
    await generate();
  } catch (error) {
    console.error('Error initializing popup:', error);
    showError('Failed to initialize. Please reload the extension.');
  }
}

// Start the app
void initialize();
