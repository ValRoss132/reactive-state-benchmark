import { makeAutoObservable } from 'mobx'
import { observer } from 'mobx-react-lite'
import type { StateAdapter } from '../core/types'
import type { BenchmarkPayload, WideState } from '../core/types'
import type React from 'react'

class WideStore {
	items: { id: string; value: number }[] = []
	version = 0

	constructor() {
		makeAutoObservable(this)
	}

	setInitialState(state: WideState) {
		this.items = state.items
		this.version = state.version
	}

	updateItem(payload: BenchmarkPayload) {
		const { type, index, newValue, id } = payload
		if (type === 'ADD') {
			this.items.push({ id: id!, value: newValue })
		} else if (type === 'REMOVE') {
			this.items.splice(index, 1)
		} else {
			if (this.items[index]) this.items[index].value = newValue
		}
	}
}

const mobxStore = new WideStore()

const MobXSubscriber: React.FC<{ id: string }> = observer(({ id }) => {
	const item = mobxStore.items[Number(id)]
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
	},
}
