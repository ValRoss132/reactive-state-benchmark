import React from 'react'

export const DocumentationView: React.FC = () => (
	<div style={docStyle}>
		<h2>Документация</h2>
		<h3>Параметры</h3>
		<table style={tableStyle}>
			<tbody>
				<tr><td style={tdStyle}><strong>iterations</strong></td><td style={tdStyle}>Количество операций, которые входят в один измеряемый батч. Чем больше значение, тем меньше влияние шума таймера на одну операцию.</td></tr>
				<tr><td style={tdStyle}><strong>warmupIterations</strong></td><td style={tdStyle}>Операции перед измерением. Они прогревают JIT, кеши и внутренние структуры библиотек, но не попадают в статистику.</td></tr>
				<tr><td style={tdStyle}><strong>measurementRuns</strong></td><td style={tdStyle}>Число повторов измеряемого батча. Это размер выборки для mean, median, p95, p99, standard deviation и CV.</td></tr>
				<tr><td style={tdStyle}><strong>seed</strong></td><td style={tdStyle}>Начальное значение генератора данных. Один seed при одинаковой конфигурации дает одинаковую последовательность операций.</td></tr>
				<tr><td style={tdStyle}><strong>initialSize</strong></td><td style={tdStyle}>Размер исходной коллекции состояния. Используется для проверки масштабируемости алгоритмов и подписок.</td></tr>
				<tr><td style={tdStyle}><strong>subscriberCount</strong></td><td style={tdStyle}>Количество скрытых React-подписчиков. Значение 0 акцентирует state-core, большие значения усиливают UI-coupled нагрузку.</td></tr>
				<tr><td style={tdStyle}><strong>operationMix</strong></td><td style={tdStyle}>Соотношение update/add/remove для CRUD-сценария. Remove не генерируется при пустом live-наборе.</td></tr>
				<tr><td style={tdStyle}><strong>adapter</strong></td><td style={tdStyle}>Реализация единого контракта state adapter для конкретной библиотеки.</td></tr>
				<tr><td style={tdStyle}><strong>scenario</strong></td><td style={tdStyle}>Модель нагрузки: широкие подписки, CRUD-мутации или высокочастотный поток обновлений.</td></tr>
				<tr><td style={tdStyle}><strong>adapter_group</strong></td><td style={tdStyle}>Группа строки результата: state-core для времени update logic или ui-coupled для React render/commit.</td></tr>
				<tr><td style={tdStyle}><strong>environment</strong></td><td style={tdStyle}>Снимок браузера, ОС, React, build mode, profiling flag, CPU threads, viewport и WebGL-информации.</td></tr>
				<tr><td style={tdStyle}><strong>raw measurements</strong></td><td style={tdStyle}>Сырые значения по каждому measurement run до агрегации.</td></tr>
				<tr><td style={tdStyle}><strong>processed results</strong></td><td style={tdStyle}>Агрегированные статистики, полученные из raw measurements.</td></tr>
			</tbody>
		</table>
		<h3>Метрики</h3>
		<ul>
			<li><strong>mean</strong> — среднее значение: sum(x) / n.</li>
			<li><strong>median</strong> — 50-й перцентиль, устойчивее к единичным выбросам, чем mean.</li>
			<li><strong>min</strong> и <strong>max</strong> — минимальное и максимальное значения выборки.</li>
			<li><strong>standard deviation</strong> — корень из средней квадратичной ошибки относительно mean.</li>
			<li><strong>CV</strong> — коэффициент вариации: standard deviation / mean * 100%. Чем ниже CV, тем стабильнее серия.</li>
			<li><strong>p95</strong>, <strong>p99</strong> — интерполированные хвостовые перцентили. При малом числе runs p99 близок к max, поэтому для анализа хвостов желательно повышать measurementRuns.</li>
			<li><strong>opsPerSec</strong> — пропускная способность: iterations / batchDurationMs * 1000.</li>
			<li><strong>sample count</strong> — число measurement runs, то есть размер выборки.</li>
			<li><strong>failed count</strong> — число упавших adapter × scenario results внутри session.</li>
			<li><strong>elapsed time</strong> — длительность session от startedAt до completedAt.</li>
		</ul>
		<h3>Действия</h3>
		<ul>
			<li><strong>Run selected</strong> — один адаптер на одном сценарии.</li>
			<li><strong>Run scenario</strong> — все адаптеры на выбранном сценарии.</li>
			<li><strong>Run adapter</strong> — выбранный адаптер на всех сценариях.</li>
			<li><strong>Run all benchmarks</strong> — все адаптеры на всех сценариях как одна session.</li>
			<li><strong>Cancel</strong> — отменить текущую session.</li>
			<li><strong>Reset</strong> — очистить историю sessions.</li>
			<li><strong>Export CSV</strong> — CSV с секциями processed/raw/environment.</li>
			<li><strong>Export JSON</strong> — полный снимок sessions с raw measurements.</li>
			<li><strong>History</strong> — выбор сохраненной session из localStorage и экспорт только выбранного запуска.</li>
		</ul>
	</div>
)

const docStyle: React.CSSProperties = {
	background: '#fff',
	border: '1px solid #e5e7eb',
	borderRadius: '8px',
	padding: '20px',
	lineHeight: 1.65,
}

const tableStyle: React.CSSProperties = {
	width: '100%',
	borderCollapse: 'collapse',
}

const tdStyle: React.CSSProperties = {
	borderBottom: '1px solid #e5e7eb',
	padding: '8px',
	verticalAlign: 'top',
}
