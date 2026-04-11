import { makeAutoObservable, runInAction } from 'mobx'
import { createResult, type BenchmarkAdapter } from '../../benchmark/types'

interface TodoItem {
	id: number
	done: boolean
}

const TODO_SIZE = 100

class MobxBenchStore {
	counter = 0

	todos: TodoItem[] = Array.from(
		{ length: TODO_SIZE },
		(_, id): TodoItem => ({
			id,
			done: false,
		}),
	)

	constructor() {
		makeAutoObservable(this)
	}

	setCounter(value: number) {
		this.counter = value
	}

	toggleTodo(id: number) {
		const index = id % this.todos.length
		const target = this.todos[index]
		if (!target) {
			return
		}
		target.done = !target.done
	}
}

export const mobxAdapter: BenchmarkAdapter = {
	manager: 'MobX',
	run: ({ iterations }) => {
		const store = new MobxBenchStore()

		const start = performance.now()
		for (let index = 0; index < iterations; index += 1) {
			runInAction(() => {
				store.setCounter(index)
				store.toggleTodo(index)
			})
		}
		const end = performance.now()

		return createResult('MobX', end - start, iterations * 2, store.counter)
	},
}
