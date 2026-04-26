export type MetricResult = {
	updateTime: number
	propagationTime: number
	renderTime: number
	memoryDelta: number
}

export type WideState = {
	items: { id: string; value: number }[]
	version: number
}

export type BenchmarkPayload = {
	index: number
	newValue: number
	type?: 'UPDATE' | 'ADD' | 'REMOVE'
	id?: string
}

export type BenchmarkStats = {
	mean: number
	median: number
	p95: number
	p99: number
	max: number
	standardDeviation: number
	cv: number
}

export type StateAdapter<TState, TPayload> = {
	name: string
	init: (initialData: TState) => void
	update: (payload: TPayload) => void
	Subscriber: React.FC<{ id: string }>
	peek: () => any
	dispose: () => void
}

export type Scenario<TState, TPayload> = {
	name: string
	initialState: TState
	generatePayload: (iteration: number) => TPayload
	iterations: number
	warmupRuns: number
}

export type FullReport = {
	adapterName: string
	scenarioName: string
	stateCore: BenchmarkStats
	uiCoupled: BenchmarkStats
	opsPerSec: number
}

export type PerformanceMemory = {
	usedJSHeapSize: number
	totalJSHeapSize: number
	jsHeapSizeLimit: number
}

export type ExtendedPerformance = Performance & {
	memory?: PerformanceMemory
}
