import type { BenchmarkPayload, Scenario, WideState } from '../core/types'
import { seedRandom } from '../utils/seedRandom'

export const WideUpdateScenario: Scenario<WideState, BenchmarkPayload> = {
	name: 'Wide Subscription',

	initialState: {
		items: Array.from({ length: 1000 }, (_, i) => ({
			id: i.toString(),
			value: 0,
		})),
		version: 0,
	},

	generatePayload: (iteration) => ({
		index: iteration % 1000,
		targetId: (iteration % 1000).toString(),
		newValue: seedRandom(iteration),
	}),

	iterations: 10000,
	warmupRuns: 1000,
}
