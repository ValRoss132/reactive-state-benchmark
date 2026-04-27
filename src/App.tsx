import React, { useState, useMemo } from 'react'
import { BenchmarkEngine } from './core/Engine'
import { ZustandAdapter } from './adapters/ZustandAdapter'
import { ReduxAdapter, ReduxProvider } from './adapters/ReduxAdapter'
import { WideUpdateScenario } from './scenarios/WideUpdate'
import { ProfilerWrapper } from './core/ProfilerWrapper'
import { MobXAdapter } from './adapters/MobXAdapter'
import { JotaiAdapter } from './adapters/JotaiAdapter'
import type { StateAdapter, FullReport, Scenario } from './core/types'
import { CRUDScenario } from './scenarios/CRUD'
import { AsyncScenario } from './scenarios/Async'
import { Header } from './components/Header'
import { ControlPanel } from './components/ControlPanel'
import { ReportView } from './components/ReportView'

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

export const App = () => {
	const [currentScenario, setCurrentScenario] = useState(SCENARIOS[0])
	const [currentAdapter, setCurrentAdapter] = useState<StateAdapter<any, any>>(
		ADAPTERS[0],
	)
	const [isRunning, setIsRunning] = useState(false)
	const [progress, setProgress] = useState(0)
	const [report, setReport] = useState<FullReport | null>(null)

	const startBenchmark = async () => {
		setReport(null)
		setIsRunning(true)

		// Теперь Engine возвращает не массив, а структурированный FullReport
		const finalReport = await BenchmarkEngine.runSingle(
			currentAdapter,
			currentScenario,
			(idx) => setProgress(idx),
		)

		setReport(finalReport)
		setIsRunning(false)
	}

	const subscribers = useMemo(() => {
		const items = (currentScenario.initialState as any).items as {
			id: string
		}[]
		return items.map((item) => (
			<currentAdapter.Subscriber key={item.id} id={item.id} />
		))
	}, [currentAdapter, currentScenario])

	const renderWithProvider = (content: React.ReactNode) => {
		if (currentAdapter.name === 'Redux Toolkit') {
			return <ReduxProvider>{content}</ReduxProvider>
		}
		return content
	}

	return (
		<div
			style={{
				padding: '30px',
				maxWidth: '1200px',
				margin: '0 auto',
				fontFamily: 'Segoe UI, Roboto, sans-serif',
				color: '#333',
			}}
		>
			<Header scenarioName={currentScenario.name} />

			<ControlPanel
				adapters={ADAPTERS}
				scenarios={SCENARIOS}
				currentAdapter={currentAdapter}
				currentScenario={currentScenario}
				isRunning={isRunning}
				progress={progress}
				onAdapterChange={(name) => {
					const adapter = ADAPTERS.find((a) => a.name === name)
					if (adapter) setCurrentAdapter(adapter)
				}}
				onScenarioChange={(name) => {
					const scenario = SCENARIOS.find((s) => s.name === name)
					if (scenario) setCurrentScenario(scenario)
				}}
				onStart={startBenchmark}
			/>

			{/* Контур UI (Profiler) */}
			<div style={{ height: 0, overflow: 'hidden' }}>
				<ProfilerWrapper
					id='benchmark-root'
					onRender={(time) => BenchmarkEngine.recordRenderTime(time)}
				>
					{renderWithProvider(subscribers)}
				</ProfilerWrapper>
			</div>

			{report && <ReportView report={report} scenario={currentScenario} />}
		</div>
	)
}
