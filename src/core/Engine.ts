import { flushSync } from 'react-dom'
import { calculateRobustStats } from './Stats'
import { captureEnvironmentInfo, getRuntimeFlags } from './environment'
import { createProgressState } from './progress'
import type {
	StateAdapter,
	Scenario,
	FullReport,
	ExperimentConfig,
	ProgressState,
	BenchmarkRawMeasurement,
} from './types'

const yieldToBrowser = () => new Promise((resolve) => setTimeout(resolve, 0))
export const DEFAULT_MEASUREMENT_RUNS = 15

const cloneState = <S,>(state: S): S => structuredClone(state)

function verifyAdapterConsistency<S, P>(
	adapter: StateAdapter<S, P>,
	scenario: Scenario<S, P>,
	config: ExperimentConfig,
	numOperations: number = 50,
): boolean {
	const testAdapterRunTwice = () => {
		const results: unknown[] = []
		for (let i = 0; i < 2; i++) {
			adapter.dispose()
			adapter.init(cloneState(scenario.initialState))

			for (let j = 0; j < numOperations; j++) {
				adapter.update(scenario.generatePayload(j, config.seed))
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
	} catch (error) {
		console.error(`[Verification] Error verifying adapter ${adapter.name}:`, error)
		return false
	}
}

export type ValidatedReport = FullReport & {
	pureOpsPerSec: number
	runsCompleted: number
}

export class BenchmarkEngine {
	private static renderAccumulator: number = 0
	static measurementRuns = DEFAULT_MEASUREMENT_RUNS

	static recordRenderTime(time: number) {
		this.renderAccumulator += time
	}

	static async runSingle<S, P>(
		adapter: StateAdapter<S, P>,
		scenario: Scenario<S, P>,
		config: ExperimentConfig,
		onProgress: (progress: ProgressState) => void,
		signal?: AbortSignal,
		progressOffset = 0,
		totalStepsOverride?: number,
	): Promise<ValidatedReport> {
		const totalIterations = config.warmupIterations + config.iterations
		const totalSteps =
			totalStepsOverride ?? config.measurementRuns * totalIterations
		const startedAt = performance.now()
		let currentStep = progressOffset

		const emit = (
			phase: ProgressState['phase'],
			currentIteration = 0,
			message?: string,
		) => {
			onProgress(
				createProgressState({
					phase,
					adapterName: adapter.name,
					scenarioName: scenario.name,
					currentIteration,
					totalIterations,
					currentStep,
					totalSteps,
					startedAt,
					message,
				}),
			)
		}

		const checkAbort = () => {
			if (signal?.aborted) throw new DOMException('Benchmark aborted', 'AbortError')
		}

		emit('preparing', 0)
		await yieldToBrowser()
		checkAbort()

		const isConsistent = verifyAdapterConsistency(adapter, scenario, config)
		if (!isConsistent) {
			console.warn(
				`[Benchmark] Adapter ${adapter.name} consistency check failed. Results may be unreliable.`,
			)
		}

		const payloads = Array.from({ length: totalIterations }, (_, index) =>
			scenario.generatePayload(index, config.seed),
		)

		adapter.dispose()
		adapter.init(cloneState(scenario.initialState))

		const updateTimePerOp: number[] = []
		const renderTimePerOp: number[] = []
		const throughput: number[] = []
		const rawMeasurements: BenchmarkRawMeasurement[] = []
		const experimentStart = performance.now()
		let pureLoopTimeMs = 0
		let dceShield = 0

		for (let run = 0; run < config.measurementRuns; run++) {
			adapter.dispose()
			adapter.init(cloneState(scenario.initialState))

			for (let i = 0; i < config.warmupIterations; i++) {
				checkAbort()
				emit('warmup', i + 1)
				flushSync(() => {
					adapter.update(payloads[i])
				})
				dceShield += (adapter.peek() as number) || 0
				currentStep += 1
				if (i % 50 === 0) await yieldToBrowser()
			}

			this.renderAccumulator = 0
			const t0 = performance.now()

			for (let i = 0; i < config.iterations; i++) {
				checkAbort()
				const absoluteIteration = config.warmupIterations + i
				emit('measuring', i + 1)
				flushSync(() => {
					adapter.update(payloads[absoluteIteration])
				})
				dceShield += (adapter.peek() as number) || 0
				currentStep += 1
				if (i % 50 === 0) await yieldToBrowser()
			}

			const totalBatchTime = performance.now() - t0
			const totalRenderTime = this.renderAccumulator
			const scriptingTime = Math.max(0, totalBatchTime - totalRenderTime)
			pureLoopTimeMs += totalBatchTime

			updateTimePerOp.push(scriptingTime / config.iterations)
			renderTimePerOp.push(totalRenderTime / config.iterations)
			throughput.push((config.iterations / totalBatchTime) * 1000)
			rawMeasurements.push({
				iteration: run + 1,
				updateTime: scriptingTime / config.iterations,
				renderTime: totalRenderTime / config.iterations,
				phase: 'measuring',
			})

			await yieldToBrowser()
		}

		if (dceShield === -Infinity) console.debug('DCE Shield:', dceShield)

		emit('aggregating', config.iterations)
		await yieldToBrowser()

		const totalRenderTime = renderTimePerOp.reduce((sum, value) => sum + value, 0)
		if (totalRenderTime === 0) {
			console.warn(
				`[Benchmark] No UI render samples captured for ${adapter.name}/${scenario.name}. This can mean there were no subscribed component commits, not necessarily a missing profiling build.`,
			)
		}

		adapter.dispose()
		const totalTimeMs = performance.now() - experimentStart
		const stateStats = calculateRobustStats(updateTimePerOp)
		const uiStats = calculateRobustStats(renderTimePerOp)
		const throughputStats = calculateRobustStats(throughput)
		const environment = captureEnvironmentInfo()
		const runtime = getRuntimeFlags()
		currentStep = Math.min(totalSteps, currentStep)

		emit('completed', config.iterations)

		return {
			adapterName: adapter.name,
			scenarioName: scenario.name,
			config,
			stateCore: stateStats,
			uiCoupled: uiStats,
			pureOpsPerSec: throughputStats.mean,
			opsPerSec: throughputStats.mean,
			totalTimeMs,
			pureLoopTimeMs,
			runsCompleted: config.measurementRuns,
			uiProfilerValid: runtime.profilingEnabled,
			rawRuns: updateTimePerOp.map((stateTime, index) => ({
				stateTimePerOp: stateTime,
				renderTimePerOp: renderTimePerOp[index],
				throughput: throughput[index],
			})),
			rawMeasurements,
			environment,
		}
	}
}
