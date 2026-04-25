import { makeAutoObservable } from 'mobx'
import { observer } from 'mobx-react-lite'
import type { StateAdapter } from '../core/types'
import type { WideState, WidePayload } from '../scenarios/WideUpdate'
import type React from 'react'

// 1. Создаем доменный стор
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

	updateItem(payload: WidePayload) {
		const item = this.items[payload.index]
		if (item) {
			item.value = payload.newValue
			this.version++
		}
	}
}

const mobxStore = new WideStore()

// 2. Оборачиваем компонент в observer — это магия MobX
const MobXSubscriber: React.FC<{ id: string }> = observer(({ id }) => {
	const item = mobxStore.items[Number(id)]
	const value = item?.value

	if (value === undefined) return null
	return <div data-perf-value={value} style={{ display: 'none' }} />
})

export const MobXAdapter: StateAdapter<WideState, WidePayload> = {
	name: 'MobX',

	init: (initialData) => {
		mobxStore.setInitialState(initialData)
	},

	update: (payload) => {
		mobxStore.updateItem(payload)
	},

	peek: () => mobxStore.items[0].value,

	Subscriber: MobXSubscriber,

	dispose: () => {
		mobxStore.items = []
	},
}
