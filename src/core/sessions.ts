import type {
	BenchmarkResult,
	BenchmarkRunSession,
	BenchmarkSummary,
	EnvironmentInfo,
	ExperimentConfig,
	FullReport,
	RunKind,
	RunStatus,
	StateAdapter,
	Scenario,
} from './types'

const makeId = (prefix: string) =>
	`${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const getDurationMs = (startedAt: string, completedAt?: string) => {
	const end = completedAt ? new Date(completedAt).getTime() : Date.now()
	return Math.max(0, end - new Date(startedAt).getTime())
}

export const getRunTitle = (
	kind: RunKind,
	adapters: StateAdapter<any, any>[],
	scenarios: Scenario<any, any>[],
) => {
	if (kind === 'all') return 'All benchmarks'
	if (kind === 'adapter') return `${adapters[0]?.name ?? 'Adapter'} / all scenarios`
	if (kind === 'scenario') return `All adapters / ${scenarios[0]?.name ?? 'Scenario'}`
	return `${adapters[0]?.name ?? 'Adapter'} / ${scenarios[0]?.name ?? 'Scenario'}`
}

export const createRunSession = (input: {
	kind: RunKind
	adapters: StateAdapter<any, any>[]
	scenarios: Scenario<any, any>[]
	config: ExperimentConfig
	environment: EnvironmentInfo
}): BenchmarkRunSession => {
	const startedAt = new Date().toISOString()
	return {
		id: makeId('session'),
		kind: input.kind,
		title: getRunTitle(input.kind, input.adapters, input.scenarios),
		startedAt,
		status: 'running',
		config: structuredClone(input.config),
		environment: structuredClone(input.environment),
		results: [],
		summary: {
			totalResults: 0,
			successfulResults: 0,
			failedResults: 0,
			adaptersCount: input.adapters.length,
			scenariosCount: input.scenarios.length,
			durationMs: 0,
		},
	}
}

export const createCompletedResult = (
	sessionId: string,
	adapter: StateAdapter<any, any>,
	report: FullReport,
): BenchmarkResult => ({
	id: makeId('result'),
	sessionId,
	adapter: adapter.name,
	adapterId: adapter.metadata.id,
	adapterGroup: adapter.metadata.group,
	scenario: report.scenarioName,
	metrics: report,
	rawMeasurements: report.rawMeasurements ?? [],
	status: 'completed',
})

export const createFailedResult = (input: {
	sessionId: string
	adapter: StateAdapter<any, any>
	scenario: Scenario<any, any>
	error: unknown
}): BenchmarkResult => ({
	id: makeId('result'),
	sessionId: input.sessionId,
	adapter: input.adapter.name,
	adapterId: input.adapter.metadata.id,
	adapterGroup: input.adapter.metadata.group,
	scenario: input.scenario.name,
	rawMeasurements: [],
	status: 'failed',
	error: input.error instanceof Error ? input.error.message : String(input.error),
})

export const calculateSessionSummary = (
	session: BenchmarkRunSession,
): BenchmarkSummary => {
	const successfulResults = session.results.filter(
		(result) => result.status === 'completed',
	).length
	const failedResults = session.results.filter(
		(result) => result.status === 'failed',
	).length

	return {
		totalResults: session.results.length,
		successfulResults,
		failedResults,
		adaptersCount: session.summary.adaptersCount,
		scenariosCount: session.summary.scenariosCount,
		durationMs: getDurationMs(session.startedAt, session.completedAt),
	}
}

export const getSessionStatus = (
	session: BenchmarkRunSession,
	fallback: RunStatus = 'completed',
): RunStatus => {
	const summary = calculateSessionSummary(session)
	if (fallback === 'cancelled') return 'cancelled'
	if (summary.totalResults === 0) return 'failed'
	if (summary.failedResults === 0) return 'completed'
	if (summary.successfulResults === 0) return 'failed'
	return 'completed_with_errors'
}

export const finalizeRunSession = (
	session: BenchmarkRunSession,
	status?: RunStatus,
): BenchmarkRunSession => {
	const completedAt = new Date().toISOString()
	const nextSession = {
		...session,
		completedAt,
		status: status ?? getSessionStatus({ ...session, completedAt }),
	}
	return {
		...nextSession,
		summary: calculateSessionSummary(nextSession),
	}
}

export const appendResultToSession = (
	session: BenchmarkRunSession,
	result: BenchmarkResult,
): BenchmarkRunSession => {
	const nextSession = {
		...session,
		results: [...session.results, result],
	}
	return {
		...nextSession,
		summary: calculateSessionSummary(nextSession),
	}
}
