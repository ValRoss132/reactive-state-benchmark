import type { Scenario } from '../core/types'

export type WideState = {
	items: { id: string; value: number }[]
	version: number
}

export type WidePayload = {
	index: number
	newValue: number
}

const seedRandom = (seed: number) => {
	const x = Math.sin(seed) * 1000
	return x - Math.floor(x)
}

export const WideUpdateScenario: Scenario<WideState, WidePayload> = {
	name: 'Wide Subscription (1000 items)',

	initialState: {
		items: Array.from({ length: 1000 }, (_, i) => ({
			id: i.toString(),
			value: 0,
		})),
		version: 0,
	},

	generatePayload: (iteration) => ({
		index: iteration % 1000,
		newValue: seedRandom(iteration),
	}),

	iterations: 100,
	warmupRuns: 10,
}
