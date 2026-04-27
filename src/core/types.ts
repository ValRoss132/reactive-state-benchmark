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

type UpdatePayload = {
	type?: 'UPDATE'
	index: number
	targetId: string // Явно передаем id элемента для правильной адресации
	newValue: number
}

type AddPayload = {
	type: 'ADD'
	id: string
	newValue: number
}

type RemovePayload = {
	type: 'REMOVE'
	index: number
	targetId: string // Для корректности, хотя может не использоваться везде
	newValue: number
}

export type BenchmarkPayload = UpdatePayload | AddPayload | RemovePayload

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

export type EnvironmentInfo = {
	userAgent: string
	timestamp: string
	timezone: string
	language: string
	screenResolution: string
	deviceMemory?: number
	hardwareConcurrency?: number
}

export type FullReport = {
	adapterName: string
	scenarioName: string
	stateCore: BenchmarkStats
	uiCoupled: BenchmarkStats
	opsPerSec: number
	uiProfilerValid: boolean // Валидны ли UI-метрики (был ненулевой профилер)
	environment?: EnvironmentInfo // Информация об окружении запуска
	rawRuns?: Array<{
		stateTimePerOp: number
		renderTimePerOp: number
		throughput: number
	}> // Сырые данные по каждому прогону
}

export type PerformanceMemory = {
	usedJSHeapSize: number
	totalJSHeapSize: number
	jsHeapSizeLimit: number
}

export type ExtendedPerformance = Performance & {
	memory?: PerformanceMemory
}
