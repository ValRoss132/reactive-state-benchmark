import { mobxAdapter } from '../state/mobx/benchmark'
import { recoilAdapter } from '../state/recoil/benchmark'
import { reduxAdapter } from '../state/redux/benchmark'
import { zustandAdapter } from '../state/zustand/benchmark'
import type { ManagerResult } from './types'

const adapters = [reduxAdapter, zustandAdapter, mobxAdapter, recoilAdapter]

export const DEFAULT_ITERATIONS = 10_000

export async function runBenchmark(
	iterations: number,
): Promise<ManagerResult[]> {
	const results: ManagerResult[] = []

	for (const adapter of adapters) {
		const result = adapter.run({ iterations })
		results.push(result)
		await new Promise((resolve) => {
			requestAnimationFrame(() => resolve(undefined))
		})
	}

	return results.toSorted((left, right) => left.elapsedMs - right.elapsedMs)
}
