import { flushSync } from 'react-dom'
import { calculateRobustStats } from './Stats'
import type {
	StateAdapter,
	Scenario,
	FullReport,
	EnvironmentInfo,
} from './types'

function captureEnvironmentInfo(): EnvironmentInfo {
	const now = new Date()
	return {
		userAgent: navigator.userAgent,
		timestamp: now.toISOString(),
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		language: navigator.language,
		screenResolution: `${window.innerWidth}x${window.innerHeight}`,
		deviceMemory: (navigator as any).deviceMemory,
		hardwareConcurrency: navigator.hardwareConcurrency,
	}
}

function verifyAdapterConsistency<S, P>(
	adapter: StateAdapter<S, P>,
	scenario: Scenario<S, P>,
	numOperations: number = 100,
): boolean {
	// Проверяем, что адаптер обрабатывает операции консистентно
	const testAdapterRunTwice = () => {
		const results: any[] = []
		for (let i = 0; i < 2; i++) {
			adapter.dispose()
			adapter.init(JSON.parse(JSON.stringify(scenario.initialState)))

			for (let j = 0; j < numOperations; j++) {
				adapter.update(scenario.generatePayload(j))
			}

			results.push(adapter.peek())
		}
		return JSON.stringify(results[0]) === JSON.stringify(results[1])
	}

	try {
		const isConsistent = testAdapterRunTwice()
		if (!isConsistent) {
			console.warn(
				`[Verification] Adapter ${adapter.name} may have non-deterministic behavior`,
			)
		}
		return isConsistent
	} catch (e) {
		console.error(`[Verification] Error verifying adapter ${adapter.name}:`, e)
		return false
	}
}

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
		// Проверка детерминизма и консистентности адаптера перед запуском
		const isConsistent = verifyAdapterConsistency(adapter, scenario, 50)
		if (!isConsistent) {
			console.warn(
				`[ГЭК WARN] Adapter ${adapter.name} shows non-deterministic behavior. Results may be unreliable.`,
			)
		}

		const TOTAL_RUNS = 15 // Увеличено с 10 до 30 для лучшей хвостовой статистики
		const BATCH_SIZE = scenario.iterations

		const runMetrics = {
			updateTimePerOp: [] as number[],
			renderTimePerOp: [] as number[],
			throughput: [] as number[],
		}

		let uiProfilerValid = true

		for (let run = 0; run < TOTAL_RUNS; run++) {
			onProgress(Math.round((run / TOTAL_RUNS) * 100))

			// Даем браузеру возможность отрисовать прогресс и не «вешать» вкладку
			await new Promise((resolve) => setTimeout(resolve, 20))

			adapter.dispose()

			// Глубокая копия для изоляции между прогонами
			const initialStateCopy = JSON.parse(JSON.stringify(scenario.initialState))
			adapter.init(initialStateCopy)

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

			const totalBatchTime = performance.now() - t0
			const totalRenderTime = this.renderAccumulator

			if (totalRenderTime === 0 && run === 0) {
				console.warn(
					'[ГЭК WARN] Profiler вернул 0. Проверьте алиасы vite.config.ts. UI метрики невалидны.',
				)
				uiProfilerValid = false
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

		// Собираем сырые данные по прогонам
		const rawRuns = runMetrics.updateTimePerOp.map((stateTime, idx) => ({
			stateTimePerOp: stateTime,
			renderTimePerOp: runMetrics.renderTimePerOp[idx],
			throughput: runMetrics.throughput[idx],
		}))

		// Собираем информацию об окружении
		const environment = captureEnvironmentInfo()

		return {
			adapterName: adapter.name,
			scenarioName: scenario.name,
			stateCore: stateStats,
			uiCoupled: uiStats,
			pureOpsPerSec: throughputStats.mean,
			opsPerSec: throughputStats.mean,
			runsCompleted: TOTAL_RUNS,
			uiProfilerValid,
			rawRuns,
			environment,
		}
	}
}
