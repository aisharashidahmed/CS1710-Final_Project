import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-static writes plain HTML/JS/CSS into build/ so GitHub Pages can host it.
			adapter: adapter(),

			// GitHub Pages serves this repo at /CS1710-Final_Project/. The deploy
			// workflow sets BASE_PATH; locally it is empty so `npm run dev` works at /.
			paths: {
				base: process.env.BASE_PATH ?? ''
			}
		})
	]
});
