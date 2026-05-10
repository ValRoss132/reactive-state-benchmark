import type { BenchmarkPayload, Scenario, WideState } from '../core/types'
import { seedRandom } from '../utils/seedRandom'

const createAsyncState = (size: number): WideState => ({
	items: Array.from({ length: size }, (_, i) => ({
		id: i.toString(),
		value: 0,
	})),
	version: 0,
})

export const AsyncScenario: Scenario<WideState, BenchmarkPayload> = {
	name: 'High-Frequency Async Stream',
	initialState: createAsyncState(1000),
	createInitialState: (config) => createAsyncState(config.initialSize),
	generatePayload: (iteration, seed, config) => {
		const targetIndex = Math.floor(seedRandom(seed + iteration) * config.initialSize)
		return {
			index: targetIndex,
			targetId: targetIndex.toString(),
			newValue: seedRandom(seed + iteration + 11),
			type: 'UPDATE',
		}
	},
	iterations: 10000,
	warmupRuns: 1000,
}
