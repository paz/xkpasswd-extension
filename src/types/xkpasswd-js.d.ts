declare module '../../vendor/xkpasswd-js/src/xkpasswd.mjs' {
  export class XKPasswd {
    setPreset(presetId: string): void;
    setCustomPreset(config: Record<string, unknown>): void;
    generatePassword(count: number): {passwords: string[]};
  }
}

declare module '../../vendor/xkpasswd-js/src/presets.mjs' {
  export class Presets {
    constructor(presetId?: string);
    getPresets(): string[];
    getCurrent(): {config: Record<string, unknown>};
    description(): string;
  }
}
