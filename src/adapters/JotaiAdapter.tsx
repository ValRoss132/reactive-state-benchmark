import React from 'react'
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
		const { type, index, newValue, id } = payload

		if (type === 'ADD') {
			const newAtom = atom(newValue)
			itemAtoms.set(id!, newAtom)
			benchmarkStore.set(newAtom, newValue)
		} else if (type === 'REMOVE') {
			const targetId = Array.from(itemAtoms.keys())[index]
			if (targetId) itemAtoms.delete(targetId)
		} else {
			const targetId = index.toString()
			const targetAtom = itemAtoms.get(targetId)
			if (targetAtom) benchmarkStore.set(targetAtom, newValue)
		}
	},

	peek: () => {
		const firstAtom = itemAtoms.get('0')
		if (!firstAtom) return 0
		return firstAtom ? benchmarkStore.get(firstAtom) : 0
	},

	Subscriber: React.memo(({ id }) => {
		const atomRef = itemAtoms.get(id)

		if (!atomRef) {
			return <div style={{ display: 'none' }} data-status='pending' />
		}

		return <JotaiInner id={id} atomRef={atomRef} />
	}),

	dispose: () => {
		itemAtoms.clear()
	},
}

const JotaiInner = ({ atomRef }: { id: string; atomRef: any }) => {
	const value = useAtomValue(atomRef, { store: benchmarkStore })
	return <div data-perf-value={value} style={{ display: 'none' }} />
}
