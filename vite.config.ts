import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pkg from './package.json' with { type: 'json' }

const getGitCommit = () => {
	try {
		return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
	} catch {
		return 'unknown'
	}
}

// https://vite.dev/config/
export default defineConfig(({ command }) => {
	const profilingBuild =
		command === 'build' && process.env.REACT_PROFILING !== 'false'
	const libraryVersions = {
		react: pkg.dependencies.react,
		'react-dom': pkg.dependencies['react-dom'],
		jotai: pkg.dependencies.jotai,
		zustand: pkg.dependencies.zustand,
		'@reduxjs/toolkit': pkg.dependencies['@reduxjs/toolkit'],
		mobx: pkg.dependencies.mobx,
		'mobx-react-lite': pkg.dependencies['mobx-react-lite'],
	}

	return {
		base: process.env.BASE_PATH ?? '/',
		plugins: [react()],
		define: {
			__REACT_PROFILING__: JSON.stringify(profilingBuild),
			__APP_VERSION__: JSON.stringify(pkg.version),
			__GIT_COMMIT__: JSON.stringify(getGitCommit()),
			__LIBRARY_VERSIONS__: JSON.stringify(libraryVersions),
			'import.meta.env.REACT_PROFILING': JSON.stringify(
				profilingBuild ? 'true' : 'false',
			),
		},
		resolve: {
			alias: profilingBuild
				? [
						{
							find: /^react-dom\/client$/,
							replacement: 'react-dom/profiling',
						},
					]
				: undefined,
		},
	}
})
