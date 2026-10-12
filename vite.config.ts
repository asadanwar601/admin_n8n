import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'N8nAdminWidget',
      fileName: (format) => {
        if (format === 'es') return 'admin-widget.es.js';
        if (format === 'cjs') return 'admin-widget.cjs.js';
        return 'admin-widget.bundle.js';
      },
      formats: ['es', 'cjs', 'umd'],
      cssFileName: 'style',
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'style.css';
          return assetInfo.name || '';
        },
      },
    },
  },
});
