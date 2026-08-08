/// <reference types="vite/client" />

// ── Dialect .md files imported as raw strings ──
declare module '*.md?raw' {
  const content: string;
  export default content;
}
