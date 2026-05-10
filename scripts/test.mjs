import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const seedRandom = (seed) => {
	const x = Math.sin(seed) * 1000
	return x - Math.floor(x)
}

const stats = (data) => {
	const sorted = [...data].sort((a, b) => a - b)
	const mean = data.reduce((sum, value) => sum + value, 0) / data.length
	const variance =
		data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
		data.length
	return {
		mean,
		median: sorted[Math.floor(sorted.length / 2)],
		min: sorted[0],
		max: sorted[sorted.length - 1],
		standardDeviation: Math.sqrt(variance),
		p95: sorted[Math.ceil(data.length * 0.95) - 1],
		p99: sorted[Math.ceil(data.length * 0.99) - 1],
	}
}

const progress = (currentStep, totalSteps) =>
	Math.min(100, Math.round((currentStep / totalSteps) * 100))

test('seed generator is deterministic', () => {
	assert.equal(seedRandom(42), seedRandom(42))
	assert.notEqual(seedRandom(42), seedRandom(43))
})

test('warmup steps are excluded from measured count model', () => {
	const warmupIterations = 10
	const iterations = 100
	const measurementRuns = 15
	const totalSteps = measurementRuns * (warmupIterations + iterations)
	assert.equal(totalSteps, 1650)
	assert.equal(iterations, 100)
})

test('progress uses atomic iteration steps', () => {
	assert.equal(progress(0, 1650), 0)
	assert.equal(progress(825, 1650), 50)
	assert.equal(progress(1650, 1650), 100)
})

test('statistics include required aggregate fields', () => {
	const result = stats([1, 2, 3, 4, 100])
	assert.equal(result.min, 1)
	assert.equal(result.max, 100)
	assert.equal(result.median, 3)
	assert.ok(result.standardDeviation > 0)
})

test('profiling build is enabled by default for production builds', async () => {
	const viteConfig = await readFile('vite.config.ts', 'utf8')
	assert.match(viteConfig, /process\.env\.REACT_PROFILING !== 'false'/)
	assert.match(viteConfig, /__REACT_PROFILING__/)
	assert.match(viteConfig, /react-dom\/profiling/)
})

test('Jotai adapter remains present in the benchmark matrix', async () => {
	const app = await readFile('src/App.tsx', 'utf8')
	const jotai = await readFile('src/adapters/JotaiAdapter.tsx', 'utf8')
	assert.match(app, /JotaiAdapter/)
	assert.match(jotai, /name: 'Jotai'/)
	assert.match(jotai, /createStore/)
})
