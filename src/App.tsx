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
	FullReport,
	Scenario,
	ExperimentConfig,
	ProgressState,
} from './core/types'
import { CRUDScenario } from './scenarios/CRUD'
import { AsyncScenario } from './scenarios/Async'
import { Header } from './components/Header'
import { ControlPanel } from './components/ControlPanel'
import { ReportView } from './components/ReportView'
import { getVisibleSubscriberIds } from './core/config'
import { captureEnvironmentInfo } from './core/environment'
import { loadExperimentConfigPreset } from './core/presets'

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

export const App = () => {
	const [currentScenario, setCurrentScenario] = useState(SCENARIOS[0])
	const [currentAdapter, setCurrentAdapter] = useState<StateAdapter<any, any>>(
		ADAPTERS[0],
	)
	const [config, setConfig] = useState<ExperimentConfig>(makeDefaultConfig)
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
	const [reports, setReports] = useState<FullReport[]>([])
	const abortRef = useRef<AbortController | null>(null)
	const environment = useMemo(() => captureEnvironmentInfo(), [])

	const runMatrix = async (
		adaptersToRun: StateAdapter<any, any>[],
		scenariosToRun: Scenario<any, any>[],
	) => {
		const totalSteps =
			adaptersToRun.length *
			scenariosToRun.length *
			config.measurementRuns *
			(config.iterations + config.warmupIterations)
		let stepOffset = 0
		const nextReports: FullReport[] = []

		setReports([])
		setIsRunning(true)
		abortRef.current = new AbortController()

		try {
			for (const adapter of adaptersToRun) {
				for (const scenario of scenariosToRun) {
					setCurrentAdapter(adapter)
					setCurrentScenario(scenario)
					await waitForReact()

					const report = await BenchmarkEngine.runSingle(
						adapter,
						scenario,
						config,
						(progress) => setProgressState(progress),
						abortRef.current.signal,
						stepOffset,
						totalSteps,
					)
					stepOffset +=
						config.measurementRuns * (config.iterations + config.warmupIterations)
					nextReports.push(report)
					setReports([...nextReports])
				}
			}
		} catch (error) {
			setProgressState((previous) => ({
				...previous,
				phase:
					error instanceof DOMException && error.name === 'AbortError'
						? 'cancelled'
						: 'failed',
				message: error instanceof Error ? error.message : String(error),
			}))
		} finally {
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

			<ControlPanel
				adapters={ADAPTERS}
				scenarios={SCENARIOS}
				currentAdapter={currentAdapter}
				currentScenario={currentScenario}
				config={config}
				environment={environment}
				isRunning={isRunning}
				progressState={progressState}
				reports={reports}
				onConfigChange={setConfig}
				onAdapterChange={(name) => {
					const adapter = ADAPTERS.find((a) => a.name === name)
					if (adapter) setCurrentAdapter(adapter)
				}}
				onScenarioChange={(name) => {
					const scenario = SCENARIOS.find((s) => s.name === name)
					if (scenario) setCurrentScenario(scenario)
				}}
				onRunCurrent={() => runMatrix([currentAdapter], [currentScenario])}
				onRunScenario={() => runMatrix(ADAPTERS, [currentScenario])}
				onRunAdapter={() => runMatrix([currentAdapter], SCENARIOS)}
				onRunAll={() => runMatrix(ADAPTERS, SCENARIOS)}
				onCancel={() => abortRef.current?.abort()}
				onReset={() => {
					setReports([])
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

			{reports.length > 0 && (
				<ReportView
					reports={reports}
					report={reports[reports.length - 1]}
					scenario={currentScenario}
				/>
			)}
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
