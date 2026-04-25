import React, { Profiler } from 'react'
import type { ProfilerOnRenderCallback } from 'react'

type Props = {
	id: string
	onRender: (duration: number) => void
	children: React.ReactNode
}

// Этот компонент изолирует замер конкретного поддерева
export const ProfilerWrapper: React.FC<Props> = ({
	id,
	onRender,
	children,
}) => {
	const handleRender: ProfilerOnRenderCallback = (
		_id,
		_phase,
		actualDuration,
		_baseDuration,
		_startTime,
		_commitTime,
	) => {
		// actualDuration — время, потраченное на рендеринг самого компонента и его детей
		onRender(actualDuration)
	}

	return (
		<Profiler id={id} onRender={handleRender}>
			{children}
		</Profiler>
	)
}
