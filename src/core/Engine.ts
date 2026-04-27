import { flushSync } from 'react-dom'
import { calculateRobustStats } from './Stats'
import type { StateAdapter, Scenario, FullReport } from './types'

export type ValidatedReport = FullReport & {
	pureOpsPerSec: number
	runsCompleted: number
}

export class BenchmarkEngine {
	private static renderAccumulator: number = 0

	static recordRenderTime(time: number) {
		this.renderAccumulator += time
	}

	static async runSingle<S, P>(
		adapter: StateAdapter<S, P>,
		scenario: Scenario<S, P>,
		onProgress: (progress: number) => void,
	): Promise<ValidatedReport> {
		const TOTAL_RUNS = 10
		const BATCH_SIZE = scenario.iterations

		const runMetrics = {
			updateTimePerOp: [] as number[],
			renderTimePerOp: [] as number[],
			throughput: [] as number[],
		}

		for (let run = 0; run < TOTAL_RUNS; run++) {
			onProgress(Math.round((run / TOTAL_RUNS) * 100))

			adapter.dispose()
			adapter.init(scenario.initialState)

			for (let i = 0; i < scenario.warmupRuns; i++) {
				adapter.update(scenario.generatePayload(i))
			}

			this.renderAccumulator = 0
			let dceShield = 0

			const t0 = performance.now()

			for (let i = 0; i < BATCH_SIZE; i++) {
				flushSync(() => {
					adapter.update(scenario.generatePayload(i))
				})
				dceShield += (adapter.peek() as number) || 0
			}

			const t1 = performance.now()
			const totalBatchTime = t1 - t0
			const totalRenderTime = this.renderAccumulator

			if (totalRenderTime === 0 && run === 0) {
				console.warn(
					'[ГЭК WARN] Profiler вернул 0. Проверьте алиасы vite.config.ts. UI метрики невалидны.',
				)
			}
			if (totalBatchTime < 10) {
				console.warn(
					`[ГЭК WARN] Batch ${adapter.name}/${scenario.name} < 10ms (${totalBatchTime.toFixed(3)}ms). Увеличьте iterations.`,
				)
			}

			const scriptingTime = Math.max(0, totalBatchTime - totalRenderTime)

			runMetrics.updateTimePerOp.push(scriptingTime / BATCH_SIZE)
			runMetrics.renderTimePerOp.push(totalRenderTime / BATCH_SIZE)
			runMetrics.throughput.push((BATCH_SIZE / totalBatchTime) * 1000)

			if (dceShield === -Infinity) console.debug('DCE Shield:', dceShield)

			await new Promise((r) => setTimeout(r, 50))
		}
		onProgress(100)

		adapter.dispose()

		const stateStats = calculateRobustStats(runMetrics.updateTimePerOp)
		const uiStats = calculateRobustStats(runMetrics.renderTimePerOp)
		const throughputStats = calculateRobustStats(runMetrics.throughput)

		return {
			adapterName: adapter.name,
			scenarioName: scenario.name,
			stateCore: stateStats,
			uiCoupled: uiStats,
			pureOpsPerSec: throughputStats.mean,
			opsPerSec: throughputStats.mean,
			runsCompleted: TOTAL_RUNS,
		}
	}
}
