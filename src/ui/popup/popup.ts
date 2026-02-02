import type {ExtensionConfig, XkpasswdConfig} from '../../core/config';
import {calculateStrength} from '../../core/strength';

// ===== DOM Elements =====
const elements = {
  // Header
  openOptionsBtn: document.querySelector<HTMLButtonElement>('#open-options')!,

  // Preset
  presetSelect: document.querySelector<HTMLSelectElement>('#preset')!,
  presetDescription: document.querySelector<HTMLParagraphElement>('#preset-description')!,

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

  // Settings
  toggleSettingsBtn: document.querySelector<HTMLButtonElement>('#toggle-settings')!,
  settingsPanel: document.querySelector<HTMLDivElement>('#settings-panel')!,

  // Form inputs
  numPasswordsInput: document.querySelector<HTMLInputElement>('#num-passwords')!,
  numWordsInput: document.querySelector<HTMLInputElement>('#num-words')!,
  wordMinInput: document.querySelector<HTMLInputElement>('#word-min')!,
  wordMaxInput: document.querySelector<HTMLInputElement>('#word-max')!,
  caseTransformSelect: document.querySelector<HTMLSelectElement>('#case-transform')!,
  allowAccentsInput: document.querySelector<HTMLInputElement>('#allow-accents')!,

  separatorTypeSelect: document.querySelector<HTMLSelectElement>('#separator-type')!,
  separatorCharacterInput: document.querySelector<HTMLInputElement>('#separator-character')!,
  separatorAlphabetInput: document.querySelector<HTMLInputElement>('#separator-alphabet')!,

  paddingTypeSelect: document.querySelector<HTMLSelectElement>('#padding-type')!,
  padLengthInput: document.querySelector<HTMLInputElement>('#pad-length')!,
  digitsBeforeInput: document.querySelector<HTMLInputElement>('#digits-before')!,
  digitsAfterInput: document.querySelector<HTMLInputElement>('#digits-after')!,
  paddingBeforeInput: document.querySelector<HTMLInputElement>('#padding-before')!,
  paddingAfterInput: document.querySelector<HTMLInputElement>('#padding-after')!,
  paddingCharTypeSelect: document.querySelector<HTMLSelectElement>('#padding-char-type')!,
  paddingCharInput: document.querySelector<HTMLInputElement>('#padding-char')!,
  paddingAlphabetInput: document.querySelector<HTMLInputElement>('#padding-alphabet')!,
  symbolAlphabetInput: document.querySelector<HTMLInputElement>('#symbol-alphabet')!,

  dictionarySelect: document.querySelector<HTMLSelectElement>('#dictionary')!,
  enableInsertionInput: document.querySelector<HTMLInputElement>('#enable-insertion')!,

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
let activeConfig: XkpasswdConfig | null = null;
const presetDescriptions = new Map<string, string>();
let generatedPasswords: string[] = [];

// ===== Utility Functions =====
async function sendMessage<T>(type: string, payload?: Record<string, unknown>): Promise<T> {
  return chrome.runtime.sendMessage({type, ...payload});
}

function showToast(message: string, duration = 1500) {
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  setTimeout(() => {
    elements.toast.hidden = true;
  }, duration);
}

function readNumber(input: HTMLInputElement, fallback: number): number {
  const value = Number(input.value);
  return Number.isNaN(value) ? fallback : value;
}

function readOptionalNumber(input: HTMLInputElement): number | undefined {
  const trimmed = input.value.trim();
  if (!trimmed) return undefined;
  const value = Number(trimmed);
  return Number.isNaN(value) ? undefined : value;
}

// ===== UI Updates =====
function updateConditionalVisibility() {
  const controlMap = new Map<string, HTMLSelectElement>();
  document.querySelectorAll<HTMLSelectElement>('[data-key]').forEach((control) => {
    const key = control.dataset.key;
    if (key) controlMap.set(key, control);
  });

  document.querySelectorAll<HTMLElement>('[data-show-when]').forEach((field) => {
    const rule = field.dataset.showWhen;
    if (!rule) return;

    const [key, expectedValue] = rule.split(':');
    const control = controlMap.get(key);
    if (!control) return;

    const shouldShow = control.value === expectedValue;
    field.hidden = !shouldShow;

    // Disable inputs in hidden fields
    field.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select').forEach((input) => {
      input.disabled = !shouldShow;
    });
  });
}

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

function updateFormFromConfig(config: ExtensionConfig, xkConfig: XkpasswdConfig) {
  elements.numPasswordsInput.value = String(config.numPasswords);
  elements.numWordsInput.value = String(xkConfig.num_words);
  elements.wordMinInput.value = String(xkConfig.word_length_min);
  elements.wordMaxInput.value = String(xkConfig.word_length_max);
  elements.caseTransformSelect.value = xkConfig.case_transform;
  elements.allowAccentsInput.checked = Boolean(xkConfig.allow_accents);

  elements.separatorTypeSelect.value = xkConfig.separator_type;
  elements.separatorCharacterInput.value = xkConfig.separator_character ?? '';
  elements.separatorAlphabetInput.value = xkConfig.separator_alphabet ?? '';

  elements.paddingTypeSelect.value = xkConfig.padding_type;
  elements.padLengthInput.value = xkConfig.pad_to_length ? String(xkConfig.pad_to_length) : '';
  elements.digitsBeforeInput.value = String(xkConfig.padding_digits_before);
  elements.digitsAfterInput.value = String(xkConfig.padding_digits_after);
  elements.paddingBeforeInput.value = String(xkConfig.padding_characters_before);
  elements.paddingAfterInput.value = String(xkConfig.padding_characters_after);
  elements.paddingCharTypeSelect.value = xkConfig.padding_character_type;
  elements.paddingCharInput.value = xkConfig.padding_character ?? '';
  elements.paddingAlphabetInput.value = xkConfig.padding_alphabet ?? '';
  elements.symbolAlphabetInput.value = xkConfig.symbol_alphabet ?? '';

  elements.dictionarySelect.value = config.dictionaryId;
  elements.enableInsertionInput.checked = config.enableInsertion;

  elements.presetSelect.value = config.activePresetId;
  elements.presetDescription.textContent = presetDescriptions.get(config.activePresetId) ?? '';

  updateConditionalVisibility();
}

// ===== Data Operations =====
async function loadPresets() {
  const response = await sendMessage<{
    builtIn: Array<{id: string; name: string; description: string}>;
    custom: Array<{id: string; name: string; description: string}>;
    activePresetId: string;
  }>('GET_PRESETS');

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
  const customGroup = document.createElement('optgroup');
  customGroup.label = 'Custom';
  response.custom.forEach((preset) => {
    const option = document.createElement('option');
    option.value = preset.id;
    option.textContent = preset.name;
    customGroup.appendChild(option);
    presetDescriptions.set(preset.id, preset.description);
  });
  const customOption = document.createElement('option');
  customOption.value = 'CUSTOM';
  customOption.textContent = 'Custom (unsaved)';
  customGroup.appendChild(customOption);
  presetDescriptions.set('CUSTOM', 'Your unsaved, in-progress configuration.');
  elements.presetSelect.appendChild(customGroup);

  elements.presetSelect.value = response.activePresetId;
  elements.presetDescription.textContent = presetDescriptions.get(response.activePresetId) ?? '';
}

async function loadDictionaries() {
  const response = await sendMessage<{dictionaries: Array<{id: string; name: string}>}>('GET_DICTIONARIES');
  elements.dictionarySelect.innerHTML = '';
  response.dictionaries.forEach((dictionary) => {
    const option = document.createElement('option');
    option.value = dictionary.id;
    option.textContent = dictionary.name;
    elements.dictionarySelect.appendChild(option);
  });
}

async function refreshConfig() {
  const response = await sendMessage<{
    config: ExtensionConfig;
    activeConfig: XkpasswdConfig;
    validation: {ok: boolean; errors: string[]};
  }>('GET_CONFIG');

  currentConfig = response.config;
  activeConfig = response.activeConfig;
  updateFormFromConfig(response.config, response.activeConfig);

  if (response.validation.ok) {
    elements.validationMessage.hidden = true;
  } else {
    elements.validationMessage.textContent = response.validation.errors.join(' ');
    elements.validationMessage.hidden = false;
  }
}

function buildCustomConfig(baseConfig: XkpasswdConfig): XkpasswdConfig {
  const separatorType = elements.separatorTypeSelect.value as XkpasswdConfig['separator_type'];
  const paddingType = elements.paddingTypeSelect.value as XkpasswdConfig['padding_type'];
  const paddingCharType = elements.paddingCharTypeSelect.value as XkpasswdConfig['padding_character_type'];

  return {
    ...baseConfig,
    num_words: readNumber(elements.numWordsInput, baseConfig.num_words),
    word_length_min: readNumber(elements.wordMinInput, baseConfig.word_length_min),
    word_length_max: readNumber(elements.wordMaxInput, baseConfig.word_length_max),
    case_transform: elements.caseTransformSelect.value as XkpasswdConfig['case_transform'],
    allow_accents: elements.allowAccentsInput.checked ? 1 : 0,

    separator_type: separatorType,
    separator_character: separatorType === 'FIXED' ? elements.separatorCharacterInput.value.trim().slice(0, 1) : '',
    separator_alphabet: separatorType === 'RANDOM' ? elements.separatorAlphabetInput.value.trim() : '',

    padding_type: paddingType,
    pad_to_length: paddingType === 'ADAPTIVE' ? readOptionalNumber(elements.padLengthInput) : undefined,
    padding_digits_before: readNumber(elements.digitsBeforeInput, baseConfig.padding_digits_before),
    padding_digits_after: readNumber(elements.digitsAfterInput, baseConfig.padding_digits_after),
    padding_characters_before: readNumber(elements.paddingBeforeInput, baseConfig.padding_characters_before),
    padding_characters_after: readNumber(elements.paddingAfterInput, baseConfig.padding_characters_after),
    padding_character_type: paddingCharType,
    padding_character: paddingCharType === 'FIXED' ? elements.paddingCharInput.value.trim().slice(0, 1) : '',
    padding_alphabet: paddingCharType === 'RANDOM' ? elements.paddingAlphabetInput.value.trim() : '',
    symbol_alphabet: elements.symbolAlphabetInput.value.trim(),
  };
}

async function saveSettings() {
  if (!currentConfig || !activeConfig) return;

  const updated: ExtensionConfig = {
    ...currentConfig,
    numPasswords: readNumber(elements.numPasswordsInput, 1),
    enableInsertion: elements.enableInsertionInput.checked,
    dictionaryId: elements.dictionarySelect.value,
    customConfig: buildCustomConfig(activeConfig),
    activePresetId: 'CUSTOM', // Always switch to custom when editing
  };

  const result = await sendMessage<{config: ExtensionConfig}>('SET_CONFIG', {config: updated});
  currentConfig = result.config;
  elements.presetSelect.value = result.config.activePresetId;
  elements.presetDescription.textContent = presetDescriptions.get(result.config.activePresetId) ?? '';
}

async function generate() {
  const response = await sendMessage<{passwords: string[]}>('GENERATE');
  renderPasswords(response.passwords);
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

elements.toggleSettingsBtn.addEventListener('click', () => {
  const isExpanded = elements.toggleSettingsBtn.getAttribute('aria-expanded') === 'true';
  elements.toggleSettingsBtn.setAttribute('aria-expanded', String(!isExpanded));
  elements.settingsPanel.hidden = isExpanded;
});

elements.presetSelect.addEventListener('change', async () => {
  if (!currentConfig) return;

  const updated: ExtensionConfig = {
    ...currentConfig,
    activePresetId: elements.presetSelect.value,
  };

  const result = await sendMessage<{config: ExtensionConfig}>('SET_CONFIG', {config: updated});
  currentConfig = result.config;
  await refreshConfig();
});

// Auto-save on all input changes
const autoSaveInputs = [
  elements.numPasswordsInput,
  elements.numWordsInput,
  elements.wordMinInput,
  elements.wordMaxInput,
  elements.caseTransformSelect,
  elements.allowAccentsInput,
  elements.separatorTypeSelect,
  elements.separatorCharacterInput,
  elements.separatorAlphabetInput,
  elements.paddingTypeSelect,
  elements.padLengthInput,
  elements.digitsBeforeInput,
  elements.digitsAfterInput,
  elements.paddingBeforeInput,
  elements.paddingAfterInput,
  elements.paddingCharTypeSelect,
  elements.paddingCharInput,
  elements.paddingAlphabetInput,
  elements.symbolAlphabetInput,
  elements.dictionarySelect,
  elements.enableInsertionInput,
];

autoSaveInputs.forEach((input) => {
  input.addEventListener('change', async () => {
    updateConditionalVisibility();
    await saveSettings();
    await refreshConfig();
  });
});

// ===== Initialization =====
async function initialize() {
  await loadPresets();
  await loadDictionaries();
  await refreshConfig();
  await generate();
}

// Start the app
void initialize();
