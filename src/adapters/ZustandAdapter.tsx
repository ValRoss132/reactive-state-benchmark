import { create } from 'zustand'
import type { StateAdapter } from '../core/types'
import type { BenchmarkPayload, WideState } from '../core/types'

interface ExtendedWideState extends WideState {
	itemsById: Record<string, { id: string; value: number }>
}

const useStore = create<ExtendedWideState>(() => ({
	items: [],
	itemsById: {},
	version: 0,
}))

export const ZustandAdapter: StateAdapter<WideState, BenchmarkPayload> = {
	name: 'Zustand',

	init: (initialData) => {
		const itemsById: Record<string, { id: string; value: number }> = {}
		initialData.items.forEach((item) => {
			itemsById[item.id] = item
		})
		useStore.setState({ ...initialData, itemsById })
	},

	update: (payload: BenchmarkPayload) => {
		const { type, index, newValue, id, targetId } = payload as any

		useStore.setState((state) => {
			if (type === 'ADD') {
				const newItem = { id: id!, value: newValue }
				return {
					items: [...state.items, newItem],
					itemsById: { ...state.itemsById, [newItem.id]: newItem },
				}
			}
			if (type === 'REMOVE') {
				const newById = { ...state.itemsById }
				let newItems = state.items

				if (targetId) {
					newItems = state.items.filter((item) => item.id !== targetId)
					delete newById[targetId]
				} else {
					const removed = state.items[index]
					if (removed) {
						delete newById[removed.id]
						newItems = state.items.filter((_, i) => i !== index)
					}
				}
				return { items: newItems, itemsById: newById }
			}

			// UPDATE
			const newItems = [...state.items]
			const newById = { ...state.itemsById }

			if (targetId && state.itemsById[targetId]) {
				const updatedItem = { ...state.itemsById[targetId], value: newValue }
				newById[targetId] = updatedItem
				const itemIndex = newItems.findIndex((item) => item.id === targetId)
				if (itemIndex >= 0) newItems[itemIndex] = updatedItem
			} else if (newItems[index]) {
				const updatedItem = { ...newItems[index], value: newValue }
				newItems[index] = updatedItem
				newById[updatedItem.id] = updatedItem
			}
			return { items: newItems, itemsById: newById }
		})
	},

	peek: () => {
		const items = useStore.getState().items
		return items.length > 0 ? items[0].value : null
	},

	Subscriber: ({ id }) => {
		const value = useStore((state) => state.itemsById[id]?.value)
		if (value === undefined) return null
		return <div data-perf-value={value} style={{ display: 'none' }} />
	},

	dispose: () => {
		useStore.setState({ items: [], itemsById: {}, version: 0 })
	},
}
