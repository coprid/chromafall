import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' keeps assets working from any path — GitHub Pages subfolder,
// Vercel, Netlify, or a plain static host — with zero reconfiguration.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist', assetsDir: 'assets' },
});