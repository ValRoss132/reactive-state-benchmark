import {
	configureStore,
	createSlice,
	type PayloadAction,
} from '@reduxjs/toolkit'
import { createResult, type BenchmarkAdapter } from '../../benchmark/types'

interface TodoItem {
	id: number
	done: boolean
}

const TODO_SIZE = 100

const counterSlice = createSlice({
	name: 'counter',
	initialState: { value: 0 },
	reducers: {
		setCounter: (state, action: PayloadAction<number>) => {
			state.value = action.payload
		},
	},
})

const todosSlice = createSlice({
	name: 'todos',
	initialState: {
		items: Array.from(
			{ length: TODO_SIZE },
			(_, id): TodoItem => ({ id, done: false }),
		),
	},
	reducers: {
		toggleById: (state, action: PayloadAction<number>) => {
			const index = action.payload % state.items.length
			const target = state.items[index]
			if (!target) {
				return
			}
			target.done = !target.done
		},
	},
})

export const reduxAdapter: BenchmarkAdapter = {
	manager: 'Redux Toolkit',
	run: ({ iterations }) => {
		const store = configureStore({
			reducer: {
				counter: counterSlice.reducer,
				todos: todosSlice.reducer,
			},
		})

		const start = performance.now()
		for (let index = 0; index < iterations; index += 1) {
			store.dispatch(counterSlice.actions.setCounter(index))
			store.dispatch(todosSlice.actions.toggleById(index))
		}
		const end = performance.now()

		const finalCounter = store.getState().counter.value
		return createResult(
			'Redux Toolkit',
			end - start,
			iterations * 2,
			finalCounter,
		)
	},
}
