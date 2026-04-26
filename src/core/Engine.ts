import { flushSync } from 'react-dom'
import type {
	MetricResult,
	StateAdapter,
	Scenario,
	BenchmarkStats,
	FullReport,
	ExtendedPerformance,
} from './types'

export class BenchmarkEngine {
	private static renderTimeBuffer: number = 0

	static recordRenderTime(time: number) {
		this.renderTimeBuffer = time
	}

	private static getStats(values: number[]): BenchmarkStats {
		const sorted = [...values].sort((a, b) => a - b)
		const mean = values.reduce((a, b) => a + b, 0) / values.length
		const variance = values
			.map((x) => Math.pow(x - mean, 2))
			.reduce((a, b) => a + b, 0)
		const stdDev = Math.sqrt(variance / values.length)

		return {
			mean,
			median: sorted[Math.floor(sorted.length / 2)],
			p95: sorted[Math.floor(sorted.length * 0.95)],
			p99: sorted[Math.floor(sorted.length * 0.99)],
			max: sorted[sorted.length - 1],
			standardDeviation: stdDev,
			cv: mean > 0 ? (stdDev / mean) * 100 : 0,
		}
	}

	static async runSingle<S, P>(
		adapter: StateAdapter<S, P>,
		scenario: Scenario<S, P>,
		onProgress: (iteration: number) => void,
	): Promise<FullReport> {
		const results: MetricResult[] = []
		adapter.init(scenario.initialState)

		for (let i = 0; i < scenario.warmupRuns; i++) {
			flushSync(() => {
				adapter.update(scenario.generatePayload(i))
			})
		}

		const BATCH_SIZE = 5
		const startTime = performance.now()
		const perf = window.performance as ExtendedPerformance

		for (let i = 0; i < scenario.iterations; i += BATCH_SIZE) {
			onProgress(i)
			this.renderTimeBuffer = 0

			const memBefore = perf.memory?.usedJSHeapSize || 0
			const t0 = performance.now()

			flushSync(() => {
				for (let j = 0; j < BATCH_SIZE; j++) {
					adapter.update(scenario.generatePayload(i + j))
				}
			})

			const t1 = performance.now()
			const t2_start = performance.now()
			adapter.peek()
			const t2_end = performance.now()

			const memAfter = perf.memory?.usedJSHeapSize || 0

			results.push({
				updateTime: (t1 - t0 - this.renderTimeBuffer) / BATCH_SIZE,
				propagationTime: t2_end - t2_start,
				renderTime: this.renderTimeBuffer / BATCH_SIZE,
				memoryDelta: (memAfter - memBefore) / BATCH_SIZE,
			})

			await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)))
		}

		const endTime = performance.now()
		adapter.dispose()

		return {
			adapterName: adapter.name,
			scenarioName: scenario.name,
			stateCore: this.getStats(results.map((r) => r.updateTime)),
			uiCoupled: this.getStats(results.map((r) => r.renderTime)),
			opsPerSec: (scenario.iterations / (endTime - startTime)) * 1000,
		}
	}
}
