import type { BenchmarkRunSession } from './types'

const HISTORY_KEY = 'reactive-bench:run-history'
const MAX_HISTORY_SESSIONS = 50

export const loadRunHistory = (): BenchmarkRunSession[] => {
	try {
		const raw = localStorage.getItem(HISTORY_KEY)
		if (!raw) return []
		const parsed = JSON.parse(raw)
		return Array.isArray(parsed) ? parsed : []
	} catch {
		return []
	}
}

export const saveRunHistory = (sessions: BenchmarkRunSession[]) => {
	localStorage.setItem(
		HISTORY_KEY,
		JSON.stringify(sessions.slice(0, MAX_HISTORY_SESSIONS)),
	)
}

export const clearRunHistory = () => {
	localStorage.removeItem(HISTORY_KEY)
}
