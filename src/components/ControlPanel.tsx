import React from 'react'
import type { StateAdapter, Scenario } from '../core/types'

interface ControlPanelProps {
	adapters: StateAdapter<any, any>[]
	scenarios: Scenario<any, any>[]
	currentAdapter: StateAdapter<any, any>
	currentScenario: Scenario<any, any>
	isRunning: boolean
	progress: number
	onAdapterChange: (adapterName: string) => void
	onScenarioChange: (scenarioName: string) => void
	onStart: () => void
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
	adapters,
	scenarios,
	currentAdapter,
	currentScenario,
	isRunning,
	progress,
	onAdapterChange,
	onScenarioChange,
	onStart,
}) => {
	return (
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
						onChange={(e) => onAdapterChange(e.target.value)}
						style={inputStyle}
					>
						{adapters.map((a) => (
							<option key={a.name} value={a.name}>
								{a.name}
							</option>
						))}
					</select>
					<select
						disabled={isRunning}
						value={currentScenario.name}
						onChange={(e) => onScenarioChange(e.target.value)}
						style={{ ...inputStyle, marginLeft: '10px' }}
					>
						{scenarios.map((s) => (
							<option key={s.name}>{s.name}</option>
						))}
					</select>
				</div>

				<button
					onClick={onStart}
					disabled={isRunning}
					style={{
						...buttonStyle,
						backgroundColor: isRunning ? '#ccc' : '#005bff',
					}}
				>
					{isRunning ? `Прогресс: ${progress}%` : 'Запустить эксперимент'}
				</button>
			</div>
		</div>
	)
}

const cardStyle: React.CSSProperties = {
	background: '#f8f9fa',
	padding: '20px',
	borderRadius: '12px',
	boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
	marginBottom: '30px',
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
