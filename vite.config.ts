import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	const profilingBuild =
		mode === 'production' && process.env.REACT_PROFILING === 'true'

	return {
		plugins: [react()],
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
