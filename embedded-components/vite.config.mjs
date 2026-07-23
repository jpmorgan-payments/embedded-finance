import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, esmExternalRequirePlugin } from 'vite';
import dts from 'vite-plugin-dts';
import { libInjectCss } from 'vite-plugin-lib-inject-css';

// Peer deps that must stay external. Include react/jsx-runtime — Vite 8 /
// Rolldown leaves require() for externals as-is; without converting those to
// ESM imports, browser consumers throw:
// "Calling `require` for \"react\" in an environment that doesn't expose require".
const reactExternals = [
  'react',
  'react-dom',
  'react-dom/client',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
];

export default defineConfig(({ mode }) => {
  const isAnalyze = mode === 'analyze';

  return {
    plugins: [
      react(),
      // Vite 8 (Rolldown): convert require('react') from bundled CJS deps into
      // ESM imports so the library ESM/UMD builds work in the browser.
      esmExternalRequirePlugin({
        external: reactExternals,
        // Also listed under build.rolldownOptions.external for globals / UMD.
        skipDuplicateCheck: true,
      }),
      // `bundleTypes` (renamed from `rollupTypes` in vite-plugin-dts 5 /
      // unplugin-dts) rolls all declarations into a single dist/index.d.ts via
      // @microsoft/api-extractor (an optional peer dep that must be installed).
      dts({ bundleTypes: true }),
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
      // Vite 8 resolves tsconfig `paths` natively, replacing the
      // vite-tsconfig-paths plugin (which dominated build-plugin time). Covers
      // '@/*', '@test-utils', and '@storybook-themes' from tsconfig.json.
      tsconfigPaths: true,
      // Manual '@' alias for files outside the tsconfig `include` scope
      // (e.g. vitest.setup.mjs), which native tsconfigPaths does not resolve.
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
        reporter: ['text', 'html', 'lcov'],
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
      // Vite 8: prefer rolldownOptions (rollupOptions remains a deprecated alias).
      rolldownOptions: {
        external: reactExternals,
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            'react-dom/client': 'ReactDOM',
            'react/jsx-runtime': 'jsxRuntime',
            'react/jsx-dev-runtime': 'jsxRuntime',
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
