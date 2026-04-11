import { useMemo, useState } from 'react'
import { DEFAULT_ITERATIONS, runBenchmark } from './benchmark/runBenchmark'
import type { ManagerResult } from './benchmark/types'

function App() {
	const [iterations, setIterations] = useState(DEFAULT_ITERATIONS)
	const [results, setResults] = useState<ManagerResult[]>([])
	const [isRunning, setIsRunning] = useState(false)
	const [lastRunAt, setLastRunAt] = useState<string | null>(null)

	const winner = useMemo(() => {
		if (results.length === 0) {
			return null
		}

		return results[0]
	}, [results])

	const onRunBenchmark = async () => {
		setIsRunning(true)
		const benchResults = await runBenchmark(iterations)
		setResults(benchResults)
		setLastRunAt(new Date().toLocaleString())
		setIsRunning(false)
	}

	return (
		<main className='page'>
			<section className='hero'>
				<p className='hero-kicker'>Practical CI/CD Stand</p>
				<h1>Reactive State Benchmark</h1>
				<p className='hero-text'>
					Экспериментальная песочница для сравнения производительности мутаций
					состояния в Redux Toolkit, Zustand, MobX и Recoil.
				</p>
			</section>

			<section className='panel controls'>
				<label htmlFor='iterations' className='label'>
					Iterations per manager
				</label>
				<input
					id='iterations'
					className='input'
					type='number'
					min={100}
					step={100}
					value={iterations}
					onChange={(event) =>
						setIterations(Math.max(100, Number(event.target.value) || 100))
					}
					disabled={isRunning}
				/>
				<button
					className='button'
					type='button'
					onClick={onRunBenchmark}
					disabled={isRunning}
				>
					{isRunning ? 'Running benchmark...' : 'Run benchmark'}
				</button>
			</section>

			<section className='panel'>
				<h2>Results</h2>
				{results.length === 0 && (
					<p>Нажми кнопку запуска, чтобы получить данные для отчёта.</p>
				)}
				{results.length > 0 && (
					<>
						<table className='results-table'>
							<thead>
								<tr>
									<th>Manager</th>
									<th>Elapsed, ms</th>
									<th>Ops/s</th>
									<th>Final counter</th>
								</tr>
							</thead>
							<tbody>
								{results.map((result) => (
									<tr key={result.manager}>
										<td>{result.manager}</td>
										<td>{result.elapsedMs.toFixed(3)}</td>
										<td>{Math.round(result.opsPerSecond).toLocaleString()}</td>
										<td>{result.finalCounter}</td>
									</tr>
								))}
							</tbody>
						</table>
						<p className='meta'>
							{winner?.manager} показывает лучший результат на текущем запуске.
							{lastRunAt ? ` Last run: ${lastRunAt}.` : ''}
						</p>
					</>
				)}
			</section>
		</main>
	)
}

export default App
