export type SeparatorType = 'NONE' | 'RANDOM' | 'FIXED';
export type PaddingType = 'NONE' | 'FIXED' | 'ADAPTIVE';
export type PaddingCharacterType = 'RANDOM' | 'FIXED';
export type CaseTransform = 'NONE' | 'CAPITALISE' | 'INVERT' | 'RANDOM' | 'ALTERNATE';

export interface XkpasswdConfig {
  symbol_alphabet: string;
  word_length_min: number;
  word_length_max: number;
  num_words: number;
  separator_type: SeparatorType;
  separator_character: string;
  separator_alphabet?: string;
  padding_digits_before: number;
  padding_digits_after: number;
  padding_type: PaddingType;
  padding_character_type: PaddingCharacterType;
  padding_character: string;
  padding_alphabet?: string;
  padding_characters_before: number;
  padding_characters_after: number;
  pad_to_length?: number;
  case_transform: CaseTransform;
  allow_accents?: number;
  random_increment?: string;
}

export interface StoredPreset {
  id: string;
  name: string;
  description: string;
  config: XkpasswdConfig;
}

export interface ExtensionConfig {
  numPasswords: number;
  activePresetId: string;
  customPresets: StoredPreset[];
  customConfig: XkpasswdConfig;
  enableInsertion: boolean;
  dictionaryId: string;
}

export const DEFAULT_XKPASSWD_CONFIG: XkpasswdConfig = {
  symbol_alphabet: '!@$%^&*-_+=:|~?/.;',
  word_length_min: 4,
  word_length_max: 8,
  num_words: 3,
  case_transform: 'CAPITALISE',
  separator_type: 'RANDOM',
  separator_character: '',
  padding_digits_before: 2,
  padding_digits_after: 2,
  padding_type: 'FIXED',
  padding_character_type: 'RANDOM',
  padding_character: '',
  padding_characters_before: 2,
  padding_characters_after: 2,
  allow_accents: 0,
  random_increment: 'AUTO',
};

export const DEFAULT_CONFIG: ExtensionConfig = {
  numPasswords: 3,
  activePresetId: 'DEFAULT',
  customPresets: [],
  customConfig: DEFAULT_XKPASSWD_CONFIG,
  enableInsertion: true,
  dictionaryId: 'EN',
};

export function mergeConfig(partial?: Partial<ExtensionConfig>): ExtensionConfig {
  return {
    ...DEFAULT_CONFIG,
    ...partial,
    customConfig: {
      ...DEFAULT_XKPASSWD_CONFIG,
      ...(partial?.customConfig ?? {}),
    },
    customPresets: partial?.customPresets ?? DEFAULT_CONFIG.customPresets,
  };
}

export function cloneConfig(config: ExtensionConfig): ExtensionConfig {
  return JSON.parse(JSON.stringify(config)) as ExtensionConfig;
}
