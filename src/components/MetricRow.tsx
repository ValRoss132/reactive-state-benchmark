import React from 'react'

interface MetricRowProps {
	label: React.ReactNode
	value: React.ReactNode
	valueColor?: string
	isBordered?: boolean
}

export const MetricRow: React.FC<MetricRowProps> = ({
	label,
	value,
	valueColor,
	isBordered,
}) => {
	const borderStyle = isBordered
		? {
				borderTop: '1px solid #ddd',
				marginTop: '10px',
				paddingTop: '10px',
			}
		: {}

	return (
		<div style={{ ...metricRowStyle, ...borderStyle }}>
			<span>{label}</span>{' '}
			<b style={valueColor ? { color: valueColor } : {}}>{value}</b>
		</div>
	)
}

const metricRowStyle = {
	display: 'flex',
	justifyContent: 'space-between',
	marginBottom: '8px',
	fontSize: '14px',
}
