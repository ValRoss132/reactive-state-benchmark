import { configureStore, createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { StateAdapter } from '../core/types'
import type { WideState, WidePayload } from '../scenarios/WideUpdate'
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
		// Добавляем экшен для принудительной установки стейта
		setInitialState: (state, action: PayloadAction<WideState>) => {
			state.items = action.payload.items
			state.version = action.payload.version
		},
		updateItem: (state, action: PayloadAction<WidePayload>) => {
			const item = state.items[action.payload.index]
			if (item) {
				item.value = action.payload.newValue
			} else {
				console.warn(`Item at index ${action.payload.index} not found!`)
			}
		},
	},
})

const store = configureStore({
	reducer: { wide: wideSlice.reducer },
	middleware: (getDefault) =>
		getDefault({ serializableCheck: false, immutableCheck: false }),
})

export const ReduxAdapter: StateAdapter<WideState, WidePayload> = {
	name: 'Redux Toolkit',

	init: (initialData) => {
		store.dispatch(wideSlice.actions.setInitialState(initialData))
	},

	update: (payload) => {
		store.dispatch(wideSlice.actions.updateItem(payload))
	},

	peek: () => {
		return store.getState().wide.items[0].value
	},

	Subscriber: ({ id }) => {
		// Используем селектор — это важно для оптимизации Redux
		const value = useSelector(
			(state: any) => state.wide.items[Number(id)]?.value,
		)
		if (value === undefined) return null

		return <div data-perf-value={value} style={{ display: 'none' }} />
	},

	dispose: () => {},
}

// Нам понадобится провайдер в App.tsx для Redux
export const ReduxProvider = ({ children }: { children: React.ReactNode }) => (
	<Provider store={store}>{children}</Provider>
)
