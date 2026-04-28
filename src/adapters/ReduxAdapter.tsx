import { configureStore, createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { StateAdapter } from '../core/types'
import type { BenchmarkPayload, WideState } from '../core/types'
import { useSelector, Provider } from 'react-redux'
import React from 'react'

interface ExtendedWideState extends WideState {
	itemsById: Record<string, { id: string; value: number }>
}

const defaultState: ExtendedWideState = {
	items: [],
	itemsById: {},
	version: 0,
}

const wideSlice = createSlice({
	name: 'wide',
	initialState: defaultState,
	reducers: {
		setInitialState: (state, action: PayloadAction<WideState>) => {
			state.items = action.payload.items
			state.version = action.payload.version
			state.itemsById = {}
			action.payload.items.forEach((item) => {
				state.itemsById[item.id] = item
			})
		},
		processPayload: (state, action: PayloadAction<BenchmarkPayload>) => {
			const { type, index, newValue, id, targetId } = action.payload as any
			if (type === 'ADD') {
				const newItem = { id: id!, value: newValue }
				state.items.push(newItem)
				state.itemsById[newItem.id] = newItem
			} else if (type === 'REMOVE') {
				if (targetId) {
					state.items = state.items.filter((item) => item.id !== targetId)
					delete state.itemsById[targetId]
				} else {
					const removed = state.items.splice(index, 1)[0]
					if (removed) delete state.itemsById[removed.id]
				}
			} else {
				// UPDATE
				if (targetId && state.itemsById[targetId]) {
					state.itemsById[targetId].value = newValue
					const idx = state.items.findIndex((item) => item.id === targetId)
					if (idx !== -1) state.items[idx].value = newValue
				} else if (state.items[index]) {
					state.items[index].value = newValue
					state.itemsById[state.items[index].id].value = newValue
				}
			}
		},
	},
})

const store = configureStore({
	reducer: { wide: wideSlice.reducer },
	middleware: (getDefault) =>
		getDefault({ serializableCheck: false, immutableCheck: false }),
})

export const ReduxAdapter: StateAdapter<WideState, BenchmarkPayload> = {
	name: 'Redux Toolkit',

	init: (initialData) => {
		store.dispatch(wideSlice.actions.setInitialState(initialData))
	},

	update: (payload) => {
		store.dispatch(wideSlice.actions.processPayload(payload))
	},

	peek: () => {
		const state = store.getState()
		const items = state.wide.items
		return items.length > 0 ? items[0].value : null
	},

	Subscriber: ({ id }) => {
		const value = useSelector((state: any) => {
			// Быстрый поиск в кешированной map O(1) вместо O(N)
			return state.wide.itemsById[id]?.value
		})
		if (value === undefined) return null

		return <div data-perf-value={value} style={{ display: 'none' }} />
	},

	dispose: () => {},
}

export const ReduxProvider = ({ children }: { children: React.ReactNode }) => (
	<Provider store={store}>{children}</Provider>
)
