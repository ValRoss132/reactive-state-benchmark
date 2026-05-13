import React from 'react'

const scenarioItems = [
	['Wide Subscription', 'точечные обновления при широком графе подписчиков.'],
	['CRUD Homeostasis', 'структурные мутации коллекции: update, add и remove.'],
	['High-Frequency Async Stream', 'частые обновления случайных элементов.'],
]

const interpretationItems = [
	['mean', 'средний уровень затрат.'],
	['median', 'устойчивый к единичным выбросам центр выборки.'],
	['p95 и p99', 'хвостовые задержки измерений.'],
	['CV', 'стабильность серии относительно среднего значения.'],
]

export const MethodologyView: React.FC = () => (
	<div style={pageStyle}>
		<header style={headerStyle}>
			<h2 style={titleStyle}>Методология</h2>
			<p style={leadStyle}>
				Как стенд отделяет стоимость обновления состояния от стоимости
				распространения изменений в React UI.
			</p>
		</header>

		<section style={sectionStyle}>
			<h3 style={sectionTitleStyle}>Цель эксперимента</h3>
			<p style={paragraphStyle}>
				Reactive Bench сравнивает поведение адаптеров управления состоянием в
				одинаковых сценариях нагрузки. Методика следует идее из ВКР: сравнение
				выполняется не по разрозненным демонстрационным примерам, а по единому
				набору критериев в идентичной среде выполнения.
			</p>
			<p style={paragraphStyle}>
				Ядро стенда ничего не знает о внутреннем API библиотек и взаимодействует
				с Zustand, Redux Toolkit, MobX и Jotai через общий контракт адаптера.
			</p>
		</section>

		<section style={sectionStyle}>
			<h3 style={sectionTitleStyle}>Что сравнивается</h3>
			<div style={metricSplitStyle}>
				<div style={definitionStyle}>
					<strong>State-core</strong>
					<span>
						Scripting/update time: стоимость бизнес-логики, структур данных и
						механизма обновления адаптера.
					</span>
				</div>
				<div style={definitionStyle}>
					<strong>UI-coupled</strong>
					<span>
						Render/commit time: стоимость связи с React и графом подписок,
						зафиксированная React Profiler.
					</span>
				</div>
			</div>
		</section>

		<section style={sectionStyle}>
			<h3 style={sectionTitleStyle}>Сценарии и итерации</h3>
			<p style={paragraphStyle}>
				Сценарий задает начальное состояние и последовательность операций.
				Итерация — одна операция над состоянием. Прогревочные итерации
				выполняются до измерений и не попадают в итоговую статистику, чтобы
				снизить влияние JIT-компиляции, кешей и первичных инициализаций.
			</p>
			<div style={listGridStyle}>
				{scenarioItems.map(([name, description]) => (
					<div key={name} style={definitionStyle}>
						<strong>{name}</strong>
						<span>{description}</span>
					</div>
				))}
			</div>
		</section>

		<section style={sectionStyle}>
			<h3 style={sectionTitleStyle}>Seed и воспроизводимость</h3>
			<p style={paragraphStyle}>
				Seed управляет генерацией входных данных. Одинаковые seed, конфигурация,
				адаптер и сценарий дают одинаковую последовательность операций.
			</p>
			<p style={paragraphStyle}>
				Воспроизводимость обеспечивается четырьмя слоями: фиксированный seed,
				одинаковая конфигурация сценария, единый контракт адаптера и снимок среды
				выполнения. Снимок среды сохраняется вместе с результатами, чтобы
				можно было объяснить различия между устройствами и браузерами.
			</p>
		</section>

		<section style={sectionStyle}>
			<h3 style={sectionTitleStyle}>Статистическая обработка</h3>
			<p style={paragraphStyle}>
				Для каждой серии из <em>n</em> измеряемых runs формируется выборка
				значений <em>x</em>. Среднее считается как{' '}
				<code style={codeStyle}>mean = sum(x) / n</code>. Стандартное
				отклонение считается как{' '}
				<code style={codeStyle}>sqrt(sum((x - mean)^2) / n)</code>.
				Коэффициент вариации:{' '}
				<code style={codeStyle}>CV = standardDeviation / mean * 100%</code>.
				Пропускная способность:{' '}
				<code style={codeStyle}>
					opsPerSec = iterations / batchDurationMs * 1000
				</code>.
			</p>
			<p style={paragraphStyle}>
				Перцентили p95 и p99 рассчитываются по отсортированной выборке с
				линейной интерполяцией между соседними значениями. Для надежного анализа
				p99 рекомендуется использовать не менее 100 measurement runs; для p95
				обычно достаточно 30 и более.
			</p>
		</section>

		<section style={sectionStyle}>
			<h3 style={sectionTitleStyle}>Интерпретация</h3>
			<div style={listGridStyle}>
				{interpretationItems.map(([name, description]) => (
					<div key={name} style={definitionStyle}>
						<strong>{name}</strong>
						<span>{description}</span>
					</div>
				))}
			</div>
		</section>

		<section style={sectionStyle}>
			<h3 style={sectionTitleStyle}>Ограничения browser-based benchmark</h3>
			<p style={paragraphStyle}>
				Результаты зависят от браузера, устройства, энергорежима, фоновых
				процессов, активных вкладок, температуры CPU и состояния DevTools. Dev
				mode может искажать результаты; React Strict Mode может влиять на
				количество вызовов; активные DevTools, throttling и энергосберегающий
				режим могут заметно ухудшать стабильность.
			</p>
			<div style={warningStyle}>
				Для финальных измерений используйте production profiling build, закройте
				лишние вкладки и фоновые процессы, отключите throttling и не держите
				DevTools открытым во время запуска.
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

const paragraphStyle: React.CSSProperties = {
	margin: '0 0 12px',
}

const metricSplitStyle: React.CSSProperties = {
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
	gap: '12px',
}

const listGridStyle: React.CSSProperties = {
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
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

const codeStyle: React.CSSProperties = {
	background: 'var(--table-head)',
	border: '1px solid var(--border)',
	borderRadius: '4px',
	padding: '2px 5px',
}

const warningStyle: React.CSSProperties = {
	background: 'var(--warning-bg)',
	border: '1px solid var(--warning-border)',
	borderRadius: '8px',
	padding: '12px',
	marginTop: '12px',
}
