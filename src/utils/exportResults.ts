import type { FullReport } from '../core/types'

const download = (content: string, type: string, fileName: string) => {
	const blob = new Blob([content], { type })
	const url = URL.createObjectURL(blob)
	const link = document.createElement('a')
	link.href = url
	link.download = fileName
	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
	URL.revokeObjectURL(url)
}

const escapeCsv = (value: unknown) => {
	const text = String(value ?? 'unknown')
	return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export const buildMarkdownSummary = (reports: FullReport[]) => {
	const rows = reports.map((report) =>
		[
			report.adapterName,
			report.scenarioName,
			report.config.iterations,
			report.config.warmupIterations,
			report.config.measurementRuns,
			report.config.seed,
			report.stateCore.mean.toFixed(6),
			report.stateCore.median.toFixed(6),
			report.stateCore.p95.toFixed(6),
			report.stateCore.p99.toFixed(6),
			report.opsPerSec.toFixed(2),
		].join(' | '),
	)

	return [
		'| Adapter | Scenario | Iterations | Warmup | Runs | Seed | Mean, ms | Median, ms | P95, ms | P99, ms | Ops/s |',
		'|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
		...rows.map((row) => `| ${row} |`),
	].join('\n')
}

export const exportReportsToJSON = (reports: FullReport[]) => {
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
	download(
		JSON.stringify(
			{
				timestamp,
				reports,
			},
			null,
			2,
		),
		'application/json;charset=utf-8',
		`reactive-bench-${timestamp}.json`,
	)
}

export const exportReportsToCSV = (reports: FullReport[]) => {
	const headers = [
		'adapter',
		'scenario',
		'iterations',
		'warmupIterations',
		'measurementRuns',
		'seed',
		'mean',
		'median',
		'min',
		'max',
		'stdDev',
		'p95',
		'p99',
		'opsPerSec',
		'totalTimeMs',
		'profilingEnabled',
		'browser',
		'os',
		'gitCommitHash',
		'timestamp',
	]
	const rows = reports.map((report) => [
		report.adapterName,
		report.scenarioName,
		report.config.iterations,
		report.config.warmupIterations,
		report.config.measurementRuns,
		report.config.seed,
		report.stateCore.mean,
		report.stateCore.median,
		report.stateCore.min,
		report.stateCore.max,
		report.stateCore.standardDeviation,
		report.stateCore.p95,
		report.stateCore.p99,
		report.opsPerSec,
		report.totalTimeMs,
		report.environment?.profilingEnabled,
		`${report.environment?.browserName} ${report.environment?.browserVersion}`,
		report.environment?.os,
		report.environment?.gitCommitHash,
		report.environment?.timestamp,
	])
	const csv = [headers, ...rows]
		.map((row) => row.map(escapeCsv).join(','))
		.join('\n')
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
	download(`\ufeff${csv}`, 'text/csv;charset=utf-8', `reactive-bench-${timestamp}.csv`)
}

export const copyMarkdownSummary = async (reports: FullReport[]) => {
	await navigator.clipboard.writeText(buildMarkdownSummary(reports))
}
