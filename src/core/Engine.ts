import { flushSync } from 'react-dom'
import type {
	MetricResult,
	StateAdapter,
	Scenario,
	BenchmarkStats,
	FullReport,
	ExtendedPerformance,
} from './types'

// Расширяем отчет для соответствия научным требованиям
export type ValidatedReport = FullReport & {
	pureOpsPerSec: number // Без учета пауз (научный показатель)
	wallOpsPerSec: number // С учетом пауз (UX показатель)
}

export class BenchmarkEngine {
	private static renderTimeBuffer: number = 0

	static recordRenderTime(time: number) {
		// Накапливаем время, если в одном батче было несколько коммитов
		this.renderTimeBuffer += time
	}

	private static getStats(values: number[]): BenchmarkStats {
		const sorted = [...values].sort((a, b) => a - b)
		const mean = values.reduce((a, b) => a + b, 0) / values.length
		const variance =
			values.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) /
			values.length
		const stdDev = Math.sqrt(variance)

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
	): Promise<ValidatedReport> {
		const results: MetricResult[] = []
		adapter.init(scenario.initialState)

		// 1. Warm-up (не входит в статистику)
		for (let i = 0; i < scenario.warmupRuns; i++) {
			flushSync(() => {
				adapter.update(scenario.generatePayload(i))
			})
		}

		const BATCH_SIZE = 5
		let totalPureTime = 0 // Только время выполнения кода библиотеки
		const wallStartTime = performance.now()
		const perf = window.performance as ExtendedPerformance

		// 2. Main Loop
		for (let i = 0; i < scenario.iterations; i += BATCH_SIZE) {
			onProgress(i)
			this.renderTimeBuffer = 0 // Сброс для текущего батча

			const memBefore = perf.memory?.usedJSHeapSize || 0

			// Замеряем время самого обновления
			const t0 = performance.now()
			flushSync(() => {
				for (let j = 0; j < BATCH_SIZE; j++) {
					adapter.update(scenario.generatePayload(i + j))
				}
			})
			const t1 = performance.now()

			// Замеряем стоимость "прокачки" данных до потребителя (Propagation)
			const t2_start = performance.now()
			adapter.peek()
			const t2_end = performance.now()

			const memAfter = perf.memory?.usedJSHeapSize || 0

			// Чистое время работы кода (Scripting + Propagation)
			const batchPureTime = t1 - t0 + (t2_end - t2_start)
			totalPureTime += batchPureTime

			results.push({
				// Вычитаем время рендера из времени скриптинга для чистоты state-core
				updateTime: (t1 - t0 - this.renderTimeBuffer) / BATCH_SIZE,
				propagationTime: (t2_end - t2_start) / BATCH_SIZE,
				renderTime: this.renderTimeBuffer / BATCH_SIZE,
				memoryDelta: (memAfter - memBefore) / BATCH_SIZE,
			})

			// Искусственная пауза (не включается в totalPureTime)
			await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)))
		}

		const wallEndTime = performance.now()
		adapter.dispose()

		return {
			adapterName: adapter.name,
			scenarioName: scenario.name,
			stateCore: this.getStats(results.map((r) => r.updateTime)),
			uiCoupled: this.getStats(results.map((r) => r.renderTime)),
			// Научный показатель: сколько операций в секунду может выдать чисто библиотека
			pureOpsPerSec: (scenario.iterations / totalPureTime) * 1000,
			// Реальный показатель: скорость с учетом циклов отрисовки браузера
			wallOpsPerSec:
				(scenario.iterations / (wallEndTime - wallStartTime)) * 1000,
			// Оставляем для совместимости со старым UI
			opsPerSec: (scenario.iterations / totalPureTime) * 1000,
		}
	}
}
