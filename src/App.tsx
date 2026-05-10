import React, { useMemo, useRef, useState } from 'react'
import { BenchmarkEngine, DEFAULT_MEASUREMENT_RUNS } from './core/Engine'
import { ZustandAdapter } from './adapters/ZustandAdapter'
import { ReduxAdapter, ReduxProvider } from './adapters/ReduxAdapter'
import { WideUpdateScenario } from './scenarios/WideUpdate'
import { ProfilerWrapper } from './core/ProfilerWrapper'
import { MobXAdapter } from './adapters/MobXAdapter'
import { JotaiAdapter } from './adapters/JotaiAdapter'
import type {
	StateAdapter,
	BenchmarkRunSession,
	Scenario,
	ExperimentConfig,
	ProgressState,
	RunKind,
} from './core/types'
import { CRUDScenario } from './scenarios/CRUD'
import { AsyncScenario } from './scenarios/Async'
import { Header } from './components/Header'
import { ControlPanel } from './components/ControlPanel'
import { ReportView } from './components/ReportView'
import { MethodologyView } from './components/MethodologyView'
import { DocumentationView } from './components/DocumentationView'
import { getVisibleSubscriberIds } from './core/config'
import { captureEnvironmentInfo } from './core/environment'
import { clearRunHistory, loadRunHistory, saveRunHistory } from './core/history'
import { loadExperimentConfigPreset } from './core/presets'
import {
	appendResultToSession,
	createCompletedResult,
	createFailedResult,
	createRunSession,
	finalizeRunSession,
} from './core/sessions'

const SCENARIOS: Scenario<any, any>[] = [
	WideUpdateScenario,
	CRUDScenario,
	AsyncScenario,
]
const ADAPTERS: StateAdapter<any, any>[] = [
	ZustandAdapter,
	ReduxAdapter,
	MobXAdapter,
	JotaiAdapter,
]

const makeDefaultConfig = (): ExperimentConfig => ({
	...(() => {
		const preset = loadExperimentConfigPreset()
		return {
			...preset,
			measurementRuns: preset.measurementRuns || DEFAULT_MEASUREMENT_RUNS,
		}
	})(),
})

const waitForReact = () => new Promise((resolve) => requestAnimationFrame(resolve))
type AppTab = 'benchmarks' | 'methodology' | 'documentation'

export const App = () => {
	const [currentScenario, setCurrentScenario] = useState(SCENARIOS[0])
	const [currentAdapter, setCurrentAdapter] = useState<StateAdapter<any, any>>(
		ADAPTERS[0],
	)
	const [config, setConfig] = useState<ExperimentConfig>(makeDefaultConfig)
	const [activeTab, setActiveTab] = useState<AppTab>('benchmarks')
	const [isRunning, setIsRunning] = useState(false)
	const [progressState, setProgressState] = useState<ProgressState>({
		phase: 'idle',
		adapterName: currentAdapter.name,
		scenarioName: currentScenario.name,
		currentIteration: 0,
		totalIterations: config.iterations + config.warmupIterations,
		currentStep: 0,
		totalSteps: config.measurementRuns * (config.iterations + config.warmupIterations),
		progress: 0,
		elapsedMs: 0,
	})
	const [sessions, setSessions] = useState<BenchmarkRunSession[]>(loadRunHistory)
	const abortRef = useRef<AbortController | null>(null)
	const environment = useMemo(() => captureEnvironmentInfo(), [])
	const updateSessions = (
		updater: (sessions: BenchmarkRunSession[]) => BenchmarkRunSession[],
	) => {
		setSessions((previous) => {
			const next = updater(previous)
			saveRunHistory(next)
			return next
		})
	}

	const runMatrix = async (
		kind: RunKind,
		adaptersToRun: StateAdapter<any, any>[],
		scenariosToRun: Scenario<any, any>[],
	) => {
		const totalSteps =
			adaptersToRun.length *
			scenariosToRun.length *
			config.measurementRuns *
			(config.iterations + config.warmupIterations)
		let stepOffset = 0
		let activeSession = createRunSession({
			kind,
			adapters: adaptersToRun,
			scenarios: scenariosToRun,
			config,
			environment,
		})

		updateSessions((previous) => [activeSession, ...previous])
		setIsRunning(true)
		abortRef.current = new AbortController()

		try {
			for (const adapter of adaptersToRun) {
				for (const scenario of scenariosToRun) {
					if (abortRef.current.signal.aborted) {
						throw new DOMException('Benchmark aborted', 'AbortError')
					}
					setCurrentAdapter(adapter)
					setCurrentScenario(scenario)
					await waitForReact()

					try {
						const report = await BenchmarkEngine.runSingle(
							adapter,
							scenario,
							config,
							(progress) => setProgressState(progress),
							abortRef.current.signal,
							stepOffset,
							totalSteps,
						)
						activeSession = appendResultToSession(
							activeSession,
							createCompletedResult(activeSession.id, adapter, report),
						)
					} catch (error) {
						if (error instanceof DOMException && error.name === 'AbortError') {
							throw error
						}
						activeSession = appendResultToSession(
							activeSession,
							createFailedResult({
								sessionId: activeSession.id,
								adapter,
								scenario,
								error,
							}),
						)
					}
					updateSessions((previous) =>
						previous.map((session) =>
							session.id === activeSession.id ? activeSession : session,
						),
					)
					stepOffset +=
						config.measurementRuns * (config.iterations + config.warmupIterations)
				}
			}
			activeSession = finalizeRunSession(activeSession)
		} catch (error) {
			activeSession = finalizeRunSession(
				activeSession,
				error instanceof DOMException && error.name === 'AbortError'
					? 'cancelled'
					: 'failed',
			)
			setProgressState((previous) => ({
				...previous,
				phase:
					error instanceof DOMException && error.name === 'AbortError'
						? 'cancelled'
						: 'failed',
				message: error instanceof Error ? error.message : String(error),
			}))
		} finally {
			updateSessions((previous) =>
				previous.map((session) =>
					session.id === activeSession.id ? activeSession : session,
				),
			)
			setIsRunning(false)
			abortRef.current = null
		}
	}

	const subscribers = useMemo(() => {
		const ids = getVisibleSubscriberIds(currentScenario, config)
		return ids.map((id) => (
			<currentAdapter.Subscriber key={id} id={id} />
		))
	}, [currentAdapter, currentScenario, config])

	const renderWithProvider = (content: React.ReactNode) => {
		if (currentAdapter.name === 'Redux Toolkit') {
			return <ReduxProvider>{content}</ReduxProvider>
		}
		return content
	}

	return (
		<div style={pageStyle}>
			<Header scenarioName={currentScenario.name} />
			<nav style={tabBarStyle}>
				{[
					['benchmarks', 'Benchmarks'],
					['methodology', 'Методология'],
					['documentation', 'Документация'],
				].map(([id, label]) => (
					<button
						key={id}
						onClick={() => setActiveTab(id as AppTab)}
						style={{
							...tabButtonStyle,
							background: activeTab === id ? '#005bff' : '#e5e7eb',
							color: activeTab === id ? '#fff' : '#111827',
						}}
					>
						{label}
					</button>
				))}
			</nav>

			{activeTab === 'benchmarks' && (
				<>
					<ControlPanel
						adapters={ADAPTERS}
						scenarios={SCENARIOS}
						currentAdapter={currentAdapter}
						currentScenario={currentScenario}
						config={config}
						environment={environment}
						isRunning={isRunning}
						progressState={progressState}
						sessions={sessions}
						onConfigChange={setConfig}
						onAdapterChange={(name) => {
							const adapter = ADAPTERS.find((a) => a.name === name)
							if (adapter) setCurrentAdapter(adapter)
						}}
						onScenarioChange={(name) => {
							const scenario = SCENARIOS.find((s) => s.name === name)
							if (scenario) setCurrentScenario(scenario)
						}}
						onRunCurrent={() =>
							runMatrix('single', [currentAdapter], [currentScenario])
						}
						onRunScenario={() => runMatrix('scenario', ADAPTERS, [currentScenario])}
						onRunAdapter={() => runMatrix('adapter', [currentAdapter], SCENARIOS)}
						onRunAll={() => runMatrix('all', ADAPTERS, SCENARIOS)}
						onCancel={() => abortRef.current?.abort()}
						onReset={() => {
							clearRunHistory()
							setSessions([])
							setProgressState((previous) => ({
								...previous,
								phase: 'idle',
								currentIteration: 0,
								currentStep: 0,
								progress: 0,
								elapsedMs: 0,
								message: undefined,
							}))
						}}
					/>

					<div style={{ height: 0, overflow: 'hidden' }}>
						<ProfilerWrapper
							id='benchmark-root'
							onRender={(time) => BenchmarkEngine.recordRenderTime(time)}
						>
							{renderWithProvider(subscribers)}
						</ProfilerWrapper>
					</div>

					<ReportView sessions={sessions} />
				</>
			)}
			{activeTab === 'methodology' && <MethodologyView />}
			{activeTab === 'documentation' && <DocumentationView />}
		</div>
	)
}

const pageStyle: React.CSSProperties = {
	padding: '30px',
	maxWidth: '1280px',
	margin: '0 auto',
	fontFamily: 'Segoe UI, Roboto, sans-serif',
	color: '#2f3437',
}

const tabBarStyle: React.CSSProperties = {
	display: 'flex',
	gap: '8px',
	marginBottom: '18px',
}

const tabButtonStyle: React.CSSProperties = {
	padding: '9px 14px',
	border: 'none',
	borderRadius: '6px',
	fontWeight: 700,
	cursor: 'pointer',
}
