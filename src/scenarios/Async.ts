import type { BenchmarkPayload, Scenario, WideState } from '../core/types'

export const AsyncScenario: Scenario<WideState, BenchmarkPayload> = {
	name: 'High-Frequency Async Stream',
	initialState: {
		items: Array.from({ length: 1000 }, (_, i) => ({
			id: i.toString(),
			value: 0,
		})),
		version: 0,
	},
	generatePayload: () => ({
		index: Math.floor(Math.random() * 1000),
		newValue: Math.random(),
		type: 'UPDATE',
	}),
	iterations: 2000, // Высокая нагрузка
	warmupRuns: 100,
}
