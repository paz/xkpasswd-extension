# Upstream Notes: xkpasswd-js

## Entrypoints

- Primary class: `vendor/xkpasswd-js/src/xkpasswd.mjs` (exports `XKPasswd`).
- Presets helper: `vendor/xkpasswd-js/src/presets.mjs` (exports `Presets`).
- English dictionary: `vendor/xkpasswd-js/src/dictionaryEN.mjs` (used by `XKPasswd`).

## Minimal usage

```js
import {XKPasswd} from './vendor/xkpasswd-js/src/xkpasswd.mjs';

const generator = new XKPasswd();
const {passwords} = generator.generatePassword(1);
console.log(passwords[0]);
```

## Config shape

The generator expects a configuration object with keys such as:

- `word_length_min`, `word_length_max`
- `num_words`
- `separator_type` (`NONE`, `RANDOM`, `FIXED`) and `separator_character`
- `padding_type` (`NONE`, `FIXED`, `ADAPTIVE`)
- `padding_character_type` (`RANDOM`, `FIXED`)
- `padding_digits_before`, `padding_digits_after`
- `padding_characters_before`, `padding_characters_after`
- `case_transform`
- `symbol_alphabet`, optional `separator_alphabet` and `padding_alphabet`

Presets are defined in `vendor/xkpasswd-js/src/presets.mjs` and can be selected by name via `new Presets('DEFAULT')` or `XKPasswd#setPreset('DEFAULT')`.

## Dictionary assets

The English word list is embedded directly in `vendor/xkpasswd-js/src/dictionaryEN.mjs` and is loaded by default by `XKPasswd`. No external dictionary files are required.

## License / attribution

`xkpasswd-js` is licensed under ISC (see `vendor/xkpasswd-js/LICENSE`). Ensure the license text is included in `THIRD_PARTY_NOTICES.md`.
