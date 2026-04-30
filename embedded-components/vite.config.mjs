import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { libInjectCss } from 'vite-plugin-lib-inject-css';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
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
      // Required for files outside tsconfig include (e.g. vitest.setup.mjs).
      // tsconfigPaths() only resolves '@/*' for files within the tsconfig scope.
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
          '**/*.stories.{ts,tsx}',
          '**/*.fixtures.{ts,tsx}',
          '**/*.mdx',
          '**/.storybook/**',
          '**/stories/**',
          '**/fixtures/**',
          '**/*.d.ts',
          '**/api/generated/**',
          '**/node_modules/**',
        ],
      },
    },
    build: {
      // Use es2020 for compatibility with webpack-based consumers.
      // 'esnext' emits native private class fields (#field) which older webpack
      // versions can't re-bundle correctly, causing "Super constructor null" errors.
      target: 'es2020',
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
        onLog(level, log, handler) {
          // Suppress sourcemap warnings from transformed files (e.g. from dts, react plugin).
          // These are informational and don't affect the build output.
          if (
            log.cause &&
            log.cause.message === `Can't resolve original location of error.`
          ) {
            return;
          }
          handler(level, log);
        },
      },
    },
    define: {
      // Only replace process.env.NODE_ENV — NOT the whole process.env object.
      // The previous `'process.env': loadEnv(mode)` replaced the entire object with
      // only VITE_-prefixed vars, making process.env.NODE_ENV accidentally undefined.
      // For VITE_* vars, use import.meta.env.VITE_* which Vite handles natively.
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
  };
});
