import React from 'react'
import type {
	StateAdapter,
	Scenario,
	ExperimentConfig,
	ProgressState,
	EnvironmentInfo,
	BenchmarkRunSession,
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
	sessions: BenchmarkRunSession[]
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
	if (value === undefined) return 'неизвестно'
	if (value < 1000) return `${Math.round(value)} ms`
	return `${(value / 1000).toFixed(1)} s`
}

const phaseLabels: Record<ProgressState['phase'], string> = {
	idle: 'ожидание',
	preparing: 'подготовка',
	warmup: 'прогрев',
	measuring: 'измерение',
	aggregating: 'агрегация',
	completed: 'завершено',
	failed: 'ошибка',
	cancelled: 'отменено',
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
	sessions,
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
	const confirmCancel = () => {
		if (window.confirm('Остановить текущую benchmark session?')) {
			onCancel()
		}
	}

	return (
		<div style={panelStyle}>
			<section style={sectionStyle}>
				<div style={sectionHeaderStyle}>
					<h3 style={headingStyle}>Что запускать</h3>
				</div>
				<div style={choiceGridStyle}>
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
				</div>
			</section>

			<section style={sectionStyle}>
				<div style={sectionHeaderStyle}>
					<h3 style={headingStyle}>Параметры нагрузки</h3>
				</div>
				<div style={gridStyle}>
					<label style={fieldStyle}>
						<span style={labelStyle}>Итерации</span>
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
						<span style={labelStyle}>Прогрев</span>
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
						<span style={labelStyle}>Повторы</span>
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
						<span style={labelStyle}>Начальный размер</span>
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
						<span style={labelStyle}>Подписчики</span>
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
						<span style={labelStyle}>Update, %</span>
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
						<span style={labelStyle}>Add, %</span>
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
						<span style={labelStyle}>Remove, %</span>
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
					Сумма CRUD mix: {mixTotal}. Remove генерируется только при непустом
					live-наборе; если удалять нечего, генератор выполняет Add.
				</div>
			</section>

			<section style={sectionStyle}>
				<div style={sectionHeaderStyle}>
					<h3 style={headingStyle}>Запуск</h3>
				</div>
				<div style={runButtonGridStyle}>
					<button disabled={isRunning} onClick={onRunCurrent} style={buttonStyle}>
						Запустить выбранное
					</button>
					<button disabled={isRunning} onClick={onRunScenario} style={buttonStyle}>
						Запустить сценарий
					</button>
					<button disabled={isRunning} onClick={onRunAdapter} style={buttonStyle}>
						Запустить адаптер
					</button>
					<button disabled={isRunning} onClick={onRunAll} style={primaryButtonStyle}>
						Запустить все
					</button>
				</div>
				<div style={dangerZoneStyle}>
					<div>
						<strong>Остановка запуска</strong>
						<p style={sectionTextStyle}>
							Отмена доступна только во время выполнения и требует подтверждения.
						</p>
					</div>
					<button
						disabled={!isRunning}
						onClick={confirmCancel}
						style={{
							...dangerButtonStyle,
							...(!isRunning ? disabledButtonStyle : null),
						}}
					>
						Остановить session
					</button>
				</div>
			</section>

			<section style={sectionStyle}>
				<div style={sectionHeaderStyle}>
					<h3 style={headingStyle}>Сброс и пресет</h3>
				</div>
				<div style={buttonRowStyle}>
					<button disabled={isRunning} onClick={onReset} style={mutedButtonStyle}>
						Сбросить историю
					</button>
					<button
						disabled={isRunning}
						onClick={() => saveExperimentConfigPreset(config)}
						style={mutedButtonStyle}
					>
						Сохранить пресет
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
						Очистить пресет
					</button>
				</div>
			</section>

			<section style={sectionStyle}>
				<h3 style={standaloneHeadingStyle}>Статус выполнения</h3>
				<div style={progressTrackStyle}>
					<div
						style={{
							...progressBarStyle,
							width: `${progressState.progress}%`,
						}}
					/>
				</div>
				<div style={statusGridStyle}>
					<span>Прогресс: {progressState.progress}%</span>
					<span>Фаза: {phaseLabels[progressState.phase]}</span>
					<span>Адаптер: {progressState.adapterName}</span>
					<span>Сценарий: {progressState.scenarioName}</span>
					<span>
						Итерация: {progressState.currentIteration}/
						{progressState.totalIterations}
					</span>
					<span>
						Run: {progressState.currentRun}/{progressState.totalRuns}
					</span>
					<span>Начальный размер: {config.initialSize}</span>
					<span>Подписчики: {config.subscriberCount}</span>
					<span>
						CRUD mix: {config.operationMix.update}/{config.operationMix.add}/
						{config.operationMix.remove}
					</span>
					<span>
						Шаг: {progressState.currentStep}/{progressState.totalSteps}
					</span>
					<span>Прошло: {formatMs(progressState.elapsedMs)}</span>
					<span>Осталось: {formatMs(progressState.estimatedRemainingMs)}</span>
				</div>
				{progressState.message && (
					<div style={errorStyle}>{progressState.message}</div>
				)}
			</section>

			<section style={sectionStyle}>
				<h3 style={standaloneHeadingStyle}>Среда выполнения</h3>
				<div style={environmentGridStyle}>
					<span>
						Браузер: {environment.browserName} {environment.browserVersion}
					</span>
					<span>ОС: {environment.os}</span>
					<span>Платформа: {environment.platform}</span>
					<span>Viewport: {environment.viewportSize}</span>
					<span>Экран: {environment.screenResolution}</span>
					<span>DPR: {environment.devicePixelRatio}</span>
					<span>Потоки CPU: {environment.hardwareConcurrency}</span>
					<span>Память: {environment.deviceMemory}</span>
					<span>React: {environment.reactVersion}</span>
					<span>Сборка: {environment.buildMode}</span>
					<span>
						Profiling: {environment.profilingEnabled ? 'включен' : 'выключен'}
					</span>
					<span>Commit: {environment.gitCommitHash}</span>
				</div>
				{!environment.profilingEnabled && (
					<div style={warningStyle}>
						Profiling-сборка выключена. UI-coupled метрики могут быть
						некорректны; используйте `pnpm benchmark:profile`.
					</div>
				)}
			</section>

			<section style={sectionStyle}>
				<h3 style={standaloneHeadingStyle}>Экспорт</h3>
				<div style={buttonRowStyle}>
					<button
						disabled={sessions.length === 0}
						onClick={() => exportReportsToJSON(sessions)}
						style={buttonStyle}
					>
						Экспорт JSON
					</button>
					<button
						disabled={sessions.length === 0}
						onClick={() => exportReportsToCSV(sessions)}
						style={buttonStyle}
					>
						Экспорт CSV
					</button>
					<button
						disabled={sessions.length === 0}
						onClick={() => copyMarkdownSummary(sessions)}
						style={buttonStyle}
					>
						Копировать Markdown-сводку
					</button>
				</div>
			</section>
		</div>
	)
}

const panelStyle: React.CSSProperties = {
	background: 'var(--panel-bg)',
	padding: '22px',
	borderRadius: '8px',
	border: '1px solid var(--border)',
	marginBottom: '32px',
}

const sectionStyle: React.CSSProperties = {
	background: 'var(--surface)',
	border: '1px solid var(--border)',
	borderRadius: '8px',
	padding: '20px',
	marginBottom: '18px',
}

const headingStyle: React.CSSProperties = {
	margin: 0,
	fontSize: '16px',
}

const standaloneHeadingStyle: React.CSSProperties = {
	...headingStyle,
	marginBottom: '16px',
}

const sectionHeaderStyle: React.CSSProperties = {
	display: 'flex',
	justifyContent: 'space-between',
	gap: '16px',
	alignItems: 'baseline',
	marginBottom: '12px',
}

const sectionTextStyle: React.CSSProperties = {
	margin: 0,
	fontSize: '12px',
	color: 'var(--subtle-text)',
}

const choiceGridStyle: React.CSSProperties = {
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
	gap: '16px',
}

const gridStyle: React.CSSProperties = {
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
	gap: '16px',
}

const fieldStyle: React.CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: '7px',
}

const labelStyle: React.CSSProperties = {
	fontSize: '12px',
	fontWeight: 700,
}

const inputStyle: React.CSSProperties = {
	padding: '10px',
	borderRadius: '4px',
	border: '1px solid var(--input-border)',
	background: 'var(--surface)',
	color: 'var(--text)',
	minWidth: 0,
}

const buttonRowStyle: React.CSSProperties = {
	display: 'flex',
	flexWrap: 'wrap',
	gap: '12px',
}

const runButtonGridStyle: React.CSSProperties = {
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
	gap: '12px',
}

const dangerZoneStyle: React.CSSProperties = {
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	gap: '16px',
	marginTop: '18px',
	padding: '14px',
	border: '1px solid var(--danger-border)',
	borderRadius: '8px',
	background: 'var(--danger-bg)',
}

const baseButtonStyle: React.CSSProperties = {
	padding: '11px 16px',
	border: 'none',
	borderRadius: '6px',
	color: '#fff',
	fontWeight: 700,
	cursor: 'pointer',
}

const buttonStyle: React.CSSProperties = {
	...baseButtonStyle,
	backgroundColor: 'var(--button-bg)',
}

const primaryButtonStyle: React.CSSProperties = {
	...baseButtonStyle,
	backgroundColor: 'var(--accent-strong)',
}

const dangerButtonStyle: React.CSSProperties = {
	...baseButtonStyle,
	backgroundColor: '#b42318',
}

const mutedButtonStyle: React.CSSProperties = {
	...baseButtonStyle,
	backgroundColor: 'var(--muted-button-bg)',
}

const disabledButtonStyle: React.CSSProperties = {
	opacity: 0.48,
	cursor: 'not-allowed',
}

const progressTrackStyle: React.CSSProperties = {
	height: '12px',
	background: 'var(--progress-track)',
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
	gap: '12px',
	marginTop: '16px',
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
	background: 'var(--warning-bg)',
	border: '1px solid var(--warning-border)',
}

const errorStyle: React.CSSProperties = {
	...warningStyle,
	background: 'var(--error-bg)',
	border: '1px solid var(--error-border)',
}

const hintStyle: React.CSSProperties = {
	marginTop: '14px',
	fontSize: '12px',
	color: 'var(--muted-text)',
}
