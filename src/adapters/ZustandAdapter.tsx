import { create } from 'zustand'
import type { StateAdapter } from '../core/types'
import type { BenchmarkPayload, WideState } from '../core/types'

interface ExtendedWideState extends WideState {
	itemsById: Record<string, { id: string; value: number }>
	indexById: Record<string, number>
}

const useStore = create<ExtendedWideState>(() => ({
	items: [],
	itemsById: {},
	indexById: {},
	version: 0,
}))

export const ZustandAdapter: StateAdapter<WideState, BenchmarkPayload> = {
	name: 'Zustand',
	metadata: {
		id: 'zustand',
		name: 'Zustand',
		group: 'state-core',
		description: 'External store with selector-based subscriptions.',
	},

	init: (initialData) => {
		const itemsById: Record<string, { id: string; value: number }> = {}
		const indexById: Record<string, number> = {}
		initialData.items.forEach((item) => {
			itemsById[item.id] = item
		})
		initialData.items.forEach((item, idx) => {
			indexById[item.id] = idx
		})
		useStore.setState({ ...initialData, itemsById, indexById })
	},

	update: (payload: BenchmarkPayload) => {
		const { type, index, newValue, id, targetId } = payload as any

		useStore.setState((state) => {
			if (type === 'ADD') {
				const newItem = { id: id!, value: newValue }
				const nextIndex = state.items.length
				return {
					items: [...state.items, newItem],
					itemsById: { ...state.itemsById, [newItem.id]: newItem },
					indexById: { ...state.indexById, [newItem.id]: nextIndex },
				}
			}
			if (type === 'REMOVE') {
				const removeId = targetId ?? state.items[index]?.id
				if (!removeId) return state

				const removeIndex = state.indexById[removeId]
				if (removeIndex === undefined) return state

				const newItems = [...state.items]
				const newById = { ...state.itemsById }
				const newIndexById = { ...state.indexById }

				const lastIndex = newItems.length - 1
				const lastItem = newItems[lastIndex]
				if (removeIndex !== lastIndex && lastItem) {
					newItems[removeIndex] = lastItem
					newIndexById[lastItem.id] = removeIndex
				}
				newItems.pop()
				delete newById[removeId]
				delete newIndexById[removeId]

				return { items: newItems, itemsById: newById, indexById: newIndexById }
			}

			// UPDATE
			const newItems = [...state.items]
			const newById = { ...state.itemsById }
			const updateId = targetId ?? state.items[index]?.id
			if (!updateId || !newById[updateId]) return state

			const updateIndex = state.indexById[updateId]
			const updatedItem = { ...newById[updateId], value: newValue }
			newById[updateId] = updatedItem
			if (updateIndex !== undefined) newItems[updateIndex] = updatedItem

			return { items: newItems, itemsById: newById, indexById: state.indexById }
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
		useStore.setState({ items: [], itemsById: {}, indexById: {}, version: 0 })
	},
}
