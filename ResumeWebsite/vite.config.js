import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// https://vitejs.dev/config/
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, '.', '');
    return {
        plugins: [react()],
        define: {
            // Expose the API key to the app code
            'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY)
        }
    };
});
