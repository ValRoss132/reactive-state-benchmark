import type { Scenario, WideState, BenchmarkPayload } from '../core/types'
import { seedRandom } from '../utils/seedRandom'

const INITIAL_SIZE = 1000
let liveSize = INITIAL_SIZE

export const CRUDScenario: Scenario<WideState, BenchmarkPayload> = {
	name: 'CRUD Homeostasis',
	initialState: {
		items: Array.from({ length: INITIAL_SIZE }, (_, i) => ({
			id: `init-${i}`,
			value: i,
		})),
		version: 0,
	},
	generatePayload: (i) => {
		if (i === 0) {
			liveSize = INITIAL_SIZE
		}

		const op = i % 4

		if (op === 1) {
			liveSize += 1
			return {
				type: 'ADD',
				id: `added-${i}`,
				newValue: seedRandom(i + 13),
			}
		}

		if (op === 3) {
			const removeIndex = Math.floor(seedRandom(i + 17) * liveSize)
			liveSize = Math.max(INITIAL_SIZE, liveSize - 1)
			return {
				type: 'REMOVE',
				index: Math.min(removeIndex, liveSize),
				newValue: 0,
			}
		}

		const updateIndex = Math.floor(seedRandom(i + 5) * liveSize)
		return {
			type: 'UPDATE',
			index: Math.min(updateIndex, Math.max(0, liveSize - 1)),
			newValue: seedRandom(i),
		}
	},
	iterations: 20000,
	warmupRuns: 2000,
}
