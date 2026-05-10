import React from 'react'
import { atom, createStore, useAtomValue } from 'jotai'
import type { PrimitiveAtom } from 'jotai'
import type { StateAdapter, BenchmarkPayload, WideState } from '../core/types'

const benchmarkStore = createStore()
const idsAtom = atom<string[]>([])
const indexByIdAtom = atom<Record<string, number>>({})
const itemAtomsMap = new Map<string, PrimitiveAtom<number>>()

const getItemAtom = (
	id: string,
	initialValue: number,
): PrimitiveAtom<number> => {
	let atomRef = itemAtomsMap.get(id)
	if (!atomRef) {
		atomRef = atom(initialValue)
		itemAtomsMap.set(id, atomRef)
	}
	return atomRef
}

export const JotaiAdapter: StateAdapter<WideState, BenchmarkPayload> = {
	name: 'Jotai',
	metadata: {
		id: 'jotai',
		name: 'Jotai',
		group: 'ui-coupled',
		description: 'Atom-level state with per-item subscriptions.',
	},

	init: (initialData) => {
		const ids: string[] = []
		const indexById: Record<string, number> = {}

		initialData.items.forEach((item, idx) => {
			ids.push(item.id)
			indexById[item.id] = idx
			const a = getItemAtom(item.id, item.value)
			benchmarkStore.set(a, item.value)
		})

		benchmarkStore.set(idsAtom, ids)
		benchmarkStore.set(indexByIdAtom, indexById)
	},

	update: (payload: BenchmarkPayload) => {
		const { type, index, newValue, id, targetId } = payload as any

		if (type === 'UPDATE') {
			const ids = benchmarkStore.get(idsAtom)
			const updateId = targetId ?? ids[index]

			if (updateId) {
				const atomRef = itemAtomsMap.get(updateId)
				if (atomRef) {
					benchmarkStore.set(atomRef, newValue)
				}
			}
			return
		}

		const currentIds = benchmarkStore.get(idsAtom)
		const currentIndexById = benchmarkStore.get(indexByIdAtom)

		if (type === 'ADD') {
			const nextIds = [...currentIds, id!]
			const nextIndexById = { ...currentIndexById, [id!]: currentIds.length }

			const a = getItemAtom(id!, newValue)
			benchmarkStore.set(a, newValue)

			benchmarkStore.set(idsAtom, nextIds)
			benchmarkStore.set(indexByIdAtom, nextIndexById)
		} else if (type === 'REMOVE') {
			const removeId = targetId ?? currentIds[index]
			const removeIndex = currentIndexById[removeId]

			if (removeId && removeIndex !== undefined) {
				const nextIds = [...currentIds]
				const nextIndexById = { ...currentIndexById }
				const lastIndex = nextIds.length - 1
				const lastId = nextIds[lastIndex]

				if (removeIndex !== lastIndex) {
					nextIds[removeIndex] = lastId
					nextIndexById[lastId] = removeIndex
				}

				nextIds.pop()
				delete nextIndexById[removeId]
				// Do not delete from itemAtomsMap because the UI component might still be mounted
				// and storing its reference for subsequent benchmark iterations.

				benchmarkStore.set(idsAtom, nextIds)
				benchmarkStore.set(indexByIdAtom, nextIndexById)
			}
		}
	},

	peek: () => {
		const ids = benchmarkStore.get(idsAtom)
		const firstId = ids[0]
		if (!firstId) return null
		const a = itemAtomsMap.get(firstId)
		return a ? benchmarkStore.get(a) : null
	},

	Subscriber: React.memo(({ id }: { id: string }) => {
		return <JotaiInner id={id} />
	}),

	dispose: () => {
		benchmarkStore.set(idsAtom, [])
		benchmarkStore.set(indexByIdAtom, {})
		// Do not clear itemAtomsMap because mounted JotaiInner components hold references to these atoms.
		// If we clear them, init() will create new atoms and the UI will listen to the old stale ones.
	},
}

const JotaiInner = ({ id }: { id: string }) => {
	const atomRef = getItemAtom(id, 0)
	const value = useAtomValue(atomRef, { store: benchmarkStore })

	const dummy = Math.sqrt(value)

	return (
		<div
			data-id={id}
			data-perf-val={value}
			data-noise={dummy}
			style={{ display: 'none' }}
		/>
	)
}
