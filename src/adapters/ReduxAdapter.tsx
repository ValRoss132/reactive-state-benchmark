import { configureStore, createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { StateAdapter } from '../core/types'
import type { BenchmarkPayload, WideState } from '../core/types'
import { useSelector, Provider } from 'react-redux'
import React from 'react'

interface ExtendedWideState extends WideState {
	itemsById: Record<string, { id: string; value: number }>
	indexById: Record<string, number>
}

const defaultState: ExtendedWideState = {
	items: [],
	itemsById: {},
	indexById: {},
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
			state.indexById = {}
			action.payload.items.forEach((item) => {
				state.itemsById[item.id] = item
			})
			action.payload.items.forEach((item, idx) => {
				state.indexById[item.id] = idx
			})
		},
		processPayload: (state, action: PayloadAction<BenchmarkPayload>) => {
			const { type, index, newValue, id, targetId } = action.payload as any
			if (type === 'ADD') {
				const newItem = { id: id!, value: newValue }
				state.items.push(newItem)
				state.itemsById[newItem.id] = newItem
				state.indexById[newItem.id] = state.items.length - 1
			} else if (type === 'REMOVE') {
				const removeId = targetId ?? state.items[index]?.id
				if (!removeId) return
				const removeIndex = state.indexById[removeId]
				if (removeIndex === undefined) return

				const lastIndex = state.items.length - 1
				const lastItem = state.items[lastIndex]
				if (removeIndex !== lastIndex && lastItem) {
					state.items[removeIndex] = lastItem
					state.indexById[lastItem.id] = removeIndex
				}
				state.items.pop()
				delete state.itemsById[removeId]
				delete state.indexById[removeId]
			} else {
				// UPDATE
				const updateId = targetId ?? state.items[index]?.id
				if (!updateId || !state.itemsById[updateId]) return
				state.itemsById[updateId].value = newValue
				const updateIndex = state.indexById[updateId]
				if (updateIndex !== undefined && state.items[updateIndex]) {
					state.items[updateIndex].value = newValue
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

	dispose: () => {
		store.dispatch(wideSlice.actions.setInitialState(defaultState))
	},
}

export const ReduxProvider = ({ children }: { children: React.ReactNode }) => (
	<Provider store={store}>{children}</Provider>
)
