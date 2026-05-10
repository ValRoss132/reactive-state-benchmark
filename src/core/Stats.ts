import type { BenchmarkStats } from './types'

const percentile = (sorted: number[], probability: number) => {
	if (sorted.length === 1) return sorted[0]
	const position = (sorted.length - 1) * probability
	const lower = Math.floor(position)
	const upper = Math.ceil(position)
	const weight = position - lower
	return sorted[lower] + (sorted[upper] - sorted[lower]) * weight
}

export const calculateRobustStats = (data: number[]): BenchmarkStats => {
	if (data.length === 0)
		return {
			mean: 0,
			median: 0,
			min: 0,
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

	return {
		mean,
		median: percentile(sorted, 0.5),
		min: sorted[0],
		p95: percentile(sorted, 0.95),
		p99: percentile(sorted, 0.99),
		max: sorted[sorted.length - 1],
		standardDeviation: stdDev,
		cv: mean > 0 ? (stdDev / mean) * 100 : 0,
	}
}
