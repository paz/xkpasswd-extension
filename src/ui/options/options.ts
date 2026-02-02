import type {ExtensionConfig, XkpasswdConfig, StoredPreset} from '../../core/config';

// ===== Tab Management =====
const tabs = document.querySelectorAll<HTMLButtonElement>('.tab');
const panels = document.querySelectorAll<HTMLElement>('.panel');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    // Update tabs
    tabs.forEach((t) => t.setAttribute('aria-selected', 'false'));
    tab.setAttribute('aria-selected', 'true');

    // Update panels
    const targetPanel = tab.getAttribute('aria-controls');
    panels.forEach((panel) => {
      panel.hidden = panel.id !== targetPanel;
    });
  });
});

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

function showStatus(elementId: string, message: string, isSuccess: boolean) {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.textContent = message;
  element.className = `status-message status-message--${isSuccess ? 'success' : 'error'}`;
  element.hidden = false;

  setTimeout(() => {
    element.hidden = true;
  }, 3000);
}

function updateConditionalFields() {
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
  });
}

// ===== Settings Tab =====
let currentConfig: ExtensionConfig | null = null;
let activeConfig: XkpasswdConfig | null = null;

async function loadSettings() {
  try {
    const response = await sendMessage<{
      config: ExtensionConfig;
      activeConfig: XkpasswdConfig;
    }>('GET_CONFIG');

    currentConfig = response.config;
    activeConfig = response.activeConfig;

    // Populate form fields - Basic settings
    const presetSelect = document.getElementById('preset-select') as HTMLSelectElement;
    const presetDesc = document.getElementById('preset-desc') as HTMLParagraphElement;
    const numPasswords = document.getElementById('num-passwords') as HTMLInputElement;
    const numWords = document.getElementById('num-words') as HTMLInputElement;
    const wordMin = document.getElementById('word-min') as HTMLInputElement;
    const wordMax = document.getElementById('word-max') as HTMLInputElement;
    const caseTransform = document.getElementById('case-transform') as HTMLSelectElement;
    const allowAccents = document.getElementById('allow-accents') as HTMLInputElement;
    const separatorType = document.getElementById('separator-type') as HTMLSelectElement;
    const separatorChar = document.getElementById('separator-char') as HTMLInputElement;
    const separatorAlphabet = document.getElementById('separator-alphabet') as HTMLInputElement;

    // Advanced settings (now in Settings tab)
    const paddingType = document.getElementById('padding-type') as HTMLSelectElement;
    const padLength = document.getElementById('pad-length') as HTMLInputElement;
    const digitsBefore = document.getElementById('digits-before') as HTMLInputElement;
    const digitsAfter = document.getElementById('digits-after') as HTMLInputElement;
    const paddingBefore = document.getElementById('padding-before') as HTMLInputElement;
    const paddingAfter = document.getElementById('padding-after') as HTMLInputElement;
    const paddingCharType = document.getElementById('padding-char-type') as HTMLSelectElement;
    const paddingChar = document.getElementById('padding-char') as HTMLInputElement;
    const paddingAlphabet = document.getElementById('padding-alphabet') as HTMLInputElement;
    const symbolAlphabet = document.getElementById('symbol-alphabet') as HTMLInputElement;
    const dictionary = document.getElementById('dictionary') as HTMLSelectElement;
    const enableInsertion = document.getElementById('enable-insertion') as HTMLInputElement;

    // Load presets
    const presetsResponse = await sendMessage<{
      builtIn: Array<{id: string; name: string; description: string}>;
      custom: Array<{id: string; name: string; description: string}>;
    }>('GET_PRESETS');

    presetSelect.innerHTML = '';
    const builtinGroup = document.createElement('optgroup');
    builtinGroup.label = 'Built-in';
    presetsResponse.builtIn.forEach((preset) => {
      const option = document.createElement('option');
      option.value = preset.id;
      option.textContent = preset.name;
      option.dataset.description = preset.description;
      builtinGroup.appendChild(option);
    });
    presetSelect.appendChild(builtinGroup);

    if (presetsResponse.custom && presetsResponse.custom.length > 0) {
      const customGroup = document.createElement('optgroup');
      customGroup.label = 'Custom';
      presetsResponse.custom.forEach((preset) => {
        const option = document.createElement('option');
        option.value = preset.id;
        option.textContent = preset.name;
        option.dataset.description = preset.description;
        customGroup.appendChild(option);
      });
      presetSelect.appendChild(customGroup);
    }

    presetSelect.value = response.config.activePresetId;
    const selectedOption = presetSelect.options[presetSelect.selectedIndex];
    presetDesc.textContent = selectedOption?.dataset.description || '';

    // Set basic settings values
    numPasswords.value = String(response.config.numPasswords);
    numWords.value = String(response.activeConfig.num_words);
    wordMin.value = String(response.activeConfig.word_length_min);
    wordMax.value = String(response.activeConfig.word_length_max);
    caseTransform.value = response.activeConfig.case_transform;
    allowAccents.checked = Boolean(response.activeConfig.allow_accents);
    separatorType.value = response.activeConfig.separator_type;
    separatorChar.value = response.activeConfig.separator_character || '';
    separatorAlphabet.value = response.activeConfig.separator_alphabet || '';

    // Set advanced settings values
    paddingType.value = response.activeConfig.padding_type;
    padLength.value = response.activeConfig.pad_to_length ? String(response.activeConfig.pad_to_length) : '';
    digitsBefore.value = String(response.activeConfig.padding_digits_before);
    digitsAfter.value = String(response.activeConfig.padding_digits_after);
    paddingBefore.value = String(response.activeConfig.padding_characters_before);
    paddingAfter.value = String(response.activeConfig.padding_characters_after);
    paddingCharType.value = response.activeConfig.padding_character_type;
    paddingChar.value = response.activeConfig.padding_character || '';
    paddingAlphabet.value = response.activeConfig.padding_alphabet || '';
    symbolAlphabet.value = response.activeConfig.symbol_alphabet || '';

    // Load dictionaries
    const dictResponse = await sendMessage<{dictionaries: Array<{id: string; name: string}>}>('GET_DICTIONARIES');
    dictionary.innerHTML = '';
    dictResponse.dictionaries.forEach((dict) => {
      const option = document.createElement('option');
      option.value = dict.id;
      option.textContent = dict.name;
      dictionary.appendChild(option);
    });
    dictionary.value = response.config.dictionaryId;

    enableInsertion.checked = response.config.enableInsertion;

    updateConditionalFields();
  } catch (error) {
    console.error('Error loading settings:', error);
    showStatus('settings-status', 'Failed to load settings', false);
  }
}

async function saveSettings() {
  if (!currentConfig || !activeConfig) return;

  try {
    const presetSelect = document.getElementById('preset-select') as HTMLSelectElement;
    const numPasswords = document.getElementById('num-passwords') as HTMLInputElement;
    const numWords = document.getElementById('num-words') as HTMLInputElement;
    const wordMin = document.getElementById('word-min') as HTMLInputElement;
    const wordMax = document.getElementById('word-max') as HTMLInputElement;
    const caseTransform = document.getElementById('case-transform') as HTMLSelectElement;
    const allowAccents = document.getElementById('allow-accents') as HTMLInputElement;
    const separatorType = document.getElementById('separator-type') as HTMLSelectElement;
    const separatorChar = document.getElementById('separator-char') as HTMLInputElement;
    const separatorAlphabet = document.getElementById('separator-alphabet') as HTMLInputElement;
    const paddingType = document.getElementById('padding-type') as HTMLSelectElement;
    const padLength = document.getElementById('pad-length') as HTMLInputElement;
    const digitsBefore = document.getElementById('digits-before') as HTMLInputElement;
    const digitsAfter = document.getElementById('digits-after') as HTMLInputElement;
    const paddingBefore = document.getElementById('padding-before') as HTMLInputElement;
    const paddingAfter = document.getElementById('padding-after') as HTMLInputElement;
    const paddingCharType = document.getElementById('padding-char-type') as HTMLSelectElement;
    const paddingChar = document.getElementById('padding-char') as HTMLInputElement;
    const paddingAlphabet = document.getElementById('padding-alphabet') as HTMLInputElement;
    const symbolAlphabet = document.getElementById('symbol-alphabet') as HTMLInputElement;
    const dictionary = document.getElementById('dictionary') as HTMLSelectElement;
    const enableInsertion = document.getElementById('enable-insertion') as HTMLInputElement;

    const updated: ExtensionConfig = {
      ...currentConfig,
      numPasswords: parseInt(numPasswords.value) || 3,
      enableInsertion: enableInsertion.checked,
      activePresetId: presetSelect.value,
      dictionaryId: dictionary.value,
      customConfig: {
        ...currentConfig.customConfig,
        num_words: parseInt(numWords.value) || 3,
        word_length_min: parseInt(wordMin.value) || 4,
        word_length_max: parseInt(wordMax.value) || 8,
        case_transform: caseTransform.value as XkpasswdConfig['case_transform'],
        allow_accents: allowAccents.checked ? 1 : 0,
        separator_type: separatorType.value as XkpasswdConfig['separator_type'],
        separator_character: separatorType.value === 'FIXED' ? separatorChar.value.trim().slice(0, 1) : '',
        separator_alphabet: separatorType.value === 'RANDOM' ? separatorAlphabet.value.trim() : '',
        padding_type: paddingType.value as XkpasswdConfig['padding_type'],
        pad_to_length: paddingType.value === 'ADAPTIVE' && padLength.value ? parseInt(padLength.value) : 0,
        padding_digits_before: parseInt(digitsBefore.value) || 0,
        padding_digits_after: parseInt(digitsAfter.value) || 0,
        padding_characters_before: parseInt(paddingBefore.value) || 0,
        padding_characters_after: parseInt(paddingAfter.value) || 0,
        padding_character_type: paddingCharType.value as XkpasswdConfig['padding_character_type'],
        padding_character: paddingCharType.value === 'FIXED' ? paddingChar.value.trim().slice(0, 1) : '',
        padding_alphabet: paddingCharType.value === 'RANDOM' ? paddingAlphabet.value.trim() : '',
        symbol_alphabet: symbolAlphabet.value.trim(),
      },
    };

    const result = await sendMessage<{config: ExtensionConfig}>('SET_CONFIG', {config: updated});
    currentConfig = result.config;
    showStatus('settings-status', 'Settings saved successfully!', true);
  } catch (error) {
    console.error('Error saving settings:', error);
    showStatus('settings-status', 'Failed to save settings', false);
  }
}

async function resetSettings() {
  if (!confirm('Reset all settings to defaults? This cannot be undone.')) return;

  try {
    const response = await sendMessage<{config: ExtensionConfig}>('RESET_CONFIG');
    currentConfig = response.config;
    await loadSettings();
    showStatus('settings-status', 'Settings reset to defaults', true);
  } catch (error) {
    console.error('Error resetting settings:', error);
    showStatus('settings-status', 'Failed to reset settings', false);
  }
}

// Helper function to read current form values into a config object
function getCurrentFormConfig(): Partial<XkpasswdConfig> {
  const numWords = document.getElementById('num-words') as HTMLInputElement;
  const wordMin = document.getElementById('word-min') as HTMLInputElement;
  const wordMax = document.getElementById('word-max') as HTMLInputElement;
  const caseTransform = document.getElementById('case-transform') as HTMLSelectElement;
  const allowAccents = document.getElementById('allow-accents') as HTMLInputElement;
  const separatorType = document.getElementById('separator-type') as HTMLSelectElement;
  const separatorChar = document.getElementById('separator-char') as HTMLInputElement;
  const separatorAlphabet = document.getElementById('separator-alphabet') as HTMLInputElement;
  const paddingType = document.getElementById('padding-type') as HTMLSelectElement;
  const padLength = document.getElementById('pad-length') as HTMLInputElement;
  const digitsBefore = document.getElementById('digits-before') as HTMLInputElement;
  const digitsAfter = document.getElementById('digits-after') as HTMLInputElement;
  const paddingBefore = document.getElementById('padding-before') as HTMLInputElement;
  const paddingAfter = document.getElementById('padding-after') as HTMLInputElement;
  const paddingCharType = document.getElementById('padding-char-type') as HTMLSelectElement;
  const paddingChar = document.getElementById('padding-char') as HTMLInputElement;
  const paddingAlphabet = document.getElementById('padding-alphabet') as HTMLInputElement;
  const symbolAlphabet = document.getElementById('symbol-alphabet') as HTMLInputElement;

  return {
    num_words: parseInt(numWords.value) || 3,
    word_length_min: parseInt(wordMin.value) || 4,
    word_length_max: parseInt(wordMax.value) || 8,
    case_transform: caseTransform.value as XkpasswdConfig['case_transform'],
    allow_accents: allowAccents.checked ? 1 : 0,
    separator_type: separatorType.value as XkpasswdConfig['separator_type'],
    separator_character: separatorType.value === 'FIXED' ? separatorChar.value.trim().slice(0, 1) : '',
    separator_alphabet: separatorType.value === 'RANDOM' ? separatorAlphabet.value.trim() : '',
    padding_type: paddingType.value as XkpasswdConfig['padding_type'],
    pad_to_length: paddingType.value === 'ADAPTIVE' && padLength.value ? parseInt(padLength.value) : 0,
    padding_digits_before: parseInt(digitsBefore.value) || 0,
    padding_digits_after: parseInt(digitsAfter.value) || 0,
    padding_characters_before: parseInt(paddingBefore.value) || 0,
    padding_characters_after: parseInt(paddingAfter.value) || 0,
    padding_character_type: paddingCharType.value as XkpasswdConfig['padding_character_type'],
    padding_character: paddingCharType.value === 'FIXED' ? paddingChar.value.trim().slice(0, 1) : '',
    padding_alphabet: paddingCharType.value === 'RANDOM' ? paddingAlphabet.value.trim() : '',
    symbol_alphabet: symbolAlphabet.value.trim(),
  };
}

// ===== Presets Tab =====
async function savePreset() {
  if (!currentConfig) return;

  const nameInput = document.getElementById('new-preset-name') as HTMLInputElement;
  const descInput = document.getElementById('new-preset-desc') as HTMLInputElement;
  const name = nameInput.value.trim();

  if (!name) {
    showStatus('save-preset-status', 'Please enter a preset name', false);
    return;
  }

  try {
    // Get current form values instead of using saved customConfig
    const formConfig = getCurrentFormConfig();

    const newPreset: StoredPreset = {
      id: `custom_${Date.now()}`,
      name,
      description: descInput.value.trim() || 'Custom preset',
      config: formConfig as XkpasswdConfig,
    };

    const updated: ExtensionConfig = {
      ...currentConfig,
      customPresets: [...currentConfig.customPresets, newPreset],
    };

    const result = await sendMessage<{config: ExtensionConfig}>('SET_CONFIG', {config: updated});
    currentConfig = result.config;

    nameInput.value = '';
    descInput.value = '';

    showStatus('save-preset-status', `Preset "${name}" saved!`, true);
    await loadCustomPresets();
  } catch (error) {
    console.error('Error saving preset:', error);
    showStatus('save-preset-status', 'Failed to save preset', false);
  }
}

async function loadCustomPresets() {
  if (!currentConfig) return;

  const listContainer = document.getElementById('custom-presets-list');
  if (!listContainer) return;

  if (currentConfig.customPresets.length === 0) {
    listContainer.innerHTML = '<p class="empty-message">No custom presets yet. Create one above!</p>';
    return;
  }

  listContainer.innerHTML = '';

  currentConfig.customPresets.forEach((preset) => {
    const item = document.createElement('div');
    item.className = 'preset-item';
    item.innerHTML = `
      <div class="preset-item__info">
        <h3 class="preset-item__name">${preset.name}</h3>
        <p class="preset-item__desc">${preset.description}</p>
      </div>
      <div class="preset-item__actions">
        <button class="btn-danger" data-preset-id="${preset.id}">Delete</button>
      </div>
    `;

    const deleteBtn = item.querySelector('.btn-danger') as HTMLButtonElement;
    deleteBtn.addEventListener('click', () => deletePreset(preset.id));

    listContainer.appendChild(item);
  });
}

async function loadBuiltinPresets() {
  try {
    const presetsResponse = await sendMessage<{
      builtIn: Array<{id: string; name: string; description: string}>;
    }>('GET_PRESETS');

    const listContainer = document.getElementById('builtin-presets-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    presetsResponse.builtIn.forEach((preset) => {
      const item = document.createElement('div');
      item.className = 'preset-item';
      item.innerHTML = `
        <div class="preset-item__info">
          <h3 class="preset-item__name">${preset.name}</h3>
          <p class="preset-item__desc">${preset.description}</p>
        </div>
        <div class="preset-item__actions">
          <span class="preset-badge">Built-in</span>
        </div>
      `;
      listContainer.appendChild(item);
    });
  } catch (error) {
    console.error('Error loading builtin presets:', error);
  }
}

async function deletePreset(presetId: string) {
  if (!currentConfig) return;
  if (!confirm('Delete this preset? This cannot be undone.')) return;

  try {
    const updated: ExtensionConfig = {
      ...currentConfig,
      customPresets: currentConfig.customPresets.filter((p) => p.id !== presetId),
    };

    const result = await sendMessage<{config: ExtensionConfig}>('SET_CONFIG', {config: updated});
    currentConfig = result.config;
    await loadCustomPresets();
  } catch (error) {
    console.error('Error deleting preset:', error);
  }
}

// ===== Event Listeners =====
document.getElementById('save-settings')?.addEventListener('click', saveSettings);
document.getElementById('reset-settings')?.addEventListener('click', resetSettings);
document.getElementById('save-preset')?.addEventListener('click', savePreset);

// Update conditional fields when selects change
document.getElementById('separator-type')?.addEventListener('change', updateConditionalFields);
document.getElementById('padding-type')?.addEventListener('change', updateConditionalFields);
document.getElementById('padding-char-type')?.addEventListener('change', updateConditionalFields);

// Update preset description when preset changes
document.getElementById('preset-select')?.addEventListener('change', (e) => {
  const select = e.target as HTMLSelectElement;
  const option = select.options[select.selectedIndex];
  const desc = document.getElementById('preset-desc') as HTMLParagraphElement;
  desc.textContent = option?.dataset.description || '';
});

// ===== Initialize =====
async function initialize() {
  await loadSettings();
  await loadCustomPresets();
  await loadBuiltinPresets();
}

void initialize();
