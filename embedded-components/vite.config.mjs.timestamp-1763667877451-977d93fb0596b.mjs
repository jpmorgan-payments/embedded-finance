// vite.config.mjs
import { resolve } from "path";
import react from "file:///C:/code/embedded-banking/embedded-components/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { defineConfig, loadEnv } from "file:///C:/code/embedded-banking/embedded-components/node_modules/vite/dist/node/index.js";
import dts from "file:///C:/code/embedded-banking/embedded-components/node_modules/vite-plugin-dts/dist/index.mjs";
import { libInjectCss } from "file:///C:/code/embedded-banking/embedded-components/node_modules/vite-plugin-lib-inject-css/dist/index.js";
import tsconfigPaths from "file:///C:/code/embedded-banking/embedded-components/node_modules/vite-tsconfig-paths/dist/index.js";
var __vite_injected_original_dirname = "C:\\code\\embedded-banking\\embedded-components";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [
      react(),
      tsconfigPaths(),
      dts({ rollupTypes: true }),
      libInjectCss()
    ],
    resolve: {
      alias: {
        "@": resolve(__vite_injected_original_dirname, "./src")
      }
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./vitest.setup.mjs"
    },
    build: {
      lib: {
        entry: [resolve(__vite_injected_original_dirname, "src/index.tsx")],
        name: "ef-components",
        formats: ["esm", "umd"],
        fileName: (format) => `${format}/ef-components.js`
      },
      rollupOptions: {
        external: ["react", "react-dom"],
        output: {
          globals: {
            react: "React",
            "react-dom": "ReactDOM"
          }
        }
      }
    },
    define: {
      "process.env": env
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubWpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcY29kZVxcXFxlbWJlZGRlZC1iYW5raW5nXFxcXGVtYmVkZGVkLWNvbXBvbmVudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXGNvZGVcXFxcZW1iZWRkZWQtYmFua2luZ1xcXFxlbWJlZGRlZC1jb21wb25lbnRzXFxcXHZpdGUuY29uZmlnLm1qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovY29kZS9lbWJlZGRlZC1iYW5raW5nL2VtYmVkZGVkLWNvbXBvbmVudHMvdml0ZS5jb25maWcubWpzXCI7aW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xyXG5pbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJztcclxuaW1wb3J0IGR0cyBmcm9tICd2aXRlLXBsdWdpbi1kdHMnO1xyXG5pbXBvcnQgeyBsaWJJbmplY3RDc3MgfSBmcm9tICd2aXRlLXBsdWdpbi1saWItaW5qZWN0LWNzcyc7XHJcbmltcG9ydCB0c2NvbmZpZ1BhdGhzIGZyb20gJ3ZpdGUtdHNjb25maWctcGF0aHMnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xyXG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSk7XHJcbiAgcmV0dXJuIHtcclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgcmVhY3QoKSxcclxuICAgICAgdHNjb25maWdQYXRocygpLFxyXG4gICAgICBkdHMoeyByb2xsdXBUeXBlczogdHJ1ZSB9KSxcclxuICAgICAgbGliSW5qZWN0Q3NzKCksXHJcbiAgICBdLFxyXG4gICAgcmVzb2x2ZToge1xyXG4gICAgICBhbGlhczoge1xyXG4gICAgICAgICdAJzogcmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIHRlc3Q6IHtcclxuICAgICAgZ2xvYmFsczogdHJ1ZSxcclxuICAgICAgZW52aXJvbm1lbnQ6ICdqc2RvbScsXHJcbiAgICAgIHNldHVwRmlsZXM6ICcuL3ZpdGVzdC5zZXR1cC5tanMnLFxyXG4gICAgfSxcclxuICAgIGJ1aWxkOiB7XHJcbiAgICAgIGxpYjoge1xyXG4gICAgICAgIGVudHJ5OiBbcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvaW5kZXgudHN4JyldLFxyXG4gICAgICAgIG5hbWU6ICdlZi1jb21wb25lbnRzJyxcclxuICAgICAgICBmb3JtYXRzOiBbJ2VzbScsICd1bWQnXSxcclxuICAgICAgICBmaWxlTmFtZTogKGZvcm1hdCkgPT4gYCR7Zm9ybWF0fS9lZi1jb21wb25lbnRzLmpzYCxcclxuICAgICAgfSxcclxuICAgICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICAgIGV4dGVybmFsOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbSddLFxyXG4gICAgICAgIG91dHB1dDoge1xyXG4gICAgICAgICAgZ2xvYmFsczoge1xyXG4gICAgICAgICAgICByZWFjdDogJ1JlYWN0JyxcclxuICAgICAgICAgICAgJ3JlYWN0LWRvbSc6ICdSZWFjdERPTScsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgZGVmaW5lOiB7XHJcbiAgICAgICdwcm9jZXNzLmVudic6IGVudixcclxuICAgIH0sXHJcbiAgfTtcclxufSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBZ1UsU0FBUyxlQUFlO0FBQ3hWLE9BQU8sV0FBVztBQUNsQixTQUFTLGNBQWMsZUFBZTtBQUN0QyxPQUFPLFNBQVM7QUFDaEIsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxtQkFBbUI7QUFMMUIsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDeEMsUUFBTSxNQUFNLFFBQVEsTUFBTSxRQUFRLElBQUksQ0FBQztBQUN2QyxTQUFPO0FBQUEsSUFDTCxTQUFTO0FBQUEsTUFDUCxNQUFNO0FBQUEsTUFDTixjQUFjO0FBQUEsTUFDZCxJQUFJLEVBQUUsYUFBYSxLQUFLLENBQUM7QUFBQSxNQUN6QixhQUFhO0FBQUEsSUFDZjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxNQUNqQztBQUFBLElBQ0Y7QUFBQSxJQUNBLE1BQU07QUFBQSxNQUNKLFNBQVM7QUFBQSxNQUNULGFBQWE7QUFBQSxNQUNiLFlBQVk7QUFBQSxJQUNkO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDTCxLQUFLO0FBQUEsUUFDSCxPQUFPLENBQUMsUUFBUSxrQ0FBVyxlQUFlLENBQUM7QUFBQSxRQUMzQyxNQUFNO0FBQUEsUUFDTixTQUFTLENBQUMsT0FBTyxLQUFLO0FBQUEsUUFDdEIsVUFBVSxDQUFDLFdBQVcsR0FBRyxNQUFNO0FBQUEsTUFDakM7QUFBQSxNQUNBLGVBQWU7QUFBQSxRQUNiLFVBQVUsQ0FBQyxTQUFTLFdBQVc7QUFBQSxRQUMvQixRQUFRO0FBQUEsVUFDTixTQUFTO0FBQUEsWUFDUCxPQUFPO0FBQUEsWUFDUCxhQUFhO0FBQUEsVUFDZjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsUUFBUTtBQUFBLE1BQ04sZUFBZTtBQUFBLElBQ2pCO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
