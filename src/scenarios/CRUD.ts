import type {
	Scenario,
	WideState,
	BenchmarkPayload,
	ExperimentConfig,
} from '../core/types'
import { normalizeOperationMix } from '../core/config'
import { seedRandom } from '../utils/seedRandom'

const createCrudState = (size: number): WideState => ({
	items: Array.from({ length: size }, (_, i) => ({
		id: `init-${i}`,
		value: i,
	})),
	version: 0,
})

const stateBySignature = new Map<string, string[]>()

const getSignature = (config: ExperimentConfig, seed: number) =>
	[
		seed,
		config.initialSize,
		config.operationMix.update,
		config.operationMix.add,
		config.operationMix.remove,
	].join(':')

const resolveOperation = (
	iteration: number,
	seed: number,
	config: ExperimentConfig,
) => {
	const mix = normalizeOperationMix(config.operationMix)
	const total = mix.update + mix.add + mix.remove
	const roll = seedRandom(seed + iteration + 31) * total

	if (roll < mix.update) return 'UPDATE'
	if (roll < mix.update + mix.add) return 'ADD'
	return 'REMOVE'
}

export const CRUDScenario: Scenario<WideState, BenchmarkPayload> = {
	name: 'CRUD Homeostasis',
	initialState: createCrudState(1000),
	createInitialState: (config) => createCrudState(config.initialSize),
	generatePayload: (iteration, seed, config) => {
		const signature = getSignature(config, seed)

		if (iteration === 0 || !stateBySignature.has(signature)) {
			stateBySignature.set(
				signature,
				Array.from({ length: config.initialSize }, (_, idx) => `init-${idx}`),
			)
		}

		const currentIds = stateBySignature.get(signature)!
		const operation = resolveOperation(iteration, seed, config)

		if (operation === 'ADD' || currentIds.length === 0) {
			const newId = `added-${seed}-${iteration}`
			currentIds.push(newId)
			return {
				type: 'ADD',
				id: newId,
				newValue: seedRandom(seed + iteration + 13),
			}
		}

		if (operation === 'REMOVE') {
			const removeIndex = Math.floor(
				seedRandom(seed + iteration + 17) * currentIds.length,
			)
			const removedId = currentIds[removeIndex]
			currentIds[removeIndex] = currentIds[currentIds.length - 1]
			currentIds.pop()
			return {
				type: 'REMOVE',
				index: removeIndex,
				targetId: removedId,
				newValue: 0,
			}
		}

		const updateIndex = Math.floor(
			seedRandom(seed + iteration + 5) * currentIds.length,
		)

		return {
			type: 'UPDATE',
			index: updateIndex,
			targetId: currentIds[updateIndex],
			newValue: seedRandom(seed + iteration),
		}
	},
	iterations: 10000,
	warmupRuns: 1000,
}
