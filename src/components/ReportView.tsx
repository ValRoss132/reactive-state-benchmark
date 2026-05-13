import React, { useMemo, useState } from 'react'
import type {
	AdapterGroup,
	BenchmarkResult,
	BenchmarkRunSession,
	RunKind,
	RunStatus,
} from '../core/types'
import { exportReportsToCSV, exportReportsToJSON } from '../utils/exportResults'

interface ReportViewProps {
	sessions: BenchmarkRunSession[]
}

type ViewMode = 'grouped' | 'scenario' | 'flat'

const groupLabels: Record<AdapterGroup, string> = {
	'state-core': 'State-core',
	'ui-coupled': 'UI-coupled',
	other: 'Неизвестно / другое',
}

const kindLabels: Record<RunKind, string> = {
	single: 'один запуск',
	scenario: 'сценарий',
	adapter: 'адаптер',
	all: 'вся матрица',
}

const formatMs = (value?: number) =>
	typeof value === 'number' ? value.toFixed(4) : 'n/a'

const formatDuration = (value: number) => {
	const seconds = Math.round(value / 1000)
	const minutes = Math.floor(seconds / 60)
	const rest = seconds % 60
	return `${minutes.toString().padStart(2, '0')}:${rest
		.toString()
		.padStart(2, '0')}`
}

const statusLabels: Record<RunStatus | BenchmarkResult['status'], string> = {
	running: 'выполняется',
	completed: 'завершено',
	completed_with_errors: 'завершено с ошибками',
	failed: 'ошибка',
	cancelled: 'отменено',
}

const statusColors: Record<RunStatus | BenchmarkResult['status'], React.CSSProperties> = {
	running: {
		background: '#e0f2fe',
		borderColor: '#38bdf8',
		color: '#075985',
	},
	completed: {
		background: '#dcfce7',
		borderColor: '#22c55e',
		color: '#166534',
	},
	completed_with_errors: {
		background: '#fef3c7',
		borderColor: '#f59e0b',
		color: '#92400e',
	},
	failed: {
		background: '#fee2e2',
		borderColor: '#ef4444',
		color: '#991b1b',
	},
	cancelled: {
		background: '#fee2e2',
		borderColor: '#f87171',
		color: '#991b1b',
	},
}

const StatusBadge = ({ status }: { status: RunStatus | BenchmarkResult['status'] }) => (
	<span style={{ ...statusBadgeStyle, ...statusColors[status] }}>
		{statusLabels[status]}
	</span>
)

const sortResults = (results: BenchmarkResult[]) =>
	[...results].sort(
		(a, b) =>
			a.adapterGroup.localeCompare(b.adapterGroup) ||
			a.scenario.localeCompare(b.scenario) ||
			a.adapter.localeCompare(b.adapter),
	)

const ResultTable = ({
	results,
	metricGroup,
}: {
	results: BenchmarkResult[]
	metricGroup?: AdapterGroup
}) => (
	<table style={tableStyle}>
		<thead>
			<tr>
				<th style={thStyle}>Группа</th>
				<th style={thStyle}>Адаптер</th>
				<th style={thStyle}>Сценарий</th>
				<th style={thStyle}>Статус</th>
				<th style={thStyle}>Среднее</th>
				<th style={thStyle}>Медиана</th>
				<th style={thStyle}>P95</th>
				<th style={thStyle}>P99</th>
				<th style={thStyle}>CV</th>
				<th style={thStyle}>Ops/s</th>
				<th style={thStyle}>Ошибка</th>
			</tr>
		</thead>
		<tbody>
			{sortResults(results).map((result) => {
				const stats =
					metricGroup === 'ui-coupled'
						? result.metrics?.uiCoupled
						: result.metrics?.stateCore
				return (
					<tr key={`${result.id}-${metricGroup ?? 'flat'}`}>
						<td style={tdStyle}>{metricGroup ? groupLabels[metricGroup] : groupLabels[result.adapterGroup]}</td>
						<td style={tdStyle}>{result.adapter}</td>
						<td style={tdStyle}>{result.scenario}</td>
						<td style={tdStyle}><StatusBadge status={result.status} /></td>
						<td style={tdStyle}>{formatMs(stats?.mean)}</td>
						<td style={tdStyle}>{formatMs(stats?.median)}</td>
						<td style={tdStyle}>{formatMs(stats?.p95)}</td>
						<td style={tdStyle}>{formatMs(stats?.p99)}</td>
						<td style={tdStyle}>
							{typeof stats?.cv === 'number' ? `${stats.cv.toFixed(2)}%` : 'n/a'}
						</td>
						<td style={tdStyle}>
							{typeof result.metrics?.opsPerSec === 'number'
								? result.metrics.opsPerSec.toFixed(0)
								: 'n/a'}
						</td>
						<td style={tdStyle}>{result.error ?? ''}</td>
					</tr>
				)
			})}
		</tbody>
	</table>
)

const ScenarioTable = ({ results }: { results: BenchmarkResult[] }) => {
	const scenarios = [...new Set(results.map((result) => result.scenario))].sort()
	return (
		<>
			{scenarios.map((scenario) => (
				<div key={scenario} style={subBlockStyle}>
					<h4 style={subHeadingStyle}>{scenario}</h4>
					<ResultTable
						results={results.filter((result) => result.scenario === scenario)}
						metricGroup='state-core'
					/>
					<ResultTable
						results={results.filter((result) => result.scenario === scenario)}
						metricGroup='ui-coupled'
					/>
				</div>
			))}
		</>
	)
}

export const ReportView: React.FC<ReportViewProps> = ({ sessions }) => {
	const [collapsedSessions, setCollapsedSessions] = useState<Set<string>>(
		() => new Set(),
	)
	const [viewMode, setViewMode] = useState<ViewMode>('grouped')
	const [selectedSessionId, setSelectedSessionId] = useState<string>('all')
	const [selectedAdapters, setSelectedAdapters] = useState<Set<string>>(
		() => new Set(),
	)

	const allAdapters = useMemo(
		() =>
			[
				...new Set(
					sessions.flatMap((session) =>
						session.results.map((result) => result.adapter),
					),
				),
			].sort(),
		[sessions],
	)

	const selectedSessions = useMemo(
		() =>
			selectedSessionId === 'all'
				? sessions
				: sessions.filter((session) => session.id === selectedSessionId),
		[sessions, selectedSessionId],
	)

	const visibleSessions = useMemo(
		() =>
			selectedSessions.map((session) => ({
				...session,
				results:
					selectedAdapters.size === 0
						? session.results
						: session.results.filter((result) =>
								selectedAdapters.has(result.adapter),
							),
			})),
		[selectedSessions, selectedAdapters],
	)

	if (sessions.length === 0) {
		return (
			<div style={emptyStyle}>
				<h2>Результаты</h2>
				<p>Запустите benchmark, чтобы создать историю session.</p>
			</div>
		)
	}

	const latest = sessions[0]

	return (
		<div style={{ animation: 'fadeIn 0.5s ease-in' }}>
			<div style={summaryStyle}>
				<h2 style={{ marginTop: 0 }}>Сводка запусков</h2>
				<div style={summaryGridStyle}>
					<span>Всего сессий: {sessions.length}</span>
					<span>Последний запуск: {latest.title}</span>
					<span>Тип: {kindLabels[latest.kind]}</span>
					<span>
						Состав: {latest.summary.adaptersCount} адаптеров x{' '}
						{latest.summary.scenariosCount} сценариев ={' '}
						{latest.summary.totalResults} результатов
					</span>
					<span>Успешно: {latest.summary.successfulResults}</span>
					<span>Ошибок: {latest.summary.failedResults}</span>
					<span>
						Статус: <StatusBadge status={latest.status} />
					</span>
					<span>Длительность: {formatDuration(latest.summary.durationMs)}</span>
					<span>Время запуска: {new Date(latest.startedAt).toLocaleString()}</span>
				</div>
			</div>

			<div style={toolbarStyle}>
				<label>
					Вид:{' '}
					<select
						value={viewMode}
						onChange={(event) => setViewMode(event.target.value as ViewMode)}
						style={selectStyle}
					>
						<option value='grouped'>По группам</option>
						<option value='scenario'>По сценариям</option>
						<option value='flat'>Таблица</option>
					</select>
				</label>
				<label>
					История:{' '}
					<select
						value={selectedSessionId}
						onChange={(event) => setSelectedSessionId(event.target.value)}
						style={selectStyle}
					>
						<option value='all'>Все session</option>
						{sessions.map((session) => (
							<option key={session.id} value={session.id}>
								{session.title} · {new Date(session.startedAt).toLocaleString()}
							</option>
						))}
					</select>
				</label>
				<div style={adapterFilterStyle}>
					<span>Адаптеры:</span>
					{allAdapters.map((adapter) => (
						<label key={adapter} style={checkboxLabelStyle}>
							<input
								type='checkbox'
								checked={
									selectedAdapters.size === 0 || selectedAdapters.has(adapter)
								}
								onChange={() => {
									setSelectedAdapters((previous) => {
										const next = new Set(previous)
										if (next.size === 0) {
											allAdapters.forEach((item) => next.add(item))
										}
										if (next.has(adapter)) next.delete(adapter)
										else next.add(adapter)
										return next.size === allAdapters.length ? new Set() : next
									})
								}}
							/>
							{adapter}
						</label>
					))}
				</div>
				<button
					onClick={() => exportReportsToCSV(selectedSessions)}
					style={buttonStyle}
				>
					Экспорт выбранного CSV
				</button>
				<button
					onClick={() => exportReportsToJSON(selectedSessions)}
					style={buttonStyle}
				>
					Экспорт выбранного JSON
				</button>
			</div>

			{visibleSessions.map((session) => {
				const expanded = !collapsedSessions.has(session.id)
				return (
					<section key={session.id} style={sessionStyle}>
						<button
							style={sessionHeaderStyle}
							onClick={() =>
								setCollapsedSessions((previous) => {
									const next = new Set(previous)
									if (next.has(session.id)) next.delete(session.id)
									else next.add(session.id)
									return next
								})
							}
						>
							<span>{expanded ? '▼' : '▶'} {session.title}</span>
							<span>
								<StatusBadge status={session.status} /> ·{' '}
								{session.summary.successfulResults}/
								{session.summary.totalResults} успешно ·{' '}
								{formatDuration(session.summary.durationMs)}
							</span>
						</button>
						{expanded && (
							<div style={sessionBodyStyle}>
								<p style={captionStyle}>
									Session id: {session.id}. Результаты разделены на state-core
									scripting time и ui-coupled render/commit time.
								</p>
								{viewMode === 'scenario' ? (
									<ScenarioTable results={session.results} />
								) : viewMode === 'flat' ? (
									<ResultTable results={session.results} />
								) : (
									<>
										<h3 style={groupHeadingStyle}>State-core</h3>
										<ResultTable results={session.results} metricGroup='state-core' />
										<h3 style={groupHeadingStyle}>UI-coupled</h3>
										<ResultTable results={session.results} metricGroup='ui-coupled' />
									</>
								)}
							</div>
						)}
					</section>
				)
			})}
		</div>
	)
}

const emptyStyle: React.CSSProperties = {
	padding: '20px',
	border: '1px dashed var(--border)',
	borderRadius: '8px',
	background: 'var(--surface)',
}

const summaryStyle: React.CSSProperties = {
	background: 'var(--summary-bg)',
	border: '1px solid var(--summary-border)',
	borderRadius: '8px',
	padding: '20px',
	marginBottom: '18px',
}

const summaryGridStyle: React.CSSProperties = {
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
	gap: '12px',
	fontSize: '14px',
}

const toolbarStyle: React.CSSProperties = {
	display: 'flex',
	flexWrap: 'wrap',
	gap: '14px',
	alignItems: 'center',
	marginBottom: '18px',
}

const adapterFilterStyle: React.CSSProperties = {
	display: 'flex',
	flexWrap: 'wrap',
	gap: '8px',
	alignItems: 'center',
}

const checkboxLabelStyle: React.CSSProperties = {
	display: 'flex',
	gap: '4px',
	alignItems: 'center',
	fontSize: '13px',
}

const selectStyle: React.CSSProperties = {
	padding: '6px',
	border: '1px solid var(--input-border)',
	borderRadius: '4px',
	background: 'var(--surface)',
	color: 'var(--text)',
}

const buttonStyle: React.CSSProperties = {
	padding: '8px 12px',
	border: 'none',
	borderRadius: '6px',
	background: 'var(--button-bg)',
	color: '#fff',
	fontWeight: 700,
	cursor: 'pointer',
}

const sessionStyle: React.CSSProperties = {
	border: '1px solid var(--border)',
	borderRadius: '8px',
	marginBottom: '16px',
	overflow: 'hidden',
	background: 'var(--surface)',
}

const sessionHeaderStyle: React.CSSProperties = {
	width: '100%',
	display: 'flex',
	justifyContent: 'space-between',
	gap: '16px',
	padding: '14px 16px',
	border: 'none',
	background: 'var(--surface-muted)',
	color: 'var(--text)',
	cursor: 'pointer',
	fontWeight: 700,
	textAlign: 'left',
}

const sessionBodyStyle: React.CSSProperties = {
	padding: '18px',
}

const statusBadgeStyle: React.CSSProperties = {
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	padding: '3px 8px',
	border: '1px solid',
	borderRadius: '999px',
	fontSize: '12px',
	fontWeight: 700,
	whiteSpace: 'nowrap',
}

const captionStyle: React.CSSProperties = {
	marginTop: 0,
	color: 'var(--subtle-text)',
	fontSize: '13px',
}

const groupHeadingStyle: React.CSSProperties = {
	margin: '18px 0 8px',
	fontSize: '16px',
}

const subBlockStyle: React.CSSProperties = {
	marginBottom: '18px',
}

const subHeadingStyle: React.CSSProperties = {
	margin: '8px 0',
}

const tableStyle: React.CSSProperties = {
	width: '100%',
	borderCollapse: 'collapse',
	fontSize: '13px',
	marginBottom: '12px',
}

const thStyle: React.CSSProperties = {
	textAlign: 'left',
	padding: '8px',
	borderBottom: '1px solid var(--border)',
	background: 'var(--table-head)',
}

const tdStyle: React.CSSProperties = {
	padding: '8px',
	borderBottom: '1px solid var(--border-soft)',
	verticalAlign: 'top',
}
