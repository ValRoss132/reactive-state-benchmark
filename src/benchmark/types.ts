export interface ManagerResult {
	manager: string
	elapsedMs: number
	operations: number
	opsPerSecond: number
	finalCounter: number
}

export interface BenchContext {
	iterations: number
}

export interface BenchmarkAdapter {
	manager: string
	run: (context: BenchContext) => ManagerResult
}

export function createResult(
	manager: string,
	elapsedMs: number,
	operations: number,
	finalCounter: number,
): ManagerResult {
	const safeElapsed = elapsedMs <= 0 ? 0.0001 : elapsedMs
	const opsPerSecond = (operations / safeElapsed) * 1000

	return {
		manager,
		elapsedMs,
		operations,
		opsPerSecond,
		finalCounter,
	}
}
