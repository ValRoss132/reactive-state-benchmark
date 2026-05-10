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
	min: number
	p95: number
	p99: number
	max: number
	standardDeviation: number
	cv: number
}

export type ExperimentConfig = {
	iterations: number
	warmupIterations: number
	measurementRuns: number
	seed: number
}

export type BenchmarkPhase =
	| 'idle'
	| 'preparing'
	| 'warmup'
	| 'measuring'
	| 'aggregating'
	| 'completed'
	| 'failed'
	| 'cancelled'

export type ProgressState = {
	phase: BenchmarkPhase
	adapterName: string
	scenarioName: string
	currentIteration: number
	totalIterations: number
	currentStep: number
	totalSteps: number
	progress: number
	elapsedMs: number
	estimatedRemainingMs?: number
	message?: string
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
	generatePayload: (iteration: number, seed: number) => TPayload
	iterations: number
	warmupRuns: number
}

export type EnvironmentInfo = {
	browserName: string
	browserVersion: string
	userAgent: string
	os: string
	platform: string
	timestamp: string
	timezone: string
	language: string
	screenResolution: string
	viewportSize: string
	devicePixelRatio: number
	webglVendor: string
	webglRenderer: string
	reactVersion: string
	libraryVersions: Record<string, string>
	buildMode: string
	profilingEnabled: boolean
	gitCommitHash: string
	appVersion: string
	deviceMemory?: number | 'unknown'
	hardwareConcurrency?: number | 'unknown'
}

export type BenchmarkRawMeasurement = {
	iteration: number
	updateTime: number
	renderTime: number
	phase: 'measuring'
}

export type ExportEnvelope = {
	metadata: {
		adapter: string
		scenario: string
		iterations: number
		warmupIterations: number
		measurementRuns: number
		seed: number
		timestamp: string
	}
	report: FullReport
}

export type RuntimeFlags = {
	profilingEnabled: boolean
	buildMode: string
	gitCommitHash: string
	appVersion: string
	libraryVersions: Record<string, string>
}

export type LegacyEnvironmentInfo = {
	screenResolution: string
	deviceMemory?: number
	hardwareConcurrency?: number
}

export type FullReport = {
	adapterName: string
	scenarioName: string
	config: ExperimentConfig
	stateCore: BenchmarkStats
	uiCoupled: BenchmarkStats
	opsPerSec: number
	totalTimeMs: number
	pureLoopTimeMs: number
	uiProfilerValid: boolean // Валидны ли UI-метрики (был ненулевой профилер)
	environment?: EnvironmentInfo // Информация об окружении запуска
	rawRuns?: Array<{
		stateTimePerOp: number
		renderTimePerOp: number
		throughput: number
	}> // Сырые данные по каждому прогону
	rawMeasurements?: BenchmarkRawMeasurement[]
}

export type PerformanceMemory = {
	usedJSHeapSize: number
	totalJSHeapSize: number
	jsHeapSizeLimit: number
}

export type ExtendedPerformance = Performance & {
	memory?: PerformanceMemory
}
