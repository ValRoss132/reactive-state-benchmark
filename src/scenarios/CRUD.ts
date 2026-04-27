import type { Scenario, WideState, BenchmarkPayload } from '../core/types'
import { seedRandom } from '../utils/seedRandom'

const INITIAL_SIZE = 1000
let liveSize = INITIAL_SIZE
let currentIds: string[] = []

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
			// Инициализируем список id
			currentIds = Array.from(
				{ length: INITIAL_SIZE },
				(_, idx) => `init-${idx}`,
			)
		}

		const op = i % 4

		if (op === 1) {
			liveSize += 1
			const newId = `added-${i}`
			currentIds.push(newId)
			return {
				type: 'ADD',
				id: newId,
				newValue: seedRandom(i + 13),
			}
		}

		if (op === 3) {
			const removeIndex = Math.floor(seedRandom(i + 17) * liveSize)
			const actualIndex = Math.min(removeIndex, liveSize - 1)
			if (currentIds[actualIndex]) {
				const removedId = currentIds[actualIndex]
				currentIds.splice(actualIndex, 1)
				liveSize = Math.max(INITIAL_SIZE, liveSize - 1)
				return {
					type: 'REMOVE',
					index: actualIndex,
					targetId: removedId,
					newValue: 0,
				}
			}
			// Fallback
			liveSize = Math.max(INITIAL_SIZE, liveSize - 1)
			return {
				type: 'UPDATE',
				index: 0,
				targetId: currentIds[0] || 'init-0',
				newValue: seedRandom(i),
			}
		}

		const updateIndex = Math.floor(seedRandom(i + 5) * liveSize)
		const actualIndex = Math.min(updateIndex, Math.max(0, liveSize - 1))
		return {
			type: 'UPDATE',
			index: actualIndex,
			targetId: currentIds[actualIndex] || 'init-0',
			newValue: seedRandom(i),
		}
	},
	iterations: 20000,
	warmupRuns: 2000,
}
