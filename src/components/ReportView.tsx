import React, { useMemo, useState } from 'react'
import type {
	AdapterGroup,
	BenchmarkResult,
	BenchmarkRunSession,
} from '../core/types'
import { exportReportsToCSV, exportReportsToJSON } from '../utils/exportResults'

interface ReportViewProps {
	sessions: BenchmarkRunSession[]
}

type ViewMode = 'grouped' | 'scenario' | 'flat'

const groupLabels: Record<AdapterGroup, string> = {
	'state-core': 'State-core',
	'ui-coupled': 'UI-coupled',
	other: 'Unknown / Other',
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
				<th style={thStyle}>Group</th>
				<th style={thStyle}>Adapter</th>
				<th style={thStyle}>Scenario</th>
				<th style={thStyle}>Status</th>
				<th style={thStyle}>Mean</th>
				<th style={thStyle}>Median</th>
				<th style={thStyle}>P95</th>
				<th style={thStyle}>P99</th>
				<th style={thStyle}>CV</th>
				<th style={thStyle}>Ops/s</th>
				<th style={thStyle}>Error</th>
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
						<td style={tdStyle}>{result.status}</td>
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
				<h2>Results</h2>
				<p>Run a benchmark to create a session history.</p>
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
					<span>Тип: {latest.kind}</span>
					<span>
						Состав: {latest.summary.adaptersCount} адаптера x{' '}
						{latest.summary.scenariosCount} сценария ={' '}
						{latest.summary.totalResults} результатов
					</span>
					<span>Успешно: {latest.summary.successfulResults}</span>
					<span>Ошибок: {latest.summary.failedResults}</span>
					<span>Статус: {latest.status}</span>
					<span>Длительность: {formatDuration(latest.summary.durationMs)}</span>
					<span>Время запуска: {new Date(latest.startedAt).toLocaleString()}</span>
				</div>
			</div>

			<div style={toolbarStyle}>
				<label>
					View:{' '}
					<select
						value={viewMode}
						onChange={(event) => setViewMode(event.target.value as ViewMode)}
						style={selectStyle}
					>
						<option value='grouped'>Grouped</option>
						<option value='scenario'>By scenario</option>
						<option value='flat'>Flat</option>
					</select>
				</label>
				<label>
					History:{' '}
					<select
						value={selectedSessionId}
						onChange={(event) => setSelectedSessionId(event.target.value)}
						style={selectStyle}
					>
						<option value='all'>All sessions</option>
						{sessions.map((session) => (
							<option key={session.id} value={session.id}>
								{session.title} · {new Date(session.startedAt).toLocaleString()}
							</option>
						))}
					</select>
				</label>
				<div style={adapterFilterStyle}>
					<span>Adapters:</span>
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
					Export selected CSV
				</button>
				<button
					onClick={() => exportReportsToJSON(selectedSessions)}
					style={buttonStyle}
				>
					Export selected JSON
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
								{session.status} · {session.summary.successfulResults}/
								{session.summary.totalResults} successful ·{' '}
								{formatDuration(session.summary.durationMs)}
							</span>
						</button>
						{expanded && (
							<div style={sessionBodyStyle}>
								<p style={captionStyle}>
									Session id: {session.id}. Processed results are shown separately
									for state-core scripting time and ui-coupled render/commit time.
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
	border: '1px dashed #cbd5e1',
	borderRadius: '8px',
}

const summaryStyle: React.CSSProperties = {
	background: '#eef6ff',
	border: '1px solid #bfdbfe',
	borderRadius: '8px',
	padding: '16px',
	marginBottom: '16px',
}

const summaryGridStyle: React.CSSProperties = {
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
	gap: '8px',
	fontSize: '14px',
}

const toolbarStyle: React.CSSProperties = {
	display: 'flex',
	flexWrap: 'wrap',
	gap: '12px',
	alignItems: 'center',
	marginBottom: '16px',
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
	border: '1px solid #cbd5e1',
	borderRadius: '4px',
}

const buttonStyle: React.CSSProperties = {
	padding: '8px 12px',
	border: 'none',
	borderRadius: '6px',
	background: '#475569',
	color: '#fff',
	fontWeight: 700,
	cursor: 'pointer',
}

const sessionStyle: React.CSSProperties = {
	border: '1px solid #e5e7eb',
	borderRadius: '8px',
	marginBottom: '12px',
	overflow: 'hidden',
}

const sessionHeaderStyle: React.CSSProperties = {
	width: '100%',
	display: 'flex',
	justifyContent: 'space-between',
	gap: '12px',
	padding: '12px 14px',
	border: 'none',
	background: '#f8fafc',
	cursor: 'pointer',
	fontWeight: 700,
	textAlign: 'left',
}

const sessionBodyStyle: React.CSSProperties = {
	padding: '14px',
}

const captionStyle: React.CSSProperties = {
	marginTop: 0,
	color: '#64748b',
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
	borderBottom: '1px solid #cbd5e1',
	background: '#f1f5f9',
}

const tdStyle: React.CSSProperties = {
	padding: '8px',
	borderBottom: '1px solid #e5e7eb',
	verticalAlign: 'top',
}
