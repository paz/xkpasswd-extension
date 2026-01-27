import type {ExtensionConfig, StoredPreset, XkpasswdConfig} from '../../core/config';

const presetSelect = document.querySelector<HTMLSelectElement>('#preset-select')!;
const applyPresetButton = document.querySelector<HTMLButtonElement>('#apply-preset')!;
const presetNameInput = document.querySelector<HTMLInputElement>('#preset-name')!;
const presetDescriptionInput = document.querySelector<HTMLInputElement>('#preset-description')!;
const savePresetButton = document.querySelector<HTMLButtonElement>('#save-preset')!;
const customPresetSelect = document.querySelector<HTMLSelectElement>('#custom-preset-select')!;
const renamePresetInput = document.querySelector<HTMLInputElement>('#rename-preset')!;
const renameButton = document.querySelector<HTMLButtonElement>('#rename-button')!;
const deleteButton = document.querySelector<HTMLButtonElement>('#delete-button')!;
const presetExportSelect = document.querySelector<HTMLSelectElement>('#preset-export-select')!;
const presetJsonArea = document.querySelector<HTMLTextAreaElement>('#preset-json')!;
const exportPresetButton = document.querySelector<HTMLButtonElement>('#export-preset')!;
const downloadPresetButton = document.querySelector<HTMLButtonElement>('#download-preset')!;
const presetFileInput = document.querySelector<HTMLInputElement>('#preset-file')!;
const presetImportArea = document.querySelector<HTMLTextAreaElement>('#preset-import')!;
const importPresetButton = document.querySelector<HTMLButtonElement>('#import-preset')!;
const clearPresetButton = document.querySelector<HTMLButtonElement>('#clear-preset')!;
const presetStatus = document.querySelector<HTMLParagraphElement>('#preset-status')!;

const numPasswordsInput = document.querySelector<HTMLInputElement>('#num-passwords')!;
const numWordsInput = document.querySelector<HTMLInputElement>('#num-words')!;
const wordMinInput = document.querySelector<HTMLInputElement>('#word-min')!;
const wordMaxInput = document.querySelector<HTMLInputElement>('#word-max')!;
const caseTransformSelect = document.querySelector<HTMLSelectElement>('#case-transform')!;
const separatorTypeSelect = document.querySelector<HTMLSelectElement>('#separator-type')!;
const separatorCharInput = document.querySelector<HTMLInputElement>('#separator-char')!;
const paddingTypeSelect = document.querySelector<HTMLSelectElement>('#padding-type')!;
const padLengthInput = document.querySelector<HTMLInputElement>('#pad-length')!;
const paddingCharTypeSelect = document.querySelector<HTMLSelectElement>('#padding-char-type')!;
const paddingCharInput = document.querySelector<HTMLInputElement>('#padding-char')!;
const digitsBeforeInput = document.querySelector<HTMLInputElement>('#digits-before')!;
const digitsAfterInput = document.querySelector<HTMLInputElement>('#digits-after')!;
const paddingBeforeInput = document.querySelector<HTMLInputElement>('#padding-before')!;
const paddingAfterInput = document.querySelector<HTMLInputElement>('#padding-after')!;
const symbolAlphabetInput = document.querySelector<HTMLInputElement>('#symbol-alphabet')!;
const separatorAlphabetInput = document.querySelector<HTMLInputElement>('#separator-alphabet')!;
const paddingAlphabetInput = document.querySelector<HTMLInputElement>('#padding-alphabet')!;
const allowAccentsInput = document.querySelector<HTMLInputElement>('#allow-accents')!;
const enableInsertionInput = document.querySelector<HTMLInputElement>('#enable-insertion')!;
const dictionarySelect = document.querySelector<HTMLSelectElement>('#dictionary')!;
const dictionaryNote = document.querySelector<HTMLParagraphElement>('#dictionary-note')!;

const saveConfigButton = document.querySelector<HTMLButtonElement>('#save-config')!;
const resetConfigButton = document.querySelector<HTMLButtonElement>('#reset-config')!;
const validationText = document.querySelector<HTMLParagraphElement>('#validation')!;

const configJsonArea = document.querySelector<HTMLTextAreaElement>('#config-json')!;
const exportButton = document.querySelector<HTMLButtonElement>('#export-config')!;
const importButton = document.querySelector<HTMLButtonElement>('#import-config')!;
const importStatus = document.querySelector<HTMLParagraphElement>('#import-status')!;

const runtime = chrome.runtime;

async function sendMessage<T>(type: string, payload?: Record<string, unknown>): Promise<T> {
  return runtime.sendMessage({type, ...payload});
}

let currentConfig: ExtensionConfig | null = null;
let builtInPresets: StoredPreset[] = [];

function populatePresetSelect(activePresetId: string, customPresets: StoredPreset[]) {
  presetSelect.innerHTML = '';
  const builtinGroup = document.createElement('optgroup');
  builtinGroup.label = 'Built-in';
  builtInPresets.forEach(preset => {
    const option = document.createElement('option');
    option.value = preset.id;
    option.textContent = preset.name;
    builtinGroup.appendChild(option);
  });
  presetSelect.appendChild(builtinGroup);

  const customGroup = document.createElement('optgroup');
  customGroup.label = 'Custom';
  customPresets.forEach(preset => {
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

  presetSelect.value = activePresetId;

  customPresetSelect.innerHTML = '';
  customPresets.forEach(preset => {
    const option = document.createElement('option');
    option.value = preset.id;
    option.textContent = preset.name;
    customPresetSelect.appendChild(option);
  });

  presetExportSelect.innerHTML = '';
  const exportGroup = document.createElement('optgroup');
  exportGroup.label = 'Built-in';
  builtInPresets.forEach(preset => {
    const option = document.createElement('option');
    option.value = preset.id;
    option.textContent = preset.name;
    exportGroup.appendChild(option);
  });
  presetExportSelect.appendChild(exportGroup);
  const exportCustomGroup = document.createElement('optgroup');
  exportCustomGroup.label = 'Custom';
  customPresets.forEach(preset => {
    const option = document.createElement('option');
    option.value = preset.id;
    option.textContent = preset.name;
    exportCustomGroup.appendChild(option);
  });
  presetExportSelect.appendChild(exportCustomGroup);
}

function populateDictionarySelect(dictionaries: Array<{id: string; name: string}>, activeId: string) {
  dictionarySelect.innerHTML = '';
  dictionaries.forEach(dict => {
    const option = document.createElement('option');
    option.value = dict.id;
    option.textContent = dict.name;
    dictionarySelect.appendChild(option);
  });
  dictionarySelect.value = activeId;
}

function setFormValues(config: ExtensionConfig, activeConfig: XkpasswdConfig) {
  numPasswordsInput.value = String(config.numPasswords);
  numWordsInput.value = String(activeConfig.num_words);
  wordMinInput.value = String(activeConfig.word_length_min);
  wordMaxInput.value = String(activeConfig.word_length_max);
  caseTransformSelect.value = activeConfig.case_transform;
  separatorTypeSelect.value = activeConfig.separator_type;
  separatorCharInput.value = activeConfig.separator_character ?? '';
  paddingTypeSelect.value = activeConfig.padding_type;
  padLengthInput.value = String(activeConfig.pad_to_length ?? '');
  paddingCharTypeSelect.value = activeConfig.padding_character_type;
  paddingCharInput.value = activeConfig.padding_character ?? '';
  digitsBeforeInput.value = String(activeConfig.padding_digits_before);
  digitsAfterInput.value = String(activeConfig.padding_digits_after);
  paddingBeforeInput.value = String(activeConfig.padding_characters_before);
  paddingAfterInput.value = String(activeConfig.padding_characters_after);
  symbolAlphabetInput.value = activeConfig.symbol_alphabet;
  separatorAlphabetInput.value = activeConfig.separator_alphabet ?? '';
  paddingAlphabetInput.value = activeConfig.padding_alphabet ?? '';
  allowAccentsInput.checked = Boolean(activeConfig.allow_accents);
  enableInsertionInput.checked = config.enableInsertion;
  dictionarySelect.value = config.dictionaryId;
}

function buildConfigFromForm(config: ExtensionConfig): ExtensionConfig {
  const customConfig: XkpasswdConfig = {
    ...config.customConfig,
    num_words: Number(numWordsInput.value),
    word_length_min: Number(wordMinInput.value),
    word_length_max: Number(wordMaxInput.value),
    case_transform: caseTransformSelect.value as XkpasswdConfig['case_transform'],
    separator_type: separatorTypeSelect.value as XkpasswdConfig['separator_type'],
    separator_character: separatorCharInput.value.trim().slice(0, 1),
    padding_type: paddingTypeSelect.value as XkpasswdConfig['padding_type'],
    pad_to_length: padLengthInput.value ? Number(padLengthInput.value) : undefined,
    padding_character_type: paddingCharTypeSelect.value as XkpasswdConfig['padding_character_type'],
    padding_character: paddingCharInput.value.trim().slice(0, 1),
    padding_digits_before: Number(digitsBeforeInput.value),
    padding_digits_after: Number(digitsAfterInput.value),
    padding_characters_before: Number(paddingBeforeInput.value),
    padding_characters_after: Number(paddingAfterInput.value),
    symbol_alphabet: symbolAlphabetInput.value,
    separator_alphabet: separatorAlphabetInput.value || undefined,
    padding_alphabet: paddingAlphabetInput.value || undefined,
    allow_accents: allowAccentsInput.checked ? 1 : 0,
  };

  return {
    ...config,
    numPasswords: Number(numPasswordsInput.value),
    customConfig,
    enableInsertion: enableInsertionInput.checked,
    dictionaryId: dictionarySelect.value,
    activePresetId: 'CUSTOM',
  };
}

async function loadConfig() {
  const response = await sendMessage<{config: ExtensionConfig; activeConfig: XkpasswdConfig; validation: {ok: boolean; errors: string[]}}>('GET_CONFIG');
  currentConfig = response.config;
  setFormValues(response.config, response.activeConfig);
  validationText.textContent = response.validation.ok ? '' : response.validation.errors.join(' ');
}

async function loadPresets() {
  const response = await sendMessage<{builtIn: StoredPreset[]; custom: StoredPreset[]; activePresetId: string}>('GET_PRESETS');
  builtInPresets = response.builtIn;
  populatePresetSelect(response.activePresetId, response.custom);
}

async function loadDictionaries() {
  const response = await sendMessage<{dictionaries: Array<{id: string; name: string}>}>('GET_DICTIONARIES');
  if (currentConfig) {
    populateDictionarySelect(response.dictionaries, currentConfig.dictionaryId);
  } else {
    populateDictionarySelect(response.dictionaries, response.dictionaries[0]?.id ?? 'EN');
  }
  if (response.dictionaries.length <= 1) {
    dictionarySelect.disabled = true;
    dictionaryNote.textContent = 'Only the built-in English dictionary is available right now.';
  } else {
    dictionarySelect.disabled = false;
    dictionaryNote.textContent = '';
  }
}

applyPresetButton.addEventListener('click', async () => {
  if (!currentConfig) {
    return;
  }
  const updated: ExtensionConfig = {
    ...currentConfig,
    activePresetId: presetSelect.value,
  };
  const result = await sendMessage<{config: ExtensionConfig}>('SET_CONFIG', {config: updated});
  currentConfig = result.config;
  await loadConfig();
});

savePresetButton.addEventListener('click', async () => {
  if (!currentConfig) {
    return;
  }
  const name = presetNameInput.value.trim();
  if (!name) {
    importStatus.textContent = 'Preset name is required.';
    return;
  }
  const updated = buildConfigFromForm(currentConfig);
  const newPreset: StoredPreset = {
    id: `custom-${Date.now()}`,
    name,
    description: presetDescriptionInput.value.trim() || 'Custom preset',
    config: updated.customConfig,
  };
  const nextConfig: ExtensionConfig = {
    ...updated,
    customPresets: [...updated.customPresets, newPreset],
    activePresetId: newPreset.id,
  };
  await sendMessage('SET_CONFIG', {config: nextConfig});
  presetNameInput.value = '';
  presetDescriptionInput.value = '';
  await loadPresets();
  await loadConfig();
});

renameButton.addEventListener('click', async () => {
  if (!currentConfig) {
    return;
  }
  const selectedId = customPresetSelect.value;
  const newName = renamePresetInput.value.trim();
  if (!selectedId || !newName) {
    return;
  }
  const updatedPresets = currentConfig.customPresets.map(preset =>
    preset.id === selectedId ? {...preset, name: newName} : preset,
  );
  const updated = {...currentConfig, customPresets: updatedPresets};
  await sendMessage('SET_CONFIG', {config: updated});
  renamePresetInput.value = '';
  await loadPresets();
});

deleteButton.addEventListener('click', async () => {
  if (!currentConfig) {
    return;
  }
  const selectedId = customPresetSelect.value;
  if (!selectedId) {
    return;
  }
  const updatedPresets = currentConfig.customPresets.filter(preset => preset.id !== selectedId);
  const updated = {...currentConfig, customPresets: updatedPresets};
  await sendMessage('SET_CONFIG', {config: updated});
  await loadPresets();
});

saveConfigButton.addEventListener('click', async () => {
  if (!currentConfig) {
    return;
  }
  const updated = buildConfigFromForm(currentConfig);
  const result = await sendMessage<{config: ExtensionConfig}>('SET_CONFIG', {config: updated});
  currentConfig = result.config;
  await loadConfig();
});

resetConfigButton.addEventListener('click', async () => {
  await sendMessage('RESET_CONFIG');
  await loadPresets();
  await loadConfig();
});

exportButton.addEventListener('click', () => {
  if (!currentConfig) {
    return;
  }
  configJsonArea.value = JSON.stringify(currentConfig, null, 2);
  importStatus.textContent = 'Exported current configuration.';
});

importButton.addEventListener('click', async () => {
  try {
    const parsed = JSON.parse(configJsonArea.value);
    await sendMessage('SET_CONFIG', {config: parsed});
    importStatus.textContent = 'Imported configuration.';
    await loadPresets();
    await loadConfig();
  } catch (error) {
    importStatus.textContent = 'Invalid JSON configuration.';
  }
});

function getPresetById(id: string): StoredPreset | undefined {
  if (id === 'CUSTOM') {
    return currentConfig
      ? {
          id: 'CUSTOM',
          name: 'Custom (unsaved)',
          description: 'Current unsaved configuration',
          config: currentConfig.customConfig,
        }
      : undefined;
  }
  return [...builtInPresets, ...(currentConfig?.customPresets ?? [])].find(preset => preset.id === id);
}

exportPresetButton.addEventListener('click', () => {
  if (!currentConfig) {
    return;
  }
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
    const updated = {
      ...currentConfig,
      customPresets: [...currentConfig.customPresets, nextPreset],
      activePresetId: nextPreset.id,
    };
    await sendMessage('SET_CONFIG', {config: updated});
    presetStatus.textContent = `Imported “${nextPreset.name}”.`;
    await loadPresets();
    await loadConfig();
  } catch (error) {
    presetStatus.textContent = 'Invalid preset JSON.';
  }
});

async function initializeOptions() {
  await loadPresets();
  await loadConfig();
  await loadDictionaries();
}

void initializeOptions();
