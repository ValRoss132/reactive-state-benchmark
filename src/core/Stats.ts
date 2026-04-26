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

	const q1 = sorted[Math.floor(sorted.length * 0.25)]
	const q3 = sorted[Math.floor(sorted.length * 0.75)]
	const iqr = q3 - q1
	const lowerBound = Math.max(0, q1 - 1.5 * iqr)
	const upperBound = q3 + 1.5 * iqr

	const filtered = sorted.filter((x) => x >= lowerBound && x <= upperBound)
	const targetData = filtered.length > 0 ? filtered : sorted

	const mean = targetData.reduce((a, b) => a + b, 0) / targetData.length
	const variance =
		targetData.reduce((a, b) => a + Math.pow(b - mean, 2), 0) /
		targetData.length
	const stdDev = Math.sqrt(variance)

	return {
		mean,
		median: targetData[Math.floor(targetData.length / 2)],
		p95: sorted[Math.floor(sorted.length * 0.95)],
		p99: sorted[Math.floor(sorted.length * 0.99)],
		max: sorted[sorted.length - 1],
		standardDeviation: stdDev,
		cv: mean > 0 ? (stdDev / mean) * 100 : 0,
	}
}
