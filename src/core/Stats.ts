import type { BenchmarkStats } from './types'

export const calculateRobustStats = (data: number[]): BenchmarkStats => {
	if (data.length === 0)
		return {
			mean: 0,
			median: 0,
			p95: 0,
			p99: 0,
			max: 0,
			standardDeviation: 0,
			cv: 0,
		}

	const sorted = [...data].sort((a, b) => a - b)

	// Вычисляем все статистики по одной выборке (без фильтрации)
	// для прозрачности и единообразия
	const mean = data.reduce((a, b) => a + b, 0) / data.length
	const variance =
		data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length
	const stdDev = Math.sqrt(variance)

	// Для p95/p99 используем отсортированный массив
	const p95Index = Math.ceil(data.length * 0.95) - 1
	const p99Index = Math.ceil(data.length * 0.99) - 1

	return {
		mean,
		median: sorted[Math.floor(sorted.length / 2)],
		p95: sorted[Math.max(0, p95Index)],
		p99: sorted[Math.max(0, p99Index)],
		max: sorted[sorted.length - 1],
		standardDeviation: stdDev,
		cv: mean > 0 ? (stdDev / mean) * 100 : 0,
	}
}
