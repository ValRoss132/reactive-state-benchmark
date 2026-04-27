export const Header = ({ scenarioName }: { scenarioName: string }) => (
	<header style={{ borderBottom: '2px solid #005bff', marginBottom: '30px' }}>
		<h1 style={{ marginBottom: '10px' }}>📊 Experimental Research Stand</h1>
		<p style={{ color: '#666' }}>
			Исследование реактивных парадигм: {scenarioName}
		</p>
	</header>
)
