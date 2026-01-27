import type {ExtensionConfig, StoredPreset, XkpasswdConfig} from '../../core/config';

const numPasswordsInput = document.querySelector<HTMLInputElement>('#num-passwords')!;
const numWordsInput = document.querySelector<HTMLInputElement>('#num-words')!;
const wordMinInput = document.querySelector<HTMLInputElement>('#word-min')!;
const wordMaxInput = document.querySelector<HTMLInputElement>('#word-max')!;
const caseTransformSelect = document.querySelector<HTMLSelectElement>('#case-transform')!;
const separatorTypeSelect = document.querySelector<HTMLSelectElement>('#separator-type')!;
const separatorCharacterInput = document.querySelector<HTMLInputElement>('#separator-character')!;
const separatorAlphabetInput = document.querySelector<HTMLInputElement>('#separator-alphabet')!;
const paddingTypeSelect = document.querySelector<HTMLSelectElement>('#padding-type')!;
const padLengthInput = document.querySelector<HTMLInputElement>('#pad-length')!;
const digitsBeforeInput = document.querySelector<HTMLInputElement>('#digits-before')!;
const digitsAfterInput = document.querySelector<HTMLInputElement>('#digits-after')!;
const paddingBeforeInput = document.querySelector<HTMLInputElement>('#padding-before')!;
const paddingAfterInput = document.querySelector<HTMLInputElement>('#padding-after')!;
const paddingCharTypeSelect = document.querySelector<HTMLSelectElement>('#padding-char-type')!;
const paddingCharInput = document.querySelector<HTMLInputElement>('#padding-char')!;
const paddingAlphabetInput = document.querySelector<HTMLInputElement>('#padding-alphabet')!;
const symbolAlphabetInput = document.querySelector<HTMLInputElement>('#symbol-alphabet')!;
const allowAccentsInput = document.querySelector<HTMLInputElement>('#allow-accents')!;
const enableInsertionInput = document.querySelector<HTMLInputElement>('#enable-insertion')!;
const dictionarySelect = document.querySelector<HTMLSelectElement>('#dictionary')!;
const presetSelect = document.querySelector<HTMLSelectElement>('#preset')!;
const presetDescription = document.querySelector<HTMLParagraphElement>('#preset-description')!;
const presetExportSelect = document.querySelector<HTMLSelectElement>('#preset-export')!;
const presetJsonArea = document.querySelector<HTMLTextAreaElement>('#preset-json')!;
const exportPresetButton = document.querySelector<HTMLButtonElement>('#export-preset')!;
const downloadPresetButton = document.querySelector<HTMLButtonElement>('#download-preset')!;
const presetFileInput = document.querySelector<HTMLInputElement>('#preset-file')!;
const presetImportArea = document.querySelector<HTMLTextAreaElement>('#preset-import')!;
const importPresetButton = document.querySelector<HTMLButtonElement>('#import-preset')!;
const clearPresetButton = document.querySelector<HTMLButtonElement>('#clear-preset')!;
const presetStatus = document.querySelector<HTMLParagraphElement>('#preset-status')!;
const managePresetsButton = document.querySelector<HTMLButtonElement>('#manage-presets')!;
const generateButton = document.querySelector<HTMLButtonElement>('#generate')!;
const copyAllButton = document.querySelector<HTMLButtonElement>('#copy-all')!;
const passwordList = document.querySelector<HTMLUListElement>('#password-list')!;
const emptyState = document.querySelector<HTMLParagraphElement>('#empty-state')!;
const validationText = document.querySelector<HTMLParagraphElement>('#validation')!;
const toast = document.querySelector<HTMLDivElement>('#toast')!;
const optionsButton = document.querySelector<HTMLButtonElement>('#open-options')!;
const conditionalFields = Array.from(document.querySelectorAll<HTMLElement>('[data-show-when]'));

const runtime = chrome.runtime;

async function sendMessage<T>(type: string, payload?: Record<string, unknown>): Promise<T> {
  return runtime.sendMessage({type, ...payload});
}

let currentConfig: ExtensionConfig | null = null;
let activeConfig: XkpasswdConfig | null = null;
const presetDescriptions = new Map<string, string>();
let builtInPresets: StoredPreset[] = [];
let customPresets: StoredPreset[] = [];

function showToast(message: string) {
  toast.textContent = message;
  toast.hidden = false;
  window.setTimeout(() => {
    toast.hidden = true;
  }, 1500);
}

function updateConditionalVisibility() {
  const controlMap = new Map<string, HTMLInputElement | HTMLSelectElement>();
  const controls = document.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-key]');
  controls.forEach(control => {
    const key = control.dataset.key;
    if (key) {
      controlMap.set(key, control);
    }
  });

  conditionalFields.forEach(field => {
    const rule = field.dataset.showWhen;
    if (!rule) {
      return;
    }
    const [key, expectedValue] = rule.split(':');
    const control = controlMap.get(key);
    if (!control) {
      return;
    }
    const currentValue = control instanceof HTMLInputElement && control.type === 'checkbox'
      ? (control.checked ? 'true' : 'false')
      : control.value;
    const shouldShow = currentValue === expectedValue;
    field.hidden = !shouldShow;
    field.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select').forEach(input => {
      input.disabled = !shouldShow;
    });
  });
}

function renderPasswords(passwords: string[]) {
  passwordList.innerHTML = '';
  if (passwords.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;
  passwords.forEach(password => {
    const item = document.createElement('li');
    item.className = 'password-item';

    const text = document.createElement('span');
    text.className = 'password-text';
    text.textContent = password;

    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.textContent = 'Copy';
    copyButton.setAttribute('aria-label', 'Copy password');
    copyButton.addEventListener('click', async () => {
      await navigator.clipboard.writeText(password);
      showToast('Copied');
    });

    item.append(text, copyButton);
    passwordList.appendChild(item);
  });
}

function updateInputsFromConfig(config: ExtensionConfig, nextActiveConfig: XkpasswdConfig) {
  numPasswordsInput.value = String(config.numPasswords);
  numWordsInput.value = String(nextActiveConfig.num_words);
  wordMinInput.value = String(nextActiveConfig.word_length_min);
  wordMaxInput.value = String(nextActiveConfig.word_length_max);
  caseTransformSelect.value = nextActiveConfig.case_transform;
  separatorTypeSelect.value = nextActiveConfig.separator_type;
  separatorCharacterInput.value = nextActiveConfig.separator_character ?? '';
  separatorAlphabetInput.value = nextActiveConfig.separator_alphabet ?? '';
  paddingTypeSelect.value = nextActiveConfig.padding_type;
  padLengthInput.value = nextActiveConfig.pad_to_length ? String(nextActiveConfig.pad_to_length) : '';
  digitsBeforeInput.value = String(nextActiveConfig.padding_digits_before);
  digitsAfterInput.value = String(nextActiveConfig.padding_digits_after);
  paddingBeforeInput.value = String(nextActiveConfig.padding_characters_before);
  paddingAfterInput.value = String(nextActiveConfig.padding_characters_after);
  paddingCharTypeSelect.value = nextActiveConfig.padding_character_type;
  paddingCharInput.value = nextActiveConfig.padding_character ?? '';
  paddingAlphabetInput.value = nextActiveConfig.padding_alphabet ?? '';
  symbolAlphabetInput.value = nextActiveConfig.symbol_alphabet ?? '';
  allowAccentsInput.checked = Boolean(nextActiveConfig.allow_accents);
  enableInsertionInput.checked = config.enableInsertion;
  dictionarySelect.value = config.dictionaryId;
  presetSelect.value = config.activePresetId;
  presetDescription.textContent = presetDescriptions.get(config.activePresetId) ?? '';
  updateConditionalVisibility();
}

async function loadPresets() {
  const response = await sendMessage<{
    builtIn: StoredPreset[];
    custom: StoredPreset[];
    activePresetId: string;
  }>('GET_PRESETS');
  builtInPresets = response.builtIn;
  customPresets = response.custom;
  presetSelect.innerHTML = '';
  presetDescriptions.clear();

  const builtinGroup = document.createElement('optgroup');
  builtinGroup.label = 'Built-in';
  response.builtIn.forEach(preset => {
    const option = document.createElement('option');
    option.value = preset.id;
    option.textContent = preset.name;
    builtinGroup.appendChild(option);
    presetDescriptions.set(preset.id, preset.description);
  });
  presetSelect.appendChild(builtinGroup);

  const customGroup = document.createElement('optgroup');
  customGroup.label = 'Custom';
  response.custom.forEach(preset => {
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
  presetSelect.appendChild(customGroup);

  presetSelect.value = response.activePresetId;
  presetDescription.textContent = presetDescriptions.get(response.activePresetId) ?? '';
  populatePresetExportSelect();
  presetExportSelect.value = response.activePresetId;
}

function populatePresetExportSelect() {
  presetExportSelect.innerHTML = '';
  const presets = getPresetList();
  presets.forEach(preset => {
    const option = document.createElement('option');
    option.value = preset.id;
    option.textContent = preset.name;
    presetExportSelect.appendChild(option);
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
  updateInputsFromConfig(response.config, response.activeConfig);
  if (response.validation.ok) {
    validationText.textContent = '';
  } else {
    validationText.textContent = response.validation.errors.join(' ');
  }
}

function readNumber(input: HTMLInputElement, fallback: number): number {
  const value = Number(input.value);
  return Number.isNaN(value) ? fallback : value;
}

function readOptionalNumber(input: HTMLInputElement, fallback?: number): number | undefined {
  const trimmed = input.value.trim();
  if (!trimmed) {
    return undefined;
  }
  const value = Number(trimmed);
  return Number.isNaN(value) ? fallback : value;
}

function buildCustomConfig(baseConfig: XkpasswdConfig): XkpasswdConfig {
  const separatorType = separatorTypeSelect.value as XkpasswdConfig['separator_type'];
  const paddingType = paddingTypeSelect.value as XkpasswdConfig['padding_type'];
  const paddingCharType = paddingCharTypeSelect.value as XkpasswdConfig['padding_character_type'];
  return {
    ...baseConfig,
    num_words: readNumber(numWordsInput, baseConfig.num_words),
    word_length_min: readNumber(wordMinInput, baseConfig.word_length_min),
    word_length_max: readNumber(wordMaxInput, baseConfig.word_length_max),
    case_transform: caseTransformSelect.value as XkpasswdConfig['case_transform'],
    separator_type: separatorType,
    separator_character: separatorType === 'FIXED' ? separatorCharacterInput.value.trim().slice(0, 1) : '',
    separator_alphabet: separatorType === 'RANDOM' ? separatorAlphabetInput.value.trim() : '',
    padding_type: paddingType,
    pad_to_length: paddingType === 'ADAPTIVE' ? readOptionalNumber(padLengthInput, baseConfig.pad_to_length) : undefined,
    padding_digits_before: readNumber(digitsBeforeInput, baseConfig.padding_digits_before),
    padding_digits_after: readNumber(digitsAfterInput, baseConfig.padding_digits_after),
    padding_characters_before: readNumber(paddingBeforeInput, baseConfig.padding_characters_before),
    padding_characters_after: readNumber(paddingAfterInput, baseConfig.padding_characters_after),
    padding_character_type: paddingCharType,
    padding_character: paddingCharType === 'FIXED' ? paddingCharInput.value.trim().slice(0, 1) : '',
    padding_alphabet: paddingCharType === 'RANDOM' ? paddingAlphabetInput.value.trim() : '',
    symbol_alphabet: symbolAlphabetInput.value.trim(),
    allow_accents: allowAccentsInput.checked ? 1 : 0,
  };
}

function getPresetList(): StoredPreset[] {
  if (!currentConfig) {
    return [...builtInPresets, ...customPresets];
  }
  const customPlaceholder: StoredPreset = {
    id: 'CUSTOM',
    name: 'Custom (unsaved)',
    description: 'Current unsaved configuration',
    config: currentConfig.customConfig,
  };
  return [...builtInPresets, ...customPresets, customPlaceholder];
}

function getPresetById(id: string): StoredPreset | undefined {
  if (id === 'CUSTOM' && currentConfig) {
    return {
      id: 'CUSTOM',
      name: 'Custom (unsaved)',
      description: 'Current unsaved configuration',
      config: currentConfig.customConfig,
    };
  }
  return getPresetList().find(preset => preset.id === id);
}

async function saveQuickSettings() {
  if (!currentConfig) {
    return;
  }
  const baseConfig = activeConfig ?? currentConfig.customConfig;
  const updated: ExtensionConfig = {
    ...currentConfig,
    numPasswords: Number(numPasswordsInput.value) || 1,
    enableInsertion: enableInsertionInput.checked,
    dictionaryId: dictionarySelect.value,
  };

  updated.customConfig = buildCustomConfig(baseConfig);
  if (updated.activePresetId !== 'CUSTOM') {
    updated.activePresetId = 'CUSTOM';
  }

  const result = await sendMessage<{config: ExtensionConfig}>('SET_CONFIG', {config: updated});
  currentConfig = result.config;
  presetSelect.value = result.config.activePresetId;
  presetDescription.textContent = presetDescriptions.get(result.config.activePresetId) ?? '';
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

wordMinInput.addEventListener('change', saveQuickSettings);
wordMaxInput.addEventListener('change', saveQuickSettings);
caseTransformSelect.addEventListener('change', async () => {
  updateConditionalVisibility();
  await saveQuickSettings();
});
separatorTypeSelect.addEventListener('change', async () => {
  updateConditionalVisibility();
  await saveQuickSettings();
});
separatorCharacterInput.addEventListener('change', saveQuickSettings);
separatorAlphabetInput.addEventListener('change', saveQuickSettings);
paddingTypeSelect.addEventListener('change', async () => {
  updateConditionalVisibility();
  await saveQuickSettings();
});
padLengthInput.addEventListener('change', saveQuickSettings);
digitsBeforeInput.addEventListener('change', saveQuickSettings);
digitsAfterInput.addEventListener('change', saveQuickSettings);
paddingBeforeInput.addEventListener('change', saveQuickSettings);
paddingAfterInput.addEventListener('change', saveQuickSettings);
paddingCharTypeSelect.addEventListener('change', async () => {
  updateConditionalVisibility();
  await saveQuickSettings();
});
paddingCharInput.addEventListener('change', saveQuickSettings);
paddingAlphabetInput.addEventListener('change', saveQuickSettings);
symbolAlphabetInput.addEventListener('change', saveQuickSettings);
allowAccentsInput.addEventListener('change', saveQuickSettings);
enableInsertionInput.addEventListener('change', saveQuickSettings);
dictionarySelect.addEventListener('change', saveQuickSettings);

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

exportPresetButton.addEventListener('click', () => {
  const preset = getPresetById(presetExportSelect.value);
  if (!preset) {
    presetStatus.textContent = 'Select a preset to export.';
    return;
  }
  presetJsonArea.value = JSON.stringify(preset, null, 2);
  presetStatus.textContent = `Exported “${preset.name}”.`;
});

downloadPresetButton.addEventListener('click', () => {
  if (!presetJsonArea.value.trim()) {
    presetStatus.textContent = 'Export a preset first to download.';
    return;
  }
  const blob = new Blob([presetJsonArea.value], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'xkpasswd-preset.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

presetFileInput.addEventListener('change', async () => {
  const file = presetFileInput.files?.[0];
  if (!file) {
    return;
  }
  presetImportArea.value = await file.text();
});

clearPresetButton.addEventListener('click', () => {
  presetImportArea.value = '';
  presetFileInput.value = '';
  presetStatus.textContent = '';
});

importPresetButton.addEventListener('click', async () => {
  if (!currentConfig) {
    return;
  }
  try {
    const parsed = JSON.parse(presetImportArea.value) as StoredPreset;
    if (!parsed?.config || !parsed?.name) {
      presetStatus.textContent = 'Preset JSON must include name and config.';
      return;
    }
    const nextPreset: StoredPreset = {
      id: parsed.id?.startsWith('custom-') ? parsed.id : `custom-${Date.now()}`,
      name: parsed.name,
      description: parsed.description ?? 'Imported preset',
      config: parsed.config,
    };
    const updated: ExtensionConfig = {
      ...currentConfig,
      customPresets: [...currentConfig.customPresets, nextPreset],
      activePresetId: nextPreset.id,
    };
    await sendMessage('SET_CONFIG', {config: updated});
    presetStatus.textContent = `Imported “${nextPreset.name}”.`;
    presetImportArea.value = '';
    presetFileInput.value = '';
    await loadPresets();
    await refreshConfig();
  } catch (error) {
    presetStatus.textContent = 'Invalid preset JSON.';
  }
});

copyAllButton.addEventListener('click', async () => {
  const passwords = Array.from(passwordList.querySelectorAll('.password-text')).map(node => node.textContent ?? '');
  await navigator.clipboard.writeText(passwords.join('\n'));
  showToast('Copied all');
});

optionsButton.addEventListener('click', () => {
  runtime.openOptionsPage();
});

managePresetsButton.addEventListener('click', () => {
  runtime.openOptionsPage();
});

async function initializePopup() {
  emptyState.hidden = false;
  await loadPresets();
  await loadDictionaries();
  await refreshConfig();
  await generate();
}

async function loadDictionaries() {
  const response = await sendMessage<{dictionaries: Array<{id: string; name: string}>}>('GET_DICTIONARIES');
  dictionarySelect.innerHTML = '';
  response.dictionaries.forEach(dictionary => {
    const option = document.createElement('option');
    option.value = dictionary.id;
    option.textContent = dictionary.name;
    dictionarySelect.appendChild(option);
  });
}

void initializePopup();
