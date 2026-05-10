import { makeAutoObservable } from 'mobx'
import { observer } from 'mobx-react-lite'
import type { StateAdapter } from '../core/types'
import type { BenchmarkPayload, WideState } from '../core/types'
import type React from 'react'

class WideStore {
	items: { id: string; value: number }[] = []
	itemsById: Map<string, { id: string; value: number }> = new Map()
	indexById: Map<string, number> = new Map()
	version = 0

	constructor() {
		makeAutoObservable(this)
	}

	setInitialState(state: WideState) {
		this.items = state.items
		this.version = state.version
		this.itemsById.clear()
		this.indexById.clear()
		this.items.forEach((item) => {
			this.itemsById.set(item.id, item)
		})
		this.items.forEach((item, idx) => {
			this.indexById.set(item.id, idx)
		})
	}

	updateItem(payload: BenchmarkPayload) {
		const { type, index, newValue, id, targetId } = payload as any
		if (type === 'ADD') {
			const newItem = { id: id!, value: newValue }
			this.items.push(newItem)
			this.itemsById.set(newItem.id, newItem)
			this.indexById.set(newItem.id, this.items.length - 1)
		} else if (type === 'REMOVE') {
			const removeId = targetId ?? this.items[index]?.id
			if (!removeId) return
			const removeIndex = this.indexById.get(removeId)
			if (removeIndex === undefined) return

			const lastIndex = this.items.length - 1
			const lastItem = this.items[lastIndex]
			if (removeIndex !== lastIndex && lastItem) {
				this.items[removeIndex] = lastItem
				this.indexById.set(lastItem.id, removeIndex)
			}
			this.items.pop()
			this.itemsById.delete(removeId)
			this.indexById.delete(removeId)
		} else {
			// UPDATE
			const updateId = targetId ?? this.items[index]?.id
			if (!updateId) return
			const item = this.itemsById.get(updateId)
			if (item) item.value = newValue
			const updateIndex = this.indexById.get(updateId)
			if (updateIndex !== undefined && this.items[updateIndex]) {
				this.items[updateIndex].value = newValue
			}
		}
	}
}

const mobxStore = new WideStore()

const MobXSubscriber: React.FC<{ id: string }> = observer(({ id }) => {
	const item = mobxStore.itemsById.get(id)
	const value = item?.value

	if (value === undefined) return null
	return <div data-perf-value={value} style={{ display: 'none' }} />
})

export const MobXAdapter: StateAdapter<WideState, BenchmarkPayload> = {
	name: 'MobX',

	init: (initialData) => {
		mobxStore.setInitialState(initialData)
	},

	update: (payload) => {
		mobxStore.updateItem(payload)
	},

	peek: () => {
		return mobxStore.items.length > 0 ? mobxStore.items[0].value : null
	},

	Subscriber: MobXSubscriber,

	dispose: () => {
		mobxStore.items = []
		mobxStore.itemsById.clear()
		mobxStore.indexById.clear()
	},
}
