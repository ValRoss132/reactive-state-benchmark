import type { FullReport } from '../core/types'

export const exportToCSV = (report: FullReport) => {
	// Заголовки согласно метрикам из твоей ВКР
	const headers =
		'Metric,Mean (ms),Median (ms),P95 (ms),P99 (ms),Max (ms),CV (%)'

	const rows = [
		[
			'State-Core (Scripting)',
			report.stateCore.mean.toFixed(6),
			report.stateCore.median.toFixed(6),
			report.stateCore.p95.toFixed(6),
			report.stateCore.p99.toFixed(6),
			report.stateCore.max.toFixed(6),
			report.stateCore.cv.toFixed(2),
		].join(','),
		[
			'UI-Coupled (Render/Commit)',
			report.uiCoupled.mean.toFixed(6),
			report.uiCoupled.median.toFixed(6),
			report.uiCoupled.p95.toFixed(6),
			report.uiCoupled.p99.toFixed(6),
			report.uiCoupled.max.toFixed(6),
			report.uiCoupled.cv.toFixed(2),
		].join(','),
		`Throughput (ops/sec),${report.opsPerSec.toFixed(2)},,,,,`,
	]

	const csvContent = '\ufeff' + headers + '\n' + rows.join('\n')
	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
	const url = URL.createObjectURL(blob)

	const link = document.createElement('a')
	const fileName = `vkr_report_${report.adapterName.toLowerCase().replace(/\s/g, '_')}.csv`

	link.setAttribute('href', url)
	link.setAttribute('download', fileName)
	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
}
