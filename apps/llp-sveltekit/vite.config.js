import { sveltekit } from '@sveltejs/kit/vite';
import commonjs from 'vite-plugin-commonjs';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit(), commonjs()],

	optimizeDeps: {
		exclude: ['canvas'],
	  },
	  build: {
		rollupOptions: {
		  external: ['canvas'],
		},
	  },

	css: {
		preprocessorOptions: {
			scss: {
				additionalData: '@use "src/variables.scss" as *;'
			}
		}
	},
	ssr: {
		// fix popperjs import error https://github.com/sveltejs/kit/issues/2161#issuecomment-1252026388
        noExternal: ['@popperjs/core']
    }
};

export default config;
