import { makeAutoObservable } from 'mobx'
import { observer } from 'mobx-react-lite'
import type { StateAdapter } from '../core/types'
import type { BenchmarkPayload, WideState } from '../core/types'
import type React from 'react'

class WideStore {
	items: { id: string; value: number }[] = []
	itemsById: Map<string, { id: string; value: number }> = new Map()
	version = 0

	constructor() {
		makeAutoObservable(this)
	}

	setInitialState(state: WideState) {
		this.items = state.items
		this.version = state.version
		this.itemsById.clear()
		this.items.forEach((item) => {
			this.itemsById.set(item.id, item)
		})
	}

	updateItem(payload: BenchmarkPayload) {
		const { type, index, newValue, id, targetId } = payload as any
		if (type === 'ADD') {
			const newItem = { id: id!, value: newValue }
			this.items.push(newItem)
			this.itemsById.set(newItem.id, newItem)
		} else if (type === 'REMOVE') {
			if (targetId) {
				const indexToRemove = this.items.findIndex(
					(item) => item.id === targetId,
				)
				if (indexToRemove >= 0) {
					this.items.splice(indexToRemove, 1)
					this.itemsById.delete(targetId)
				}
			} else {
				const removed = this.items.splice(index, 1)[0]
				if (removed) this.itemsById.delete(removed.id)
			}
		} else {
			// UPDATE
			if (targetId) {
				const item = this.itemsById.get(targetId)
				if (item) item.value = newValue
			} else if (this.items[index]) {
				this.items[index].value = newValue
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
	},
}
