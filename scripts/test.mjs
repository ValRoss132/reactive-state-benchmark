import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const seedRandom = (seed) => {
	const x = Math.sin(seed) * 1000
	return x - Math.floor(x)
}

const stats = (data) => {
	const sorted = [...data].sort((a, b) => a - b)
	const percentile = (probability) => {
		const position = (sorted.length - 1) * probability
		const lower = Math.floor(position)
		const upper = Math.ceil(position)
		const weight = position - lower
		return sorted[lower] + (sorted[upper] - sorted[lower]) * weight
	}
	const mean = data.reduce((sum, value) => sum + value, 0) / data.length
	const variance =
		data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
		data.length
	return {
		mean,
		median: percentile(0.5),
		min: sorted[0],
		max: sorted[sorted.length - 1],
		standardDeviation: Math.sqrt(variance),
		p95: percentile(0.95),
		p99: percentile(0.99),
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

test('interpolated p95 and p99 are not forced to the same index', () => {
	const result = stats(Array.from({ length: 15 }, (_, index) => index + 1))
	assert.notEqual(result.p95, result.p99)
	assert.ok(result.p99 > result.p95)
	assert.ok(result.p99 < result.max)
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

test('benchmark history uses sessions rather than replacing reports', async () => {
	const app = await readFile('src/App.tsx', 'utf8')
	const sessions = await readFile('src/core/sessions.ts', 'utf8')
	assert.match(app, /BenchmarkRunSession/)
	assert.match(app, /updateSessions\(\(previous\) => \[activeSession, \.\.\.previous\]\)/)
	assert.match(sessions, /createRunSession/)
	assert.match(sessions, /appendResultToSession/)
	assert.match(sessions, /calculateSessionSummary/)
})

test('CSV export contains processed and raw sections with adapter groups', async () => {
	const exportResults = await readFile('src/utils/exportResults.ts', 'utf8')
	assert.match(exportResults, /SECTION.*PROCESSED_RESULTS/s)
	assert.match(exportResults, /SECTION.*RAW_MEASUREMENTS/s)
	assert.match(exportResults, /adapter_group/)
	assert.match(exportResults, /state-core/)
	assert.match(exportResults, /ui-coupled/)
})

test('methodology and documentation tabs are available', async () => {
	const app = await readFile('src/App.tsx', 'utf8')
	const methodology = await readFile('src/components/MethodologyView.tsx', 'utf8')
	const documentation = await readFile('src/components/DocumentationView.tsx', 'utf8')
	assert.match(app, /Методология/)
	assert.match(app, /Документация/)
	assert.match(methodology, /browser-based benchmark/)
	assert.match(documentation, /iterations/)
	assert.doesNotMatch(documentation, /FAQ/)
})

test('VKR integration block is not rendered anymore', async () => {
	const app = await readFile('src/App.tsx', 'utf8')
	const reportView = await readFile('src/components/ReportView.tsx', 'utf8')
	assert.doesNotMatch(app, /Интеграция для ВКР|VKR integration/)
	assert.doesNotMatch(reportView, /Интеграция для ВКР|VKR integration|выводов ВКР/)
})

test('failed benchmark results are represented in session model', async () => {
	const app = await readFile('src/App.tsx', 'utf8')
	const sessions = await readFile('src/core/sessions.ts', 'utf8')
	assert.match(app, /createFailedResult/)
	assert.match(sessions, /completed_with_errors/)
	assert.match(sessions, /status: 'failed'/)
})

test('run history is persisted in localStorage and selected exports are supported', async () => {
	const app = await readFile('src/App.tsx', 'utf8')
	const history = await readFile('src/core/history.ts', 'utf8')
	const reportView = await readFile('src/components/ReportView.tsx', 'utf8')
	assert.match(history, /reactive-bench:run-history/)
	assert.match(history, /saveRunHistory/)
	assert.match(app, /loadRunHistory/)
	assert.match(reportView, /selectedSessionId/)
	assert.match(reportView, /Export selected CSV/)
})
