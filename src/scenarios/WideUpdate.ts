import type { Scenario } from '../core/types'

export type WideState = {
	items: { id: string; value: number }[]
	version: number
}

export type WidePayload = {
	index: number
	newValue: number
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
		// Обновляем элементы по кругу
		index: iteration % 1000,
		newValue: Math.random(),
	}),

	iterations: 100, // Для тестов хватит, для финального замера поставим 300+
	warmupRuns: 10,
}
