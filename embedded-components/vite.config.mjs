import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import dts from 'vite-plugin-dts';
import { libInjectCss } from 'vite-plugin-lib-inject-css';
import tsconfigPaths from 'vite-tsconfig-paths';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const isAnalyze = mode === 'analyze';

  return {
    plugins: [
      react(),
      tsconfigPaths(),
      dts({ rollupTypes: true }),
      libInjectCss(),
      isAnalyze &&
        visualizer({
          open: true,
          filename: 'dist/stats.html',
          gzipSize: true,
          brotliSize: true,
          template: 'treemap', // sunburst, treemap, network
        }),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    test: {
      // Keep test discovery constrained for Vitest v4 performance and predictability.
      dir: './src',
      // Coverage-instrumented runs are slower in Vitest v4; keep UI/form tests stable.
      testTimeout: 20000,
      globals: true,
      environment: 'jsdom',
      setupFiles: './vitest.setup.mjs',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        // Vitest v4 includes only covered files by default; define include explicitly.
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          '**/*.test.{ts,tsx}',
          '**/*.story.{ts,tsx}',
          '**/*.d.ts',
          '**/api/generated/**',
          '**/node_modules/**',
        ],
      },
    },
    build: {
      lib: {
        entry: [resolve(__dirname, 'src/index.tsx')],
        name: 'ef-components',
        formats: ['esm', 'umd'],
        fileName: (format) => `${format}/ef-components.js`,
      },
      rollupOptions: {
        external: ['react', 'react-dom'],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
          },
        },
      },
    },
    define: {
      'process.env': env,
    },
  };
});
