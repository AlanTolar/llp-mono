import { sveltekit } from '@sveltejs/kit/vite';
import commonjs from 'vite-plugin-commonjs';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit(), commonjs()],

	css: {
		preprocessorOptions: {
			scss: {
				additionalData: '@use "src/variables.scss" as *;'
			}
		}
	}
};

export default config;
