import type { BenchmarkPayload, Scenario, WideState } from '../core/types'
import { seedRandom } from '../utils/seedRandom'

const createWideState = (size: number): WideState => ({
	items: Array.from({ length: size }, (_, i) => ({
		id: i.toString(),
		value: 0,
	})),
	version: 0,
})

export const WideUpdateScenario: Scenario<WideState, BenchmarkPayload> = {
	name: 'Wide Subscription',

	initialState: createWideState(1000),

	createInitialState: (config) => createWideState(config.initialSize),

	generatePayload: (iteration, seed, config) => ({
		index: iteration % config.initialSize,
		targetId: (iteration % config.initialSize).toString(),
		newValue: seedRandom(seed + iteration),
	}),

	iterations: 10000,
	warmupRuns: 1000,
}
