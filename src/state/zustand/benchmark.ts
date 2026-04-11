import { createStore } from 'zustand/vanilla'
import { createResult, type BenchmarkAdapter } from '../../benchmark/types'

interface TodoItem {
	id: number
	done: boolean
}

interface ZustandBenchState {
	counter: number
	todos: TodoItem[]
	setCounter: (value: number) => void
	toggleTodo: (id: number) => void
}

const TODO_SIZE = 100

export const zustandAdapter: BenchmarkAdapter = {
	manager: 'Zustand',
	run: ({ iterations }) => {
		const store = createStore<ZustandBenchState>()((set) => ({
			counter: 0,
			todos: Array.from(
				{ length: TODO_SIZE },
				(_, id): TodoItem => ({ id, done: false }),
			),
			setCounter: (value) => set({ counter: value }),
			toggleTodo: (id) =>
				set((state) => {
					const index = id % state.todos.length
					const nextTodos = state.todos.slice()
					const currentTodo = nextTodos[index]
					if (!currentTodo) {
						return state
					}
					nextTodos[index] = {
						...currentTodo,
						done: !currentTodo.done,
					}

					return { todos: nextTodos }
				}),
		}))

		const start = performance.now()
		for (let index = 0; index < iterations; index += 1) {
			store.getState().setCounter(index)
			store.getState().toggleTodo(index)
		}
		const end = performance.now()

		return createResult(
			'Zustand',
			end - start,
			iterations * 2,
			store.getState().counter,
		)
	},
}
