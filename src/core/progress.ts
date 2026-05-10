import type { BenchmarkPhase, ProgressState } from './types'

export const createProgressState = (input: {
	phase: BenchmarkPhase
	adapterName: string
	scenarioName: string
	currentIteration: number
	totalIterations: number
	currentStep: number
	totalSteps: number
	startedAt: number
	message?: string
}): ProgressState => {
	const elapsedMs = performance.now() - input.startedAt
	const progress =
		input.totalSteps > 0
			? Math.min(100, Math.round((input.currentStep / input.totalSteps) * 100))
			: 0
	const estimatedRemainingMs =
		input.currentStep > 0 && input.currentStep < input.totalSteps
			? (elapsedMs / input.currentStep) * (input.totalSteps - input.currentStep)
			: undefined

	return {
		phase: input.phase,
		adapterName: input.adapterName,
		scenarioName: input.scenarioName,
		currentIteration: input.currentIteration,
		totalIterations: input.totalIterations,
		currentStep: input.currentStep,
		totalSteps: input.totalSteps,
		progress,
		elapsedMs,
		estimatedRemainingMs,
		message: input.message,
	}
}
