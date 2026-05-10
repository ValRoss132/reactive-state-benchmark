import type { ExperimentConfig, Scenario } from './types'

export const DEFAULT_OPERATION_MIX = {
	update: 70,
	add: 15,
	remove: 15,
}

export const normalizeOperationMix = (
	mix: ExperimentConfig['operationMix'],
): ExperimentConfig['operationMix'] => {
	const update = Math.max(0, Math.round(mix.update))
	const add = Math.max(0, Math.round(mix.add))
	const remove = Math.max(0, Math.round(mix.remove))
	const total = update + add + remove

	if (total === 0) return DEFAULT_OPERATION_MIX

	return { update, add, remove }
}

export const getScenarioInitialState = <S, P>(
	scenario: Scenario<S, P>,
	config: ExperimentConfig,
): S => {
	return scenario.createInitialState
		? scenario.createInitialState(config)
		: scenario.initialState
}

export const getVisibleSubscriberIds = <S extends { items: { id: string }[] }, P>(
	scenario: Scenario<S, P>,
	config: ExperimentConfig,
) => {
	const initialState = getScenarioInitialState(scenario, config)
	return initialState.items
		.slice(0, Math.min(config.subscriberCount, initialState.items.length))
		.map((item) => item.id)
}
