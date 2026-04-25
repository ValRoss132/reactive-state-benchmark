export type MetricResult = {
	updateTime: number // Scripting (ms)
	propagationTime: number // Reactivity/Computed (ms)
	renderTime: number // React Actual Duration (ms)
	memoryDelta: number // Heap change (bytes)
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

// Контракт адаптера (каждая библиотека должна его реализовать)
export type StateAdapter<TState, TPayload> = {
	name: string
	init: (initialData: TState) => void
	update: (payload: TPayload) => void
	// Компонент, который подписывается на данные
	Subscriber: React.FC<{ id: string }>
	// Чтение значения вне React (для замера стоимости распространения)
	peek: () => any
	dispose: () => void
}

// Описание сценария
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
	stateCore: BenchmarkStats // Анализ updateTime
	uiCoupled: BenchmarkStats // Анализ renderTime
	opsPerSec: number
}
