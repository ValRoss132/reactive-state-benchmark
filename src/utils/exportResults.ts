import type {
	AdapterGroup,
	BenchmarkRunSession,
	BenchmarkStats,
} from '../core/types'

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

const csvRow = (row: unknown[]) => row.map(escapeCsv).join(',')

const metricGroups: Array<{
	group: AdapterGroup
	label: string
	select: (stats: { stateCore: BenchmarkStats; uiCoupled: BenchmarkStats }) => BenchmarkStats
}> = [
	{
		group: 'state-core',
		label: 'State-core',
		select: (stats) => stats.stateCore,
	},
	{
		group: 'ui-coupled',
		label: 'UI-coupled',
		select: (stats) => stats.uiCoupled,
	},
]

const sortedSessions = (sessions: BenchmarkRunSession[]) =>
	[...sessions].sort((a, b) => a.startedAt.localeCompare(b.startedAt))

export const buildBenchmarkCSV = (sessions: BenchmarkRunSession[]) => {
	const lines: string[] = []

	lines.push(csvRow(['SECTION', 'PROCESSED_RESULTS']))
	lines.push(
		csvRow([
			'session_id',
			'session_title',
			'run_kind',
			'session_status',
			'adapter_group',
			'adapter',
			'scenario',
			'result_status',
			'error',
			'seed',
			'iterations',
			'warmup_iterations',
			'measurement_runs',
			'initial_size',
			'subscriber_count',
			'operation_mix',
			'mean',
			'median',
			'min',
			'max',
			'std_dev',
			'p95',
			'p99',
			'cv',
			'ops_per_sec',
			'total_time_ms',
			'timestamp',
			'environment_id',
		]),
	)

	for (const session of sortedSessions(sessions)) {
		const results = [...session.results].sort(
			(a, b) =>
				a.adapterGroup.localeCompare(b.adapterGroup) ||
				a.scenario.localeCompare(b.scenario) ||
				a.adapter.localeCompare(b.adapter),
		)
		for (const result of results) {
			for (const metricGroup of metricGroups) {
				const stats = result.metrics ? metricGroup.select(result.metrics) : undefined
				lines.push(
					csvRow([
						session.id,
						session.title,
						session.kind,
						session.status,
						metricGroup.group,
						result.adapter,
						result.scenario,
						result.status,
						result.error ?? '',
						session.config.seed,
						session.config.iterations,
						session.config.warmupIterations,
						session.config.measurementRuns,
						session.config.initialSize,
						session.config.subscriberCount,
						`${session.config.operationMix.update}/${session.config.operationMix.add}/${session.config.operationMix.remove}`,
						stats?.mean,
						stats?.median,
						stats?.min,
						stats?.max,
						stats?.standardDeviation,
						stats?.p95,
						stats?.p99,
						stats?.cv,
						result.metrics?.opsPerSec,
						result.metrics?.totalTimeMs,
						result.metrics?.environment?.timestamp ?? session.startedAt,
						session.environment.timestamp,
					]),
				)
			}
		}
	}

	lines.push('')
	lines.push(csvRow(['SECTION', 'RAW_MEASUREMENTS']))
	lines.push(
		csvRow([
			'session_id',
			'session_title',
			'run_kind',
			'adapter_group',
			'adapter',
			'scenario',
			'result_status',
			'iteration',
			'phase',
			'metric',
			'duration_ms',
			'timestamp',
			'error',
		]),
	)

	for (const session of sortedSessions(sessions)) {
		const results = [...session.results].sort(
			(a, b) =>
				a.adapterGroup.localeCompare(b.adapterGroup) ||
				a.scenario.localeCompare(b.scenario) ||
				a.adapter.localeCompare(b.adapter),
		)
		for (const result of results) {
			if (result.rawMeasurements.length === 0) {
				lines.push(
					csvRow([
						session.id,
						session.title,
						session.kind,
						result.adapterGroup,
						result.adapter,
						result.scenario,
						result.status,
						'',
						'',
						'',
						'',
						session.startedAt,
						result.error ?? '',
					]),
				)
				continue
			}
			for (const measurement of result.rawMeasurements) {
				lines.push(
					csvRow([
						session.id,
						session.title,
						session.kind,
						'state-core',
						result.adapter,
						result.scenario,
						result.status,
						measurement.iteration,
						measurement.phase,
						'updateTime',
						measurement.updateTime,
						measurement.timestamp,
						'',
					]),
				)
				lines.push(
					csvRow([
						session.id,
						session.title,
						session.kind,
						'ui-coupled',
						result.adapter,
						result.scenario,
						result.status,
						measurement.iteration,
						measurement.phase,
						'renderTime',
						measurement.renderTime,
						measurement.timestamp,
						'',
					]),
				)
			}
		}
	}

	lines.push('')
	lines.push(csvRow(['SECTION', 'ENVIRONMENT']))
	lines.push(
		csvRow([
			'session_id',
			'timestamp',
			'browser',
			'browser_version',
			'os',
			'platform',
			'language',
			'timezone',
			'screen_resolution',
			'viewport_size',
			'dpr',
			'hardware_concurrency',
			'device_memory',
			'webgl_vendor',
			'webgl_renderer',
			'react_version',
			'build_mode',
			'profiling_enabled',
			'git_commit',
			'app_version',
			'user_agent',
		]),
	)

	for (const session of sortedSessions(sessions)) {
		const env = session.environment
		lines.push(
			csvRow([
				session.id,
				env.timestamp,
				env.browserName,
				env.browserVersion,
				env.os,
				env.platform,
				env.language,
				env.timezone,
				env.screenResolution,
				env.viewportSize,
				env.devicePixelRatio,
				env.hardwareConcurrency,
				env.deviceMemory,
				env.webglVendor,
				env.webglRenderer,
				env.reactVersion,
				env.buildMode,
				env.profilingEnabled,
				env.gitCommitHash,
				env.appVersion,
				env.userAgent,
			]),
		)
	}

	return `\ufeff${lines.join('\n')}`
}

export const buildMarkdownSummary = (sessions: BenchmarkRunSession[]) => {
	const rows = sessions.map((session) =>
		[
			session.title,
			session.kind,
			session.status,
			session.summary.totalResults,
			session.summary.successfulResults,
			session.summary.failedResults,
			`${session.summary.adaptersCount} x ${session.summary.scenariosCount}`,
			`${(session.summary.durationMs / 1000).toFixed(1)} s`,
		].join(' | '),
	)

	return [
		'| Session | Kind | Status | Results | Success | Failed | Matrix | Duration |',
		'|---|---|---|---:|---:|---:|---|---:|',
		...rows.map((row) => `| ${row} |`),
	].join('\n')
}

export const exportReportsToJSON = (sessions: BenchmarkRunSession[]) => {
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
	download(
		JSON.stringify(
			{
				timestamp,
				sessions,
			},
			null,
			2,
		),
		'application/json;charset=utf-8',
		`reactive-bench-${timestamp}.json`,
	)
}

export const exportReportsToCSV = (sessions: BenchmarkRunSession[]) => {
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
	download(
		buildBenchmarkCSV(sessions),
		'text/csv;charset=utf-8',
		`reactive-bench-${timestamp}.csv`,
	)
}

export const copyMarkdownSummary = async (sessions: BenchmarkRunSession[]) => {
	await navigator.clipboard.writeText(buildMarkdownSummary(sessions))
}
