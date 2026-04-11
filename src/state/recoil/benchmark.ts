import { atom, snapshot_UNSTABLE } from 'recoil'
import { createResult, type BenchmarkAdapter } from '../../benchmark/types'

interface TodoItem {
	id: number
	done: boolean
}

const TODO_SIZE = 100

const recoilCounterAtom = atom<number>({
	key: 'bench/recoilCounter',
	default: 0,
})

const recoilTodosAtom = atom<TodoItem[]>({
	key: 'bench/recoilTodos',
	default: Array.from(
		{ length: TODO_SIZE },
		(_, id): TodoItem => ({ id, done: false }),
	),
})

export const recoilAdapter: BenchmarkAdapter = {
	manager: 'Recoil',
	run: ({ iterations }) => {
		let snapshot = snapshot_UNSTABLE()

		const start = performance.now()
		for (let index = 0; index < iterations; index += 1) {
			snapshot = snapshot.map(({ set }) => {
				set(recoilCounterAtom, index)
				set(recoilTodosAtom, (previousTodos) => {
					const targetIndex = index % previousTodos.length
					const nextTodos = previousTodos.slice()
					const targetTodo = nextTodos[targetIndex]
					if (!targetTodo) {
						return previousTodos
					}
					nextTodos[targetIndex] = {
						...targetTodo,
						done: !targetTodo.done,
					}
					return nextTodos
				})
			})
		}
		const end = performance.now()

		const finalCounter = snapshot.getLoadable(recoilCounterAtom).valueOrThrow()
		return createResult('Recoil', end - start, iterations * 2, finalCounter)
	},
}
