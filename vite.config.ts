import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), devtoolsJson()],
	server: {
		proxy: {
			'/proxy': {
				target: 'http://localhost:5173/api/proxy',
				changeOrigin: true,
				rewrite: path => path.replace(/^\/proxy/, '')
			}
		}
	}
});
