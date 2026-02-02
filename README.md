# XKPasswd Extension

A modern, offline password generator browser extension built with Manifest V3 and the official [bartificer/xkpasswd-js](https://github.com/bartificer/xkpasswd-js) library.

## Features

- **Secure & Offline**: Generate memorable passwords completely offline using the official xkpasswd-js library
- **Modern UI**: Clean, polished interface with dark mode support
- **Password Strength Indicator**: Real-time entropy calculation and crack time estimates
- **Flexible Presets**: Choose from built-in presets or create your own custom configurations
- **Cross-Browser**: Supports Chrome, Edge, and Firefox with Manifest V3
- **Right-Click Integration**: Insert passwords directly into input fields via context menu
- **Customizable**: Fine-tune word length, separators, padding, case transforms, and more
- **Type-Safe**: Built with TypeScript for reliability and maintainability
- **Well-Tested**: Comprehensive test suite with Vitest

## Prerequisites

- Node.js 20+
- npm

## Setup

1. Clone the repository with submodules:

```bash
git clone --recursive https://github.com/paz/xkpasswd-extension.git
cd xkpasswd-extension
```

Or if you already cloned without submodules:

```bash
git submodule update --init --recursive
```

2. Install dependencies:

```bash
npm install
```

## Development

### Build for Production

```bash
npm run build
```

Build outputs:
- `dist/chromium/` - Chrome/Edge MV3
- `dist/firefox/` - Firefox MV3

### Build Individual Targets

```bash
npm run build:chromium  # Chrome/Edge only
npm run build:firefox   # Firefox only
```

### Development Mode

```bash
npm run dev
```

### Run Tests

```bash
npm test              # Run tests
npm run test:ui       # Run tests with UI
npm run test:smoke    # Run smoke test
```

### Code Quality

```bash
npm run lint          # Lint code
npm run lint:fix      # Fix linting issues
npm run format        # Format code with Prettier
npm run typecheck     # Type check TypeScript
```

## Load the Extension

### Chrome / Edge

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select `dist/chromium`

### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `dist/firefox/manifest.json`

## Project Structure

```
xkpasswd-extension/
├── src/
│   ├── background/       # Service worker
│   ├── content/          # Content scripts
│   ├── core/             # Core logic
│   │   ├── config.ts     # Configuration management
│   │   ├── generator.ts  # Password generation
│   │   ├── storage.ts    # Storage operations
│   │   └── strength.ts   # Password strength calculator
│   ├── manifest/         # Browser-specific manifests
│   ├── types/            # TypeScript definitions
│   └── ui/               # User interface
│       ├── popup/        # Extension popup
│       └── options/      # Options page
├── vendor/               # Git submodule (xkpasswd-js)
├── test/                 # Test files
└── dist/                 # Build output
```

## Technology Stack

- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **Vitest** - Modern testing framework
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **xkpasswd-js** - Password generation library

## xkpasswd-js Submodule

The extension uses xkpasswd-js as a git submodule, pinned to commit:

```
84ad09ab9cc30fb4b923b19a2d1e164daa8ca287
```

To update the submodule:

```bash
git submodule update --remote vendor/xkpasswd-js
```

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run tests and linting: `npm test && npm run lint`
4. Format code: `npm run format`
5. Submit a pull request

## License

MIT. See `LICENSE` and `THIRD_PARTY_NOTICES.md` for details.

## Acknowledgments

- [bartificer/xkpasswd-js](https://github.com/bartificer/xkpasswd-js) - The official XKPasswd library
- [xkpasswd.net](https://www.xkpasswd.net/) - The original XKPasswd web service
