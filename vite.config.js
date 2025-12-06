import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    base: '/chess-siege/',
    plugins: [plugin()],
    server: {
        port: 56383,
    }
})