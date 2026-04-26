import { create } from 'zustand'
import type { StateAdapter } from '../core/types'
import type { WideState, WidePayload } from '../scenarios/WideUpdate'

// Внутреннее хранилище
type Store = WideState & {
	updateItem: (p: WidePayload) => void
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

export const ZustandAdapter: StateAdapter<WideState, WidePayload> = {
	name: 'Zustand',

	init: (initialData) => {
		useStore.setState(initialData)
	},

	update: (payload) => {
		// Вызов действия вне React-компонента
		useStore.getState().updateItem(payload)
	},

	peek: () => {
		// Чтение для оценки Propagation Cost
		return useStore.getState().items[0].value
	},

	Subscriber: ({ id }) => {
		// Идиоматичный Zustand: подписка на конкретное поле через селектор
		const value = useStore((state) => state.items[Number(id)]?.value)
		if (value === undefined) return null
		return <div data-perf-value={value} style={{ display: 'none' }} />
	},

	dispose: () => {
		useStore.setState({ items: [], version: 0 })
	},
}
