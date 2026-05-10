import React from 'react'
import type {
	StateAdapter,
	Scenario,
	ExperimentConfig,
	ProgressState,
	EnvironmentInfo,
	FullReport,
} from '../core/types'
import {
	exportReportsToCSV,
	exportReportsToJSON,
	copyMarkdownSummary,
} from '../utils/exportResults'
import {
	clearExperimentConfigPreset,
	DEFAULT_EXPERIMENT_CONFIG,
	normalizeExperimentConfig,
	saveExperimentConfigPreset,
} from '../core/presets'

interface ControlPanelProps {
	adapters: StateAdapter<any, any>[]
	scenarios: Scenario<any, any>[]
	currentAdapter: StateAdapter<any, any>
	currentScenario: Scenario<any, any>
	config: ExperimentConfig
	environment: EnvironmentInfo
	isRunning: boolean
	progressState: ProgressState
	reports: FullReport[]
	onConfigChange: (config: ExperimentConfig) => void
	onAdapterChange: (adapterName: string) => void
	onScenarioChange: (scenarioName: string) => void
	onRunCurrent: () => void
	onRunScenario: () => void
	onRunAdapter: () => void
	onRunAll: () => void
	onCancel: () => void
	onReset: () => void
}

const positiveInt = (value: string, fallback: number) => {
	const parsed = Number(value)
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

const nonNegativeInt = (value: string, fallback: number) => {
	const parsed = Number(value)
	return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback
}

const formatMs = (value?: number) => {
	if (value === undefined) return 'unknown'
	if (value < 1000) return `${Math.round(value)} ms`
	return `${(value / 1000).toFixed(1)} s`
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
	adapters,
	scenarios,
	currentAdapter,
	currentScenario,
	config,
	environment,
	isRunning,
	progressState,
	reports,
	onConfigChange,
	onAdapterChange,
	onScenarioChange,
	onRunCurrent,
	onRunScenario,
	onRunAdapter,
	onRunAll,
	onCancel,
	onReset,
}) => {
	const updateConfig = (patch: Partial<ExperimentConfig>) =>
		onConfigChange(normalizeExperimentConfig({ ...config, ...patch }))
	const updateOperationMix = (
		key: keyof ExperimentConfig['operationMix'],
		value: string,
	) =>
		updateConfig({
			operationMix: {
				...config.operationMix,
				[key]: nonNegativeInt(value, config.operationMix[key]),
			},
		})
	const mixTotal =
		config.operationMix.update + config.operationMix.add + config.operationMix.remove

	return (
		<div style={panelStyle}>
			<section style={sectionStyle}>
				<h3 style={headingStyle}>Параметры эксперимента</h3>
				<div style={gridStyle}>
					<label style={fieldStyle}>
						<span style={labelStyle}>Адаптер</span>
						<select
							disabled={isRunning}
							value={currentAdapter.name}
							onChange={(event) => onAdapterChange(event.target.value)}
							style={inputStyle}
						>
							{adapters.map((adapter) => (
								<option key={adapter.name} value={adapter.name}>
									{adapter.name}
								</option>
							))}
						</select>
					</label>
					<label style={fieldStyle}>
						<span style={labelStyle}>Сценарий</span>
						<select
							disabled={isRunning}
							value={currentScenario.name}
							onChange={(event) => onScenarioChange(event.target.value)}
							style={inputStyle}
						>
							{scenarios.map((scenario) => (
								<option key={scenario.name}>{scenario.name}</option>
							))}
						</select>
					</label>
					<label style={fieldStyle}>
						<span style={labelStyle}>Iterations</span>
						<input
							disabled={isRunning}
							type='number'
							min={1}
							value={config.iterations}
							onChange={(event) =>
								updateConfig({
									iterations: positiveInt(event.target.value, config.iterations),
								})
							}
							style={inputStyle}
						/>
					</label>
					<label style={fieldStyle}>
						<span style={labelStyle}>Warmup</span>
						<input
							disabled={isRunning}
							type='number'
							min={1}
							value={config.warmupIterations}
							onChange={(event) =>
								updateConfig({
									warmupIterations: positiveInt(
										event.target.value,
										config.warmupIterations,
									),
								})
							}
							style={inputStyle}
						/>
					</label>
					<label style={fieldStyle}>
						<span style={labelStyle}>Runs</span>
						<input
							disabled={isRunning}
							type='number'
							min={1}
							value={config.measurementRuns}
							onChange={(event) =>
								updateConfig({
									measurementRuns: positiveInt(
										event.target.value,
										config.measurementRuns,
									),
								})
							}
							style={inputStyle}
						/>
					</label>
					<label style={fieldStyle}>
						<span style={labelStyle}>Initial size</span>
						<input
							disabled={isRunning}
							type='number'
							min={1}
							value={config.initialSize}
							onChange={(event) =>
								updateConfig({
									initialSize: positiveInt(event.target.value, config.initialSize),
								})
							}
							style={inputStyle}
						/>
					</label>
					<label style={fieldStyle}>
						<span style={labelStyle}>Subscribers</span>
						<input
							disabled={isRunning}
							type='number'
							min={0}
							max={config.initialSize}
							value={config.subscriberCount}
							onChange={(event) =>
								updateConfig({
									subscriberCount: nonNegativeInt(
										event.target.value,
										config.subscriberCount,
									),
								})
							}
							style={inputStyle}
						/>
					</label>
					<label style={fieldStyle}>
						<span style={labelStyle}>Seed</span>
						<input
							disabled={isRunning}
							type='number'
							value={config.seed}
							onChange={(event) =>
								updateConfig({ seed: Number(event.target.value) || 0 })
							}
							style={inputStyle}
						/>
					</label>
					<label style={fieldStyle}>
						<span style={labelStyle}>Update %</span>
						<input
							disabled={isRunning}
							type='number'
							min={0}
							value={config.operationMix.update}
							onChange={(event) => updateOperationMix('update', event.target.value)}
							style={inputStyle}
						/>
					</label>
					<label style={fieldStyle}>
						<span style={labelStyle}>Add %</span>
						<input
							disabled={isRunning}
							type='number'
							min={0}
							value={config.operationMix.add}
							onChange={(event) => updateOperationMix('add', event.target.value)}
							style={inputStyle}
						/>
					</label>
					<label style={fieldStyle}>
						<span style={labelStyle}>Remove %</span>
						<input
							disabled={isRunning}
							type='number'
							min={0}
							value={config.operationMix.remove}
							onChange={(event) =>
								updateOperationMix('remove', event.target.value)
							}
							style={inputStyle}
						/>
					</label>
				</div>
				<div style={hintStyle}>
					Operation mix total: {mixTotal}. Remove operations are generated only
					when the CRUD live set is non-empty; otherwise the generator emits a
					safe add operation.
				</div>
				<div style={buttonRowStyle}>
					<button disabled={isRunning} onClick={onRunCurrent} style={buttonStyle}>
						Run selected
					</button>
					<button disabled={isRunning} onClick={onRunScenario} style={buttonStyle}>
						Run scenario
					</button>
					<button disabled={isRunning} onClick={onRunAdapter} style={buttonStyle}>
						Run adapter
					</button>
					<button disabled={isRunning} onClick={onRunAll} style={primaryButtonStyle}>
						Run all benchmarks
					</button>
					<button disabled={!isRunning} onClick={onCancel} style={dangerButtonStyle}>
						Cancel
					</button>
					<button disabled={isRunning} onClick={onReset} style={mutedButtonStyle}>
						Reset
					</button>
					<button
						disabled={isRunning}
						onClick={() => saveExperimentConfigPreset(config)}
						style={mutedButtonStyle}
					>
						Save preset
					</button>
					<button
						disabled={isRunning}
						onClick={() => {
							clearExperimentConfigPreset()
							onConfigChange({
								...DEFAULT_EXPERIMENT_CONFIG,
								seed: Date.now() % 1000000,
							})
						}}
						style={mutedButtonStyle}
					>
						Clear preset
					</button>
				</div>
			</section>

			<section style={sectionStyle}>
				<h3 style={headingStyle}>Статус выполнения</h3>
				<div style={progressTrackStyle}>
					<div
						style={{
							...progressBarStyle,
							width: `${progressState.progress}%`,
						}}
					/>
				</div>
				<div style={statusGridStyle}>
					<span>Progress: {progressState.progress}%</span>
					<span>Phase: {progressState.phase}</span>
					<span>Adapter: {progressState.adapterName}</span>
					<span>Scenario: {progressState.scenarioName}</span>
					<span>
						Iteration: {progressState.currentIteration}/
						{progressState.totalIterations}
					</span>
					<span>Runs: {config.measurementRuns}</span>
					<span>Initial size: {config.initialSize}</span>
					<span>Subscribers: {config.subscriberCount}</span>
					<span>
						CRUD mix: {config.operationMix.update}/{config.operationMix.add}/
						{config.operationMix.remove}
					</span>
					<span>
						Step: {progressState.currentStep}/{progressState.totalSteps}
					</span>
					<span>Elapsed: {formatMs(progressState.elapsedMs)}</span>
					<span>ETA: {formatMs(progressState.estimatedRemainingMs)}</span>
				</div>
				{progressState.message && (
					<div style={errorStyle}>{progressState.message}</div>
				)}
			</section>

			<section style={sectionStyle}>
				<h3 style={headingStyle}>Environment</h3>
				<div style={environmentGridStyle}>
					<span>
						Browser: {environment.browserName} {environment.browserVersion}
					</span>
					<span>OS: {environment.os}</span>
					<span>Platform: {environment.platform}</span>
					<span>Viewport: {environment.viewportSize}</span>
					<span>Screen: {environment.screenResolution}</span>
					<span>DPR: {environment.devicePixelRatio}</span>
					<span>CPU threads: {environment.hardwareConcurrency}</span>
					<span>Memory: {environment.deviceMemory}</span>
					<span>React: {environment.reactVersion}</span>
					<span>Build: {environment.buildMode}</span>
					<span>Profiling: {environment.profilingEnabled ? 'enabled' : 'disabled'}</span>
					<span>Commit: {environment.gitCommitHash}</span>
				</div>
				{!environment.profilingEnabled && (
					<div style={warningStyle}>
						Profiling build is disabled. UI-coupled metrics may be reported as
						invalid; use `pnpm benchmark:profile`.
					</div>
				)}
			</section>

			<section style={sectionStyle}>
				<h3 style={headingStyle}>Экспорт</h3>
				<div style={buttonRowStyle}>
					<button
						disabled={reports.length === 0}
						onClick={() => exportReportsToJSON(reports)}
						style={buttonStyle}
					>
						Export JSON
					</button>
					<button
						disabled={reports.length === 0}
						onClick={() => exportReportsToCSV(reports)}
						style={buttonStyle}
					>
						Export CSV
					</button>
					<button
						disabled={reports.length === 0}
						onClick={() => copyMarkdownSummary(reports)}
						style={buttonStyle}
					>
						Copy Markdown summary
					</button>
				</div>
			</section>
		</div>
	)
}

const panelStyle: React.CSSProperties = {
	background: '#f6f7f9',
	padding: '18px',
	borderRadius: '8px',
	border: '1px solid #dde1e6',
	marginBottom: '28px',
}

const sectionStyle: React.CSSProperties = {
	marginBottom: '18px',
}

const headingStyle: React.CSSProperties = {
	margin: '0 0 12px',
	fontSize: '16px',
}

const gridStyle: React.CSSProperties = {
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
	gap: '12px',
}

const fieldStyle: React.CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: '5px',
}

const labelStyle: React.CSSProperties = {
	fontSize: '12px',
	fontWeight: 700,
}

const inputStyle: React.CSSProperties = {
	padding: '8px',
	borderRadius: '4px',
	border: '1px solid #b8c0cc',
	minWidth: 0,
}

const buttonRowStyle: React.CSSProperties = {
	display: 'flex',
	flexWrap: 'wrap',
	gap: '10px',
	marginTop: '12px',
}

const baseButtonStyle: React.CSSProperties = {
	padding: '9px 14px',
	border: 'none',
	borderRadius: '6px',
	color: '#fff',
	fontWeight: 700,
	cursor: 'pointer',
}

const buttonStyle: React.CSSProperties = {
	...baseButtonStyle,
	backgroundColor: '#475569',
}

const primaryButtonStyle: React.CSSProperties = {
	...baseButtonStyle,
	backgroundColor: '#005bff',
}

const dangerButtonStyle: React.CSSProperties = {
	...baseButtonStyle,
	backgroundColor: '#b42318',
}

const mutedButtonStyle: React.CSSProperties = {
	...baseButtonStyle,
	backgroundColor: '#6b7280',
}

const progressTrackStyle: React.CSSProperties = {
	height: '12px',
	background: '#d8dee8',
	borderRadius: '999px',
	overflow: 'hidden',
}

const progressBarStyle: React.CSSProperties = {
	height: '100%',
	background: '#0f766e',
	transition: 'width 120ms ease-out',
}

const statusGridStyle: React.CSSProperties = {
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
	gap: '8px',
	marginTop: '12px',
	fontSize: '13px',
}

const environmentGridStyle: React.CSSProperties = {
	...statusGridStyle,
	marginTop: 0,
}

const warningStyle: React.CSSProperties = {
	marginTop: '12px',
	padding: '10px',
	borderRadius: '6px',
	background: '#fff4cc',
	border: '1px solid #eab308',
}

const errorStyle: React.CSSProperties = {
	...warningStyle,
	background: '#fee2e2',
	border: '1px solid #ef4444',
}

const hintStyle: React.CSSProperties = {
	marginTop: '10px',
	fontSize: '12px',
	color: '#475569',
}
