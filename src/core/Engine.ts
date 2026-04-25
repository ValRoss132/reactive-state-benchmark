import { flushSync } from 'react-dom'
import type {
	MetricResult,
	StateAdapter,
	Scenario,
	BenchmarkStats,
	FullReport,
} from './types'

export class BenchmarkEngine {
	private static renderTimeBuffer: number = 0

	static recordRenderTime(time: number) {
		this.renderTimeBuffer = time
	}

	// Вспомогательный метод для стат-анализа
	private static getStats(values: number[]): BenchmarkStats {
		const sorted = [...values].sort((a, b) => a - b)
		const mean = values.reduce((a, b) => a + b, 0) / values.length
		const stdDev = Math.sqrt(
			values.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) /
				values.length,
		)

		return {
			mean,
			median: sorted[Math.floor(sorted.length / 2)],
			p95: sorted[Math.floor(sorted.length * 0.95)],
			p99: sorted[Math.floor(sorted.length * 0.99)],
			max: sorted[sorted.length - 1],
			standardDeviation: stdDev,
			cv: (stdDev / mean) * 100,
		}
	}

	static async run<S, P>(
		adapter: StateAdapter<S, P>,
		scenario: Scenario<S, P>,
		onProgress: (iteration: number) => void,
	): Promise<FullReport> {
		const results: MetricResult[] = []
		adapter.init(scenario.initialState)

		// Warmup (прогрев JIT)
		for (let i = 0; i < scenario.warmupRuns; i++) {
			flushSync(() => {
				adapter.update(scenario.generatePayload(i))
			})
		}

		const startTime = performance.now()

		// Main Loop
		for (let i = 0; i < scenario.iterations; i++) {
			onProgress(i)
			const payload = scenario.generatePayload(i)
			this.renderTimeBuffer = 0

			const t0 = performance.now()

			// Замеряем всё: Scripting + Render + Commit
			flushSync(() => {
				adapter.update(payload)
			})

			const t1 = performance.now()

			// Замеряем Propagation (насколько быстро данные доступны для чтения)
			const t2_start = performance.now()
			adapter.peek()
			const t2_end = performance.now()

			results.push({
				updateTime: t1 - t0 - this.renderTimeBuffer,
				propagationTime: t2_end - t2_start,
				renderTime: this.renderTimeBuffer,
				memoryDelta: 0,
			})

			// Даем браузеру "продышаться" между кадрами (Task Gap)
			await new Promise((r) => setTimeout(r, 16))
		}

		const endTime = performance.now()

		// Формируем финальный отчет по критериям из твоей ВКР
		return {
			adapterName: adapter.name,
			scenarioName: scenario.name,
			stateCore: this.getStats(results.map((r) => r.updateTime)),
			uiCoupled: this.getStats(results.map((r) => r.renderTime)),
			opsPerSec: (scenario.iterations / (endTime - startTime)) * 1000,
		}
	}
}
