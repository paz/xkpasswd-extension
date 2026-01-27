import {defineConfig} from 'vite';
import path from 'node:path';
import fs from 'node:fs';

function manifestPlugin(target: 'chromium' | 'firefox') {
  return {
    name: 'copy-manifest',
    closeBundle() {
      const source = path.resolve(__dirname, 'src/manifest', `manifest.${target}.json`);
      const outDir = path.resolve(__dirname, 'dist', target);
      fs.mkdirSync(outDir, {recursive: true});
      fs.copyFileSync(source, path.join(outDir, 'manifest.json'));
    },
  };
}

export default defineConfig(({mode}) => {
  const target = mode === 'firefox' ? 'firefox' : 'chromium';
  const root = path.resolve(__dirname, 'src');

  return {
    root,
    publicDir: path.resolve(__dirname, 'public'),
    resolve: {
      alias: {
        '@': root,
      },
    },
    build: {
      outDir: path.resolve(__dirname, 'dist', target),
      emptyOutDir: true,
      sourcemap: false,
      rollupOptions: {
        input: {
          popup: path.resolve(root, 'ui/popup/index.html'),
          options: path.resolve(root, 'ui/options/index.html'),
          background: path.resolve(root, 'background/sw.ts'),
          content: path.resolve(root, 'content/insert.ts'),
        },
        output: {
          entryFileNames(chunk) {
            if (chunk.name === 'background') {
              return 'background/sw.js';
            }
            if (chunk.name === 'content') {
              return 'content/insert.js';
            }
            return 'assets/[name]-[hash].js';
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
    },
    server: {
      fs: {
        allow: [root, path.resolve(__dirname, 'vendor')],
      },
    },
    plugins: [manifestPlugin(target)],
  };
});
