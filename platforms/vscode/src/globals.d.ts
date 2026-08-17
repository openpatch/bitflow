/// <reference types="vite/client" />

// The webview imports a stylesheet; esbuild handles it, TypeScript needs telling.
declare module "*.css";
