import React from 'react'

interface ReportCardProps {
	title: string
	subtitle: string
	children: React.ReactNode
}

export const ReportCard: React.FC<ReportCardProps> = ({
	title,
	subtitle,
	children,
}) => {
	return (
		<div style={reportCardStyle}>
			<h4 style={headerStyle}>{title}</h4>
			<p style={subHeaderStyle}>{subtitle}</p>
			{children}
		</div>
	)
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
