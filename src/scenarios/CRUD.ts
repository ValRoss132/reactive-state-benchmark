import type { Scenario, WideState, BenchmarkPayload } from '../core/types'

export const CRUDScenario: Scenario<WideState, BenchmarkPayload> = {
	name: 'CRUD Homeostasis',
	initialState: {
		items: Array.from({ length: 1000 }, (_, i) => ({
			id: `init-${i}`,
			value: i,
		})),
		version: 0,
	},
	generatePayload: (i) => {
		const op = i % 4
		if (op === 0)
			return { type: 'UPDATE', index: i % 1000, newValue: Math.random() }
		if (op === 1)
			return { type: 'ADD', id: `added-${i}`, newValue: Math.random() }
		if (op === 2)
			return { type: 'UPDATE', index: (i + 1) % 1000, newValue: Math.random() }
		return { type: 'REMOVE', index: i % 1000, newValue: 0 }
	},
	iterations: 10000,
	warmupRuns: 1000,
}
