import type { BenchmarkPayload, Scenario, WideState } from '../core/types'
import { seedRandom } from '../utils/seedRandom'

export const AsyncScenario: Scenario<WideState, BenchmarkPayload> = {
	name: 'High-Frequency Async Stream',
	initialState: {
		items: Array.from({ length: 1000 }, (_, i) => ({
			id: i.toString(),
			value: 0,
		})),
		version: 0,
	},
	generatePayload: (iteration) => ({
		index: Math.floor(seedRandom(iteration) * 1000),
		newValue: seedRandom(iteration + 11),
		type: 'UPDATE',
	}),
	iterations: 15000,
	warmupRuns: 1500,
}
