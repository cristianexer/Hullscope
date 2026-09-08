import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({base:'/Hullscope/',plugins:[react()],test:{include:['tests/**/*.test.ts']},build:{chunkSizeWarningLimit:1200}});
