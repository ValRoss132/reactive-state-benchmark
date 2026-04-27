import type { FullReport } from '../core/types'

export const exportToCSV = (report: FullReport) => {
	// Таблица 1: Агрегированные метрики
	const headers =
		'Metric,Mean (ms),Median (ms),P95 (ms),P99 (ms),Max (ms),CV (%),StdDev (ms)'

	const rows = [
		[
			'State-Core (Scripting)',
			report.stateCore.mean.toFixed(6),
			report.stateCore.median.toFixed(6),
			report.stateCore.p95.toFixed(6),
			report.stateCore.p99.toFixed(6),
			report.stateCore.max.toFixed(6),
			report.stateCore.cv.toFixed(2),
			report.stateCore.standardDeviation.toFixed(6),
		].join(','),
		[
			'UI-Coupled (Render/Commit)',
			report.uiCoupled.mean.toFixed(6),
			report.uiCoupled.median.toFixed(6),
			report.uiCoupled.p95.toFixed(6),
			report.uiCoupled.p99.toFixed(6),
			report.uiCoupled.max.toFixed(6),
			report.uiCoupled.cv.toFixed(2),
			report.uiCoupled.standardDeviation.toFixed(6),
		].join(','),
		`Throughput (ops/sec),${report.opsPerSec.toFixed(2)},,,,,`,
		`UI Profiler Valid,${report.uiProfilerValid ? 'YES' : 'NO'},,,,,`,
	]

	const summarySection = '\n' + headers + '\n' + rows.join('\n')

	// Таблица 2: Сырые данные по прогонам
	const rawDataHeaders =
		'Run,State-Time-Per-Op (ms),Render-Time-Per-Op (ms),Throughput (ops/s)'
	const rawDataRows = (report.rawRuns || []).map((run, idx) =>
		[
			idx + 1,
			run.stateTimePerOp.toFixed(6),
			run.renderTimePerOp.toFixed(6),
			run.throughput.toFixed(2),
		].join(','),
	)

	const rawDataSection = '\n\n' + rawDataHeaders + '\n' + rawDataRows.join('\n')

	// Метаинформация
	const metadata =
		`\n\nMetadata\nAdapter,${report.adapterName}\nScenario,${report.scenarioName}\nTotal Runs,${report.rawRuns?.length || 'unknown'}\n` +
		`\nEnvironment\n` +
		`Timestamp,${report.environment?.timestamp || 'unknown'}\n` +
		`User Agent,${report.environment?.userAgent || 'unknown'}\n` +
		`Timezone,${report.environment?.timezone || 'unknown'}\n` +
		`Language,${report.environment?.language || 'unknown'}\n` +
		`Screen Resolution,${report.environment?.screenResolution || 'unknown'}\n` +
		`Device Memory (GB),${report.environment?.deviceMemory || 'unknown'}\n` +
		`Hardware Concurrency,${report.environment?.hardwareConcurrency || 'unknown'}\n` +
		`UI Profiler Valid,${report.uiProfilerValid ? 'YES' : 'NO'}`

	const csvContent = '\ufeff' + summarySection + rawDataSection + metadata

	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
	const url = URL.createObjectURL(blob)

	const link = document.createElement('a')
	const fileName = `vkr_report_${report.adapterName.toLowerCase().replace(/\s/g, '_')}_${report.scenarioName.toLowerCase().replace(/\s/g, '_')}.csv`

	link.setAttribute('href', url)
	link.setAttribute('download', fileName)
	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
}
