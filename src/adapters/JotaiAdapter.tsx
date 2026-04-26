import React from 'react'
import { atom, createStore, useAtomValue } from 'jotai'
import type { StateAdapter } from '../core/types'
import type { WideState, WidePayload } from '../scenarios/WideUpdate'

const benchmarkStore = createStore()
// Используем Map вместо массива для более надежного доступа по ключу
const itemAtoms = new Map<string, any>()

export const JotaiAdapter: StateAdapter<WideState, WidePayload> = {
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

	update: (payload) => {
		// Находим атом по индексу (преобразуем индекс в строку id)
		const targetId = payload.index.toString()
		const targetAtom = itemAtoms.get(targetId)
		if (targetAtom) {
			benchmarkStore.set(targetAtom, payload.newValue)
		}
	},

	peek: () => {
		const firstAtom = itemAtoms.get('0')
		if (!firstAtom) return 0
		return firstAtom ? benchmarkStore.get(firstAtom) : 0
	},

	Subscriber: React.memo(({ id }) => {
		const atomRef = itemAtoms.get(id)

		// Если атома нет (идет инициализация), рендерим заглушку
		// Это предотвратит Uncaught Error: Atom is undefined
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
