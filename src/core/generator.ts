import {DEFAULT_XKPASSWD_CONFIG, ExtensionConfig, StoredPreset, XkpasswdConfig} from './config';
import {XKPasswd} from '../../vendor/xkpasswd-js/src/xkpasswd.mjs';
import {Presets} from '../../vendor/xkpasswd-js/src/presets.mjs';

const CONFIG_KEYS: Array<keyof XkpasswdConfig> = [
  'symbol_alphabet',
  'word_length_min',
  'word_length_max',
  'num_words',
  'separator_type',
  'separator_character',
  'separator_alphabet',
  'padding_digits_before',
  'padding_digits_after',
  'padding_type',
  'padding_character_type',
  'padding_character',
  'padding_alphabet',
  'padding_characters_before',
  'padding_characters_after',
  'pad_to_length',
  'case_transform',
  'allow_accents',
  'random_increment',
];

function toXkpasswdConfig(config: Partial<XkpasswdConfig>): XkpasswdConfig {
  const next: XkpasswdConfig = {...DEFAULT_XKPASSWD_CONFIG};
  CONFIG_KEYS.forEach(key => {
    if (config[key] !== undefined) {
      next[key] = config[key] as never;
    }
  });
  return next;
}

function findCustomPreset(
  customPresets: StoredPreset[],
  id: string,
): StoredPreset | undefined {
  return customPresets.find(preset => preset.id === id);
}

let cachedBuiltinPresets: StoredPreset[] | null = null;
let cachedBuiltinPresetIds: Set<string> | null = null;
const sharedGenerator = new XKPasswd();

function loadBuiltinPresets(): StoredPreset[] {
  if (cachedBuiltinPresets) {
    return cachedBuiltinPresets;
  }
  const presets = new Presets(undefined);
  cachedBuiltinPresets = presets.getPresets().map(name => {
    const preset = new Presets(name);
    const current = preset.getCurrent() as {config: XkpasswdConfig};
    return {
      id: name,
      name,
      description: preset.description(),
      config: toXkpasswdConfig(current.config),
    };
  });
  cachedBuiltinPresetIds = new Set(cachedBuiltinPresets.map(preset => preset.id));
  return cachedBuiltinPresets;
}

export function getBuiltinPresets(): StoredPreset[] {
  return loadBuiltinPresets();
}

export function getDictionaries() {
  return [{id: 'EN', name: 'English (built-in)'}];
}

export function resolveActiveConfig(config: ExtensionConfig): XkpasswdConfig {
  const builtin = getBuiltinPresets().find(preset => preset.id === config.activePresetId);
  if (builtin) {
    return toXkpasswdConfig(builtin.config);
  }
  const customPreset = findCustomPreset(config.customPresets, config.activePresetId);
  if (customPreset) {
    return toXkpasswdConfig(customPreset.config);
  }
  if (config.activePresetId === 'CUSTOM') {
    return toXkpasswdConfig(config.customConfig);
  }
  return toXkpasswdConfig(config.customConfig);
}

export function validateCfg(config: XkpasswdConfig): {ok: boolean; errors: string[]} {
  const errors: string[] = [];
  if (config.num_words < 2) {
    errors.push('Number of words must be at least 2.');
  }
  if (config.word_length_min < 3 || config.word_length_max < 3) {
    errors.push('Word lengths must be at least 3.');
  }
  if (config.word_length_min > config.word_length_max) {
    errors.push('Minimum word length must be less than or equal to maximum.');
  }
  if (config.separator_type === 'FIXED' && config.separator_character.length !== 1) {
    errors.push('Fixed separator must be a single character.');
  }
  if (config.padding_type === 'ADAPTIVE' && (!config.pad_to_length || config.pad_to_length < 1)) {
    errors.push('Adaptive padding requires a target length.');
  }
  return {ok: errors.length === 0, errors};
}

export async function generatePasswords(extensionConfig: ExtensionConfig): Promise<string[]> {
  const builtInNames = cachedBuiltinPresetIds ?? new Set(loadBuiltinPresets().map(preset => preset.id));

  if (builtInNames.has(extensionConfig.activePresetId)) {
    sharedGenerator.setPreset(extensionConfig.activePresetId);
  } else {
    const activeConfig = resolveActiveConfig(extensionConfig);
    sharedGenerator.setCustomPreset(activeConfig);
  }

  const {passwords} = sharedGenerator.generatePassword(extensionConfig.numPasswords) as {passwords: string[]};
  return passwords;
}

export function asPresetList(customPresets: StoredPreset[]): StoredPreset[] {
  return [...getBuiltinPresets(), ...customPresets];
}
