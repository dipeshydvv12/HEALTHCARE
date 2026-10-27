import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { twilioDevServerPlugin } from './server/twilioService';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), twilioDevServerPlugin()],
  server: {
    port: 3001,
    open: false,
    host: true
  }
});
