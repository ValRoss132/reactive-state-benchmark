import type { Scenario, WideState, BenchmarkPayload } from '../core/types'

export const CRUDScenario: Scenario<WideState, BenchmarkPayload> = {
	name: 'CRUD & Structural Changes',
	initialState: { items: [], version: 0 },
	generatePayload: (i) => ({
		index: 0,
		newValue: Math.random(),
		type: i % 2 === 0 ? 'ADD' : 'REMOVE',
		id: i.toString(),
	}),
	iterations: 200,
	warmupRuns: 20,
}
