import React from 'react'
import type { FullReport, Scenario } from '../core/types'
import { exportToCSV } from '../utils/csvExport'
import { ReportCard } from './ReportCard'
import { MetricRow } from './MetricRow'

interface ReportViewProps {
	report: FullReport
	scenario: Scenario<any, any>
}

export const ReportView: React.FC<ReportViewProps> = ({ report, scenario }) => {
	return (
		<div style={{ animation: 'fadeIn 0.5s ease-in' }}>
			<h2 style={{ color: '#005bff' }}>
				Результаты анализа: {report.adapterName}
			</h2>

			{!report.uiProfilerValid && (
				<div
					style={{
						background: '#ffcccc',
						padding: '15px',
						borderRadius: '8px',
						marginBottom: '20px',
						border: '2px solid #d32f2f',
						fontSize: '14px',
					}}
				>
					<strong style={{ color: '#d32f2f' }}>
						⚠️ ОШИБКА: UI-метрики невалидны
					</strong>
					<br />
					Профилер React не был активирован. Проверьте режим сборки (необходима
					производственная сборка с REACT_PROFILING=true).
					<br />
					UI-coupled метрики в этом отчете недостоверны.
				</div>
			)}

			<div
				style={{
					display: 'grid',
					gridTemplateColumns: '1fr 1fr',
					gap: '20px',
					marginBottom: '20px',
				}}
			>
				<ReportCard
					title='Количественные критерии (state-core)'
					subtitle='Временные характеристики бизнес-логики (Scripting)'
				>
					<MetricRow
						label='Среднее время (Mean):'
						value={`${report.stateCore.mean.toFixed(4)} ms`}
					/>
					<MetricRow
						label='Медиана (Median):'
						value={`${report.stateCore.median.toFixed(4)} ms`}
					/>
					<MetricRow
						label={<b>Стабильность (P99):</b>}
						value={`${report.stateCore.p99.toFixed(4)} ms`}
					/>
					<MetricRow
						label='Вариация (CV):'
						value={`${report.stateCore.cv.toFixed(2)}%`}
						valueColor={report.stateCore.cv > 20 ? '#d32f2f' : '#2e7d32'}
					/>
					<MetricRow
						label='Пропускная способность:'
						value={`${report.opsPerSec.toFixed(0)} ops/s`}
						isBordered
					/>
				</ReportCard>

				<ReportCard
					title='Количественные критерии (ui-coupled)'
					subtitle='Затраты на рендеринг и фиксацию (Commit)'
				>
					<MetricRow
						label='Средний рендер (Mean):'
						value={`${report.uiCoupled.mean.toFixed(4)} ms`}
					/>
					<MetricRow
						label={<b>Хвостовая задержка (P95):</b>}
						value={`${report.uiCoupled.p95.toFixed(4)} ms`}
					/>
					<MetricRow
						label='Максимум (Max):'
						value={`${report.uiCoupled.max.toFixed(4)} ms`}
					/>
					<MetricRow
						label='Стабильность UI (CV):'
						value={`${report.uiCoupled.cv.toFixed(2)}%`}
					/>
				</ReportCard>
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
				При выбранной нагрузке ({scenario.iterations} итераций), подход{' '}
				{report.adapterName} демонстрирует
				{report.uiCoupled.p95 < 16
					? ' высокий уровень отзывчивости (P95 < 16ms)'
					: ' потенциальные риски деградации FPS (P95 > 16ms)'}
				. Коэффициент вариации в {report.stateCore.cv.toFixed(1)}% указывает на{' '}
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
						padding: '10px 25px',
						border: 'none',
						borderRadius: '6px',
						color: '#fff',
						fontWeight: 'bold',
						cursor: 'pointer',
						transition: 'all 0.2s',
						backgroundColor: '#2e7d32',
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
	)
}
