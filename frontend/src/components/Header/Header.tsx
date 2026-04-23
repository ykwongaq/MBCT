import styles from "./Header.module.css";

const METRICS = [
	{ value: "~17%", label: "Rugosity Error" },
	{ value: "~2%", label: "Fractal Dim. Error" },
	{ value: "<5s", label: "Processing Time" },
	{ value: "R²=0.83", label: "vs. Photogrammetry" },
];

function Header() {
	return (
		<header className={styles.header}>
			<div className={styles.container}>
				<span className={styles.badge}>Open-Access AI Tool</span>

				<h1 className={styles.title}>
					Mono<span className={styles.titleAccent}>Benthic</span>ComplexTool
					<span className={styles.titleAbbr}> (MBCT)</span>
				</h1>

				<p className={styles.subtitle}>
					Rapid AI-based structural complexity estimation of benthic habitats
					from a single top-down image — rugosity, fractal dimension, and colony
					height in seconds.
				</p>

				<div className={styles.metricsBar}>
					{METRICS.map((m, i) => (
						<div key={m.label} className={styles.metricGroup}>
							{i > 0 && <div className={styles.divider} />}
							<div className={styles.metric}>
								<span className={styles.metricValue}>{m.value}</span>
								<span className={styles.metricLabel}>{m.label}</span>
							</div>
						</div>
					))}
				</div>
			</div>
		</header>
	);
}

export default Header;
