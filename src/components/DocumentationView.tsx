import React from 'react'

const parameterRows = [
	['iterations', 'Количество операций, которые входят в один измеряемый батч. Чем больше значение, тем меньше влияние шума таймера на одну операцию.'],
	['warmupIterations', 'Операции перед измерением. Они прогревают JIT, кеши и внутренние структуры библиотек, но не попадают в статистику.'],
	['measurementRuns', 'Число повторов измеряемого батча. Это размер выборки для mean, median, p95, p99, standard deviation и CV.'],
	['seed', 'Начальное значение генератора данных. Один seed при одинаковой конфигурации дает одинаковую последовательность операций.'],
	['initialSize', 'Размер исходной коллекции состояния. Используется для проверки масштабируемости алгоритмов и подписок.'],
	['subscriberCount', 'Количество скрытых React-подписчиков. Значение 0 акцентирует state-core, большие значения усиливают UI-coupled нагрузку.'],
	['operationMix', 'Соотношение update/add/remove для CRUD-сценария. Remove не генерируется при пустом live-наборе.'],
	['adapter', 'Реализация единого контракта state adapter для конкретной библиотеки.'],
	['scenario', 'Модель нагрузки: широкие подписки, CRUD-мутации или высокочастотный поток обновлений.'],
	['adapter_group', 'Группа строки результата: state-core для времени update logic или ui-coupled для React render/commit.'],
	['environment', 'Снимок браузера, ОС, React, build mode, profiling flag, CPU threads, viewport и WebGL-информации.'],
	['raw measurements', 'Сырые значения по каждому measurement run до агрегации.'],
	['processed results', 'Агрегированные статистики, полученные из raw measurements.'],
]

const metricItems = [
	['mean', 'среднее значение: sum(x) / n.'],
	['median', '50-й перцентиль, устойчивее к единичным выбросам, чем mean.'],
	['min и max', 'минимальное и максимальное значения выборки.'],
	['standard deviation', 'корень из средней квадратичной ошибки относительно mean.'],
	['CV', 'коэффициент вариации: standard deviation / mean * 100%. Чем ниже CV, тем стабильнее серия.'],
	['p95, p99', 'интерполированные хвостовые перцентили. При малом числе runs p99 близок к max, поэтому для анализа хвостов желательно повышать measurementRuns.'],
	['opsPerSec', 'пропускная способность: iterations / batchDurationMs * 1000.'],
	['sample count', 'число measurement runs, то есть размер выборки.'],
	['failed count', 'число упавших adapter x scenario results внутри session.'],
	['elapsed time', 'длительность session от startedAt до completedAt.'],
]

const actionItems = [
	['Запустить выбранное', 'один адаптер на одном сценарии.'],
	['Запустить сценарий', 'все адаптеры на выбранном сценарии.'],
	['Запустить адаптер', 'выбранный адаптер на всех сценариях.'],
	['Запустить все', 'все адаптеры на всех сценариях как одна session.'],
	['Остановить session', 'отменить текущую session после подтверждения.'],
	['Сбросить историю', 'очистить историю sessions.'],
	['Экспорт CSV', 'CSV с секциями processed/raw/environment.'],
	['Экспорт JSON', 'полный снимок sessions с raw measurements.'],
	['История', 'выбор сохраненной session из localStorage и экспорт только выбранного запуска.'],
]

const parameterImpactItems = [
	['Итерации', 'Увеличение обычно снижает шум времени на одну операцию и делает mean стабильнее, но каждый run длится дольше. Слишком малое значение может повышать CV из-за влияния таймера, GC и фоновых задач.'],
	['Прогрев', 'Больший прогрев уменьшает влияние JIT-компиляции и первичных инициализаций. После разумного порога эффект почти исчезает, а общее время запуска продолжает расти.'],
	['Повторы', 'Большее число runs делает median, p95, p99 и CV надежнее. Для p99 маленькая выборка особенно слаба: при 15 runs хвостовая оценка близка к максимуму и чувствительна к единичным выбросам.'],
	['Начальный размер', 'Рост initialSize увеличивает объем состояния и может повышать стоимость поиска, копирования массивов, создания индексов и structural updates. При фиксированном числе подписчиков он также снижает плотность попадания операций в подписанные элементы.'],
	['Подписчики', 'Рост subscriberCount обычно увеличивает UI-coupled нагрузку и стоимость уведомления подписок. Для fine-grained моделей эффект зависит от того, попадает ли операция в подписанный элемент.'],
	['CRUD mix', 'Большая доля Update проверяет точечные изменения. Add и Remove сильнее нагружают структуру коллекции, индексы и atom/store bookkeeping. Remove зависит от размера live-набора.'],
	['Seed', 'Seed не должен системно ускорять библиотеку, но меняет конкретную последовательность операций. Для спорных результатов стоит повторять несколько seed и сравнивать распределения.'],
]

export const DocumentationView: React.FC = () => (
	<div style={pageStyle}>
		<header style={headerStyle}>
			<h2 style={titleStyle}>Документация</h2>
			<p style={leadStyle}>
				Справочник по параметрам, метрикам и действиям стенда Reactive Bench.
			</p>
		</header>

		<section style={sectionStyle}>
			<h3 style={sectionTitleStyle}>Параметры</h3>
			<table style={tableStyle}>
				<tbody>
					{parameterRows.map(([name, description]) => (
						<tr key={name}>
							<td style={termCellStyle}>
								<code style={codeStyle}>{name}</code>
							</td>
							<td style={tdStyle}>{description}</td>
						</tr>
					))}
				</tbody>
			</table>
		</section>

		<section style={sectionStyle}>
			<h3 style={sectionTitleStyle}>Метрики</h3>
			<div style={listGridStyle}>
				{metricItems.map(([name, description]) => (
					<div key={name} style={definitionStyle}>
						<strong>{name}</strong>
						<span>{description}</span>
					</div>
				))}
			</div>
		</section>

		<section style={sectionStyle}>
			<h3 style={sectionTitleStyle}>Ожидаемое влияние параметров</h3>
			<div style={listGridStyle}>
				{parameterImpactItems.map(([name, description]) => (
					<div key={name} style={definitionStyle}>
						<strong>{name}</strong>
						<span>{description}</span>
					</div>
				))}
			</div>
		</section>

		<section style={sectionStyle}>
			<h3 style={sectionTitleStyle}>Действия</h3>
			<div style={listGridStyle}>
				{actionItems.map(([name, description]) => (
					<div key={name} style={definitionStyle}>
						<strong>{name}</strong>
						<span>{description}</span>
					</div>
				))}
			</div>
		</section>
	</div>
)

const pageStyle: React.CSSProperties = {
	background: 'var(--panel-bg)',
	border: '1px solid var(--border)',
	borderRadius: '8px',
	padding: '22px',
	lineHeight: 1.6,
}

const headerStyle: React.CSSProperties = {
	background: 'var(--surface)',
	border: '1px solid var(--border)',
	borderRadius: '8px',
	padding: '20px',
	marginBottom: '18px',
}

const titleStyle: React.CSSProperties = {
	margin: '0 0 6px',
	fontSize: '22px',
}

const leadStyle: React.CSSProperties = {
	margin: 0,
	color: 'var(--muted-text)',
}

const sectionStyle: React.CSSProperties = {
	background: 'var(--surface)',
	border: '1px solid var(--border)',
	borderRadius: '8px',
	padding: '20px',
	marginBottom: '18px',
}

const sectionTitleStyle: React.CSSProperties = {
	margin: '0 0 12px',
	fontSize: '16px',
}

const tableStyle: React.CSSProperties = {
	width: '100%',
	borderCollapse: 'collapse',
}

const tdStyle: React.CSSProperties = {
	borderTop: '1px solid var(--border-soft)',
	padding: '10px 8px',
	verticalAlign: 'top',
}

const termCellStyle: React.CSSProperties = {
	...tdStyle,
	width: '220px',
}

const codeStyle: React.CSSProperties = {
	background: 'var(--table-head)',
	border: '1px solid var(--border)',
	borderRadius: '4px',
	padding: '2px 5px',
}

const listGridStyle: React.CSSProperties = {
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
	gap: '12px',
}

const definitionStyle: React.CSSProperties = {
	display: 'grid',
	gap: '6px',
	padding: '12px',
	border: '1px solid var(--border-soft)',
	borderRadius: '6px',
	background: 'var(--surface-muted)',
}
