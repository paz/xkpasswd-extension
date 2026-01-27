# XKPasswd Extension (MV3)

Offline, cross-browser XKPasswd-style password generator built with Manifest V3 and the official [bartificer/xkpasswd-js](https://github.com/bartificer/xkpasswd-js) library. The xkpasswd-js library is included as a git submodule and bundled locally (no remote JS).

## Prerequisites

- Node.js 18+
- npm

## Repo setup

```bash
git submodule update --init --recursive
```

Pinned xkpasswd-js commit:

```
84ad09ab9cc30fb4b923b19a2d1e164daa8ca287
```

## Install

```bash
npm install
```

## Build

```bash
npm run build
```

Build outputs:

- `dist/chromium/` (Chrome/Edge MV3)
- `dist/firefox/` (Firefox MV3)
- Icons are shipped as SVGs in `public/icons/`.

### Build individual targets

```bash
npm run build:chromium
npm run build:firefox
```

## Load the extension

### Chrome / Edge

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select `dist/chromium`.

### Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on**.
3. Select `dist/firefox/manifest.json`.

## Update the submodule

```bash
git submodule update --remote vendor/xkpasswd-js
```

## Smoke test

```bash
npm run test:smoke
```

## License

MIT. See `LICENSE` and `THIRD_PARTY_NOTICES.md`.
