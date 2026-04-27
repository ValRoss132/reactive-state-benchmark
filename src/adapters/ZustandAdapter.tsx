import { create } from 'zustand'
import type { StateAdapter } from '../core/types'
import type { BenchmarkPayload, WideState } from '../core/types'

const useStore = create<WideState>(() => ({
	items: [],
	version: 0,
}))

export const ZustandAdapter: StateAdapter<WideState, BenchmarkPayload> = {
	name: 'Zustand',

	init: (initialData) => {
		useStore.setState(initialData)
	},

	update: (payload: BenchmarkPayload) => {
		const { type, index, newValue, id, targetId } = payload as any

		useStore.setState((state) => {
			if (type === 'ADD') {
				return { items: [...state.items, { id: id!, value: newValue }] }
			}
			if (type === 'REMOVE') {
				// Используем targetId для поиска элемента
				if (targetId) {
					return { items: state.items.filter((item) => item.id !== targetId) }
				}
				return { items: state.items.filter((_, i) => i !== index) }
			}
			const newItems = [...state.items]
			if (targetId) {
				// UPDATE с targetId: ищем элемент по id
				const itemIndex = newItems.findIndex((item) => item.id === targetId)
				if (itemIndex >= 0) {
					newItems[itemIndex] = { ...newItems[itemIndex], value: newValue }
				}
			} else if (newItems[index]) {
				// Fallback для WideUpdate/Async по индексу
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
		const value = useStore((state) => {
			const item = state.items.find((item) => item.id === id)
			return item?.value
		})
		if (value === undefined) return null
		return <div data-perf-value={value} style={{ display: 'none' }} />
	},

	dispose: () => {
		useStore.setState({ items: [], version: 0 })
	},
}
