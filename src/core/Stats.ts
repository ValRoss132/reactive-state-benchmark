export type Stats = {
	p50: number
	p95: number
	p99: number
	mean: number
	stdDev: number
}

export const calculateStats = (data: number[]): Stats => {
	const sorted = [...data].sort((a, b) => a - b)
	const mean = data.reduce((a, b) => a + b, 0) / data.length

	const stdDev = Math.sqrt(
		data.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) /
			data.length,
	)

	return {
		p50: sorted[Math.floor(sorted.length * 0.5)],
		p95: sorted[Math.floor(sorted.length * 0.95)],
		p99: sorted[Math.floor(sorted.length * 0.99)],
		mean,
		stdDev,
	}
}
