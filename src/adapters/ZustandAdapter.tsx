import { create } from 'zustand'
import type { StateAdapter } from '../core/types'
import type { BenchmarkPayload, WideState } from '../core/types'

type Store = WideState & {
	updateItem: (p: BenchmarkPayload) => void
}

const useStore = create<Store>((set) => ({
	items: [],
	version: 0,
	updateItem: (payload) =>
		set((state) => {
			const newItems = state.items.slice()
			newItems[payload.index] = {
				...newItems[payload.index],
				value: payload.newValue,
			}
			return { items: newItems }
		}),
}))

export const ZustandAdapter: StateAdapter<WideState, BenchmarkPayload> = {
	name: 'Zustand',

	init: (initialData) => {
		useStore.setState(initialData)
	},

	update: (payload: BenchmarkPayload) => {
		const { type, index, newValue, id } = payload

		useStore.setState((state) => {
			if (type === 'ADD') {
				return { items: [...state.items, { id: id!, value: newValue }] }
			}
			if (type === 'REMOVE') {
				return { items: state.items.filter((_, i) => i !== index) }
			}
			const newItems = [...state.items]
			if (newItems[index]) {
				newItems[index] = { ...newItems[index], value: newValue }
			}
			return { items: newItems }
		})
	},

	peek: () => {
		const items = useStore.getState().items
		return items.length > 0 ? items[0].value : null
	},

	Subscriber: ({ id }) => {
		const value = useStore((state) => state.items[Number(id)]?.value)
		if (value === undefined) return null
		return <div data-perf-value={value} style={{ display: 'none' }} />
	},

	dispose: () => {
		useStore.setState({ items: [], version: 0 })
	},
}
