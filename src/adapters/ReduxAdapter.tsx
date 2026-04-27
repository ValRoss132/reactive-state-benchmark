import { configureStore, createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { StateAdapter } from '../core/types'
import type { BenchmarkPayload, WideState } from '../core/types'
import { useSelector, Provider } from 'react-redux'
import React from 'react'

const defaultState: WideState = {
	items: [],
	version: 0,
}

const wideSlice = createSlice({
	name: 'wide',
	initialState: defaultState,
	reducers: {
		setInitialState: (state, action: PayloadAction<WideState>) => {
			state.items = action.payload.items
		},
		processPayload: (state, action: PayloadAction<BenchmarkPayload>) => {
			const { type, index, newValue, id, targetId } = action.payload as any
			if (type === 'ADD') {
				state.items.push({ id: id!, value: newValue })
			} else if (type === 'REMOVE') {
				// Используем targetId если доступно, иначе падаем на индекс
				if (targetId) {
					state.items = state.items.filter((item) => item.id !== targetId)
				} else {
					state.items.splice(index, 1)
				}
			} else {
				// UPDATE: используем targetId для поиска элемента
				if (targetId) {
					const item = state.items.find((item) => item.id === targetId)
					if (item) item.value = newValue
				} else if (state.items[index]) {
					state.items[index].value = newValue
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
			// Ищем элемент по id напрямую
			const item = state.wide.items.find((item: any) => item.id === id)
			return item?.value
		})
		if (value === undefined) return null

		return <div data-perf-value={value} style={{ display: 'none' }} />
	},

	dispose: () => {},
}

export const ReduxProvider = ({ children }: { children: React.ReactNode }) => (
	<Provider store={store}>{children}</Provider>
)
