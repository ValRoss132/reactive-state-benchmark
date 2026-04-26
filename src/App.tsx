import React, { useState, useMemo } from 'react'
import { BenchmarkEngine } from './core/Engine'
import { ZustandAdapter } from './adapters/ZustandAdapter'
import { ReduxAdapter, ReduxProvider } from './adapters/ReduxAdapter'
import { WideUpdateScenario } from './scenarios/WideUpdate'
import { ProfilerWrapper } from './core/ProfilerWrapper'
import { MobXAdapter } from './adapters/MobXAdapter'
import { JotaiAdapter } from './adapters/JotaiAdapter'
import { exportToCSV } from './utils/csvExport'
import type { StateAdapter, FullReport } from './core/types'

const ADAPTERS: StateAdapter<any, any>[] = [
	ZustandAdapter,
	ReduxAdapter,
	MobXAdapter,
	JotaiAdapter,
]

export const App = () => {
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
			WideUpdateScenario,
			(idx) => setProgress(idx),
		)

		setReport(finalReport)
		setIsRunning(false)
	}

	const subscribers = useMemo(() => {
		return WideUpdateScenario.initialState.items.map((item) => (
			<currentAdapter.Subscriber key={item.id} id={item.id} />
		))
	}, [currentAdapter])

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
			<header
				style={{ borderBottom: '2px solid #005bff', marginBottom: '30px' }}
			>
				<h1 style={{ marginBottom: '10px' }}>📊 Experimental Research Stand</h1>
				<p style={{ color: '#666' }}>
					Исследование реактивных парадигм: {WideUpdateScenario.name}
				</p>
			</header>

			{/* Control Panel */}
			<div style={cardStyle}>
				<h3 style={{ marginTop: 0 }}>Параметры эксперимента</h3>
				<div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
					<div>
						<label
							style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}
						>
							Целевой адаптер:
						</label>
						<select
							disabled={isRunning}
							value={currentAdapter.name}
							onChange={(e) => {
								const adapter = ADAPTERS.find((a) => a.name === e.target.value)
								if (adapter) setCurrentAdapter(adapter)
							}}
							style={inputStyle}
						>
							{ADAPTERS.map((a) => (
								<option key={a.name} value={a.name}>
									{a.name}
								</option>
							))}
						</select>
					</div>

					<button
						onClick={startBenchmark}
						disabled={isRunning}
						style={{
							...buttonStyle,
							backgroundColor: isRunning ? '#ccc' : '#005bff',
						}}
					>
						{isRunning
							? `Прогресс: ${progress} / ${WideUpdateScenario.iterations}`
							: 'Запустить эксперимент'}
					</button>
				</div>
			</div>

			{/* Контур UI (Profiler) */}
			<div style={{ height: 0, overflow: 'hidden' }}>
				<ProfilerWrapper
					id='benchmark-root'
					onRender={(time) => BenchmarkEngine.recordRenderTime(time)}
				>
					{renderWithProvider(subscribers)}
				</ProfilerWrapper>
			</div>

			{/* Отчет по критериям ВКР */}
			{report && (
				<div style={{ animation: 'fadeIn 0.5s ease-in' }}>
					<h2 style={{ color: '#005bff' }}>
						Результаты анализа: {report.adapterName}
					</h2>

					<div
						style={{
							display: 'grid',
							gridTemplateColumns: '1fr 1fr',
							gap: '20px',
							marginBottom: '20px',
						}}
					>
						{/* Группа 1: State-core */}
						<div style={reportCardStyle}>
							<h4 style={headerStyle}>Количественные критерии (state-core)</h4>
							<p style={subHeaderStyle}>
								Временные характеристики бизнес-логики (Scripting)
							</p>
							<div style={metricRowStyle}>
								<span>Среднее время (Mean):</span>{' '}
								<b>{report.stateCore.mean.toFixed(4)} ms</b>
							</div>
							<div style={metricRowStyle}>
								<span>Медиана (Median):</span>{' '}
								<b>{report.stateCore.median.toFixed(4)} ms</b>
							</div>
							<div style={metricRowStyle}>
								<span>
									<b>Стабильность (P99):</b>
								</span>{' '}
								<b>{report.stateCore.p99.toFixed(4)} ms</b>
							</div>
							<div style={metricRowStyle}>
								<span>Вариация (CV):</span>{' '}
								<b
									style={{
										color: report.stateCore.cv > 20 ? '#d32f2f' : '#2e7d32',
									}}
								>
									{report.stateCore.cv.toFixed(2)}%
								</b>
							</div>
							<div
								style={{
									...metricRowStyle,
									borderTop: '1px solid #ddd',
									marginTop: '10px',
									paddingTop: '10px',
								}}
							>
								<span>Пропускная способность:</span>{' '}
								<b>{report.opsPerSec.toFixed(0)} ops/s</b>
							</div>
						</div>

						{/* Группа 2: UI-coupled */}
						<div style={reportCardStyle}>
							<h4 style={headerStyle}>Количественные критерии (ui-coupled)</h4>
							<p style={subHeaderStyle}>
								Затраты на рендеринг и фиксацию (Commit)
							</p>
							<div style={metricRowStyle}>
								<span>Средний рендер (Mean):</span>{' '}
								<b>{report.uiCoupled.mean.toFixed(4)} ms</b>
							</div>
							<div style={metricRowStyle}>
								<span>
									<b>Хвостовая задержка (P95):</b>
								</span>{' '}
								<b>{report.uiCoupled.p95.toFixed(4)} ms</b>
							</div>
							<div style={metricRowStyle}>
								<span>Максимум (Max):</span>{' '}
								<b>{report.uiCoupled.max.toFixed(4)} ms</b>
							</div>
							<div style={metricRowStyle}>
								<span>Стабильность UI (CV):</span>{' '}
								<b>{report.uiCoupled.cv.toFixed(2)}%</b>
							</div>
						</div>
					</div>

					<div
						style={{
							background: '#e3f2fd',
							padding: '15px',
							borderRadius: '8px',
							fontSize: '14px',
							lineHeight: '1.6',
						}}
					>
						<strong>💡 Интерпретация для выводов ВКР:</strong>
						<br />
						При выбранной нагрузке ({WideUpdateScenario.iterations} итераций),
						подход {report.adapterName} демонстрирует
						{report.uiCoupled.p95 < 16
							? ' высокий уровень отзывчивости (P95 < 16ms)'
							: ' потенциальные риски деградации FPS (P95 > 16ms)'}
						. Коэффициент вариации в {report.stateCore.cv.toFixed(1)}% указывает
						на{' '}
						{report.stateCore.cv < 15 ? 'детерминированную' : 'стохастическую'}{' '}
						природу вычислительных затрат.
					</div>
					{/* Кнопка экспорта для ВКР */}
					<div
						style={{
							marginTop: '20px',
							display: 'flex',
							justifyContent: 'flex-end',
							borderTop: '1px dashed #ddd',
							paddingTop: '20px',
						}}
					>
						<button
							onClick={() => exportToCSV(report)}
							style={{
								...buttonStyle,
								backgroundColor: '#2e7d32', // Зеленый цвет для успешного действия
								marginTop: 0,
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
							}}
						>
							<span>💾</span> Экспортировать результаты (CSV)
						</button>
					</div>
				</div>
			)}
		</div>
	)
}

// Стили (в реальном проекте лучше CSS-modules, но для стенда сойдет inline)
const cardStyle: React.CSSProperties = {
	background: '#f8f9fa',
	padding: '20px',
	borderRadius: '12px',
	boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
	marginBottom: '30px',
}

const reportCardStyle: React.CSSProperties = {
	background: '#fff',
	padding: '20px',
	borderRadius: '12px',
	border: '1px solid #e0e0e0',
	boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
}

const headerStyle = { margin: '0 0 5px 0', color: '#005bff' }
const subHeaderStyle = {
	margin: '0 0 15px 0',
	fontSize: '12px',
	color: '#888',
	textTransform: 'uppercase' as const,
}
const metricRowStyle = {
	display: 'flex',
	justifyContent: 'space-between',
	marginBottom: '8px',
	fontSize: '14px',
}
const inputStyle = {
	padding: '8px',
	borderRadius: '4px',
	border: '1px solid #ccc',
	marginTop: '5px',
	width: '200px',
}
const buttonStyle = {
	padding: '10px 25px',
	border: 'none',
	borderRadius: '6px',
	color: '#fff',
	fontWeight: 'bold',
	cursor: 'pointer',
	transition: 'all 0.2s',
	marginTop: '18px',
}
