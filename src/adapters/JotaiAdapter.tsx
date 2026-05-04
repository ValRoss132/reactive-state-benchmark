import { atom, createStore, useAtomValue } from 'jotai'
import type { StateAdapter } from '../core/types'
import type { BenchmarkPayload, WideState } from '../core/types'

const benchmarkStore = createStore()
const itemsAtom = atom<WideState['items']>([])
const itemValueAtoms = new Map<string, any>()

const resolveIndex = (
	items: { id: string; value: number }[],
	index?: number,
	targetId?: string,
) => {
	if (targetId) {
		const idx = items.findIndex((item) => item.id === targetId)
		if (idx >= 0) return idx
	}
	return typeof index === 'number' ? index : -1
}

const getItemValueAtom = (id: string) => {
	let atomRef = itemValueAtoms.get(id)
	if (!atomRef) {
		atomRef = atom((get) => {
			const item = get(itemsAtom).find((candidate) => candidate.id === id)
			return item?.value
		})
		itemValueAtoms.set(id, atomRef)
	}
	return atomRef
}

export const JotaiAdapter: StateAdapter<WideState, BenchmarkPayload> = {
	name: 'Jotai',

	init: (initialData) => {
		benchmarkStore.set(itemsAtom, initialData.items)
		JotaiAdapter.peek()
	},

	update: (payload: BenchmarkPayload) => {
		const { type, index, newValue, id, targetId } = payload as any
		const items = [...benchmarkStore.get(itemsAtom)]

		if (type === 'ADD') {
			items.push({ id: id!, value: newValue })
			benchmarkStore.set(itemsAtom, items)
			return
		} else if (type === 'REMOVE') {
			const idx = resolveIndex(items, index, targetId)
			if (idx >= 0 && idx < items.length) items.splice(idx, 1)
			benchmarkStore.set(itemsAtom, items)
			return
		} else {
			const idx = resolveIndex(items, index, targetId)
			if (idx >= 0 && idx < items.length) {
				items[idx] = { ...items[idx], value: newValue }
				benchmarkStore.set(itemsAtom, items)
			}
		}
	},

	peek: () => {
		const items = benchmarkStore.get(itemsAtom)
		return items.length > 0 ? items[0].value : null
	},

	Subscriber: ({ id }) => {
		return <JotaiInner id={id} />
	},

	dispose: () => {
		benchmarkStore.set(itemsAtom, [])
	},
}

const JotaiInner = ({ id }: { id: string }) => {
	const value = useAtomValue(getItemValueAtom(id), { store: benchmarkStore })
	if (value === undefined) return null
	return <div data-perf-value={value} style={{ display: 'none' }} />
}
