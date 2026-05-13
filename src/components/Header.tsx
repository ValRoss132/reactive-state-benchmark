export const Header = ({ scenarioName }: { scenarioName: string }) => (
	<header
		style={{ borderBottom: '2px solid var(--accent)', marginBottom: '30px' }}
	>
		<h1 style={{ marginBottom: '10px' }}>📊 Experimental Research Stand</h1>
		<p style={{ color: 'var(--muted-text)' }}>
			Исследование реактивных парадигм: {scenarioName}
		</p>
	</header>
)
