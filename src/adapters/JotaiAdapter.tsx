import { atom, createStore, useAtomValue } from 'jotai'
import type { StateAdapter } from '../core/types'
import type { BenchmarkPayload, WideState } from '../core/types'

const benchmarkStore = createStore()
const itemAtoms = new Map<string, any>()

export const JotaiAdapter: StateAdapter<WideState, BenchmarkPayload> = {
	name: 'Jotai',

	init: (initialData) => {
		itemAtoms.clear()
		initialData.items.forEach((item) => {
			const newAtom = atom(item.value)
			itemAtoms.set(item.id, newAtom)
			benchmarkStore.set(newAtom, item.value)
		})

		JotaiAdapter.peek()
	},

	update: (payload: BenchmarkPayload) => {
		const { type, index, newValue, id, targetId } = payload as any

		if (type === 'ADD') {
			const newAtom = atom(newValue)
			itemAtoms.set(id!, newAtom)
			benchmarkStore.set(newAtom, newValue)
		} else if (type === 'REMOVE') {
			// Используем targetId для удаления атома
			if (targetId) {
				itemAtoms.delete(targetId)
			} else {
				// Fallback: удаляем по индексу в массиве ключей
				const keys = Array.from(itemAtoms.keys())
				if (keys[index]) {
					itemAtoms.delete(keys[index])
				}
			}
		} else {
			// UPDATE: используем targetId для поиска атома
			if (targetId) {
				const targetAtom = itemAtoms.get(targetId)
				if (targetAtom) {
					benchmarkStore.set(targetAtom, newValue)
				}
			} else {
				// Fallback для WideUpdate/Async - по индексу
				const keys = Array.from(itemAtoms.keys())
				const actualId = keys[index]
				if (actualId) {
					const targetAtom = itemAtoms.get(actualId)
					if (targetAtom) {
						benchmarkStore.set(targetAtom, newValue)
					}
				}
			}
		}
	},

	peek: () => {
		const firstId = Array.from(itemAtoms.keys())[0]
		if (!firstId) return null
		const firstAtom = itemAtoms.get(firstId)
		return firstAtom ? benchmarkStore.get(firstAtom) : null
	},

	Subscriber: ({ id }) => {
		const atomRef = itemAtoms.get(id)

		if (!atomRef) {
			return <div style={{ display: 'none' }} data-status='pending' />
		}

		return <JotaiInner id={id} atomRef={atomRef} />
	},

	dispose: () => {
		itemAtoms.clear()
	},
}

const JotaiInner = ({ atomRef }: { id: string; atomRef: any }) => {
	const value = useAtomValue(atomRef, { store: benchmarkStore })
	return <div data-perf-value={value} style={{ display: 'none' }} />
}
