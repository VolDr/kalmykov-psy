import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		setupFiles: ['./src/tests/setup.ts'],
		globals: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			reportsDirectory: './coverage',
			include: ['src/lib/**/*.ts'],
			exclude: [
				'src/lib/components/**',
				'src/lib/server/**',
				'src/lib/data/**',
				'src/lib/types/**',
				'**/index.ts',
				'**/*.d.ts',
				'**/*.test.ts',
				'**/*.spec.ts'
			]
		}
	}
});
