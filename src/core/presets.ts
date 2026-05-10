import { DEFAULT_OPERATION_MIX, normalizeOperationMix } from './config'
import type { ExperimentConfig } from './types'

const STORAGE_KEY = 'reactive-bench:experiment-config'

export const DEFAULT_EXPERIMENT_CONFIG: ExperimentConfig = {
	iterations: 10000,
	warmupIterations: 1000,
	measurementRuns: 15,
	initialSize: 1000,
	subscriberCount: 1000,
	operationMix: DEFAULT_OPERATION_MIX,
	seed: Date.now() % 1000000,
}

export const normalizeExperimentConfig = (
	config: ExperimentConfig,
): ExperimentConfig => {
	const initialSize = Math.max(1, Math.round(config.initialSize))
	const subscriberCount = Math.max(
		0,
		Math.min(Math.round(config.subscriberCount), initialSize),
	)

	return {
		iterations: Math.max(1, Math.round(config.iterations)),
		warmupIterations: Math.max(1, Math.round(config.warmupIterations)),
		measurementRuns: Math.max(1, Math.round(config.measurementRuns)),
		initialSize,
		subscriberCount,
		operationMix: normalizeOperationMix(config.operationMix),
		seed: Number.isFinite(config.seed) ? config.seed : 0,
	}
}

export const loadExperimentConfigPreset = (): ExperimentConfig => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) return DEFAULT_EXPERIMENT_CONFIG
		return normalizeExperimentConfig({
			...DEFAULT_EXPERIMENT_CONFIG,
			...JSON.parse(raw),
		})
	} catch {
		return DEFAULT_EXPERIMENT_CONFIG
	}
}

export const saveExperimentConfigPreset = (config: ExperimentConfig) => {
	localStorage.setItem(
		STORAGE_KEY,
		JSON.stringify(normalizeExperimentConfig(config), null, 2),
	)
}

export const clearExperimentConfigPreset = () => {
	localStorage.removeItem(STORAGE_KEY)
}
