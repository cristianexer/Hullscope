import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { yachtDevelopmentAssets } from './scripts/yachts/devPlugin';
export default defineConfig({base:'/Hullscope/',plugins:[react(),yachtDevelopmentAssets()],test:{include:['tests/**/*.test.ts']},build:{chunkSizeWarningLimit:1200}});
