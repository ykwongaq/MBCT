import styles from "./AnalysisReport.module.css";
import type { Statistic } from "../../types/Statistic";

interface Props {
	stats: Statistic;
	selectedUnit?: "cm" | "m" | "mm";
	isLoading?: boolean;
}

function AnalysisReport({ stats, selectedUnit = "m", isLoading }: Props) {
	const METRICS: {
		key: keyof Statistic;
		label: string;
		format: (v: number) => string;
		unit: string;
		desc: string;
	}[] = [
		{
			key: "rugosity",
			label: "Rugosity",
			format: (v) => v.toFixed(3),
			unit: "",
			desc: "Ratio of surface area to planar area",
		},
		{
			key: "fractalDimension",
			label: "Fractal Dimension",
			format: (v) => v.toFixed(3),
			unit: "",
			desc: "3D structural complexity measure",
		},
		{
			key: "colonyHeight",
			label: "Colony Height",
			format: (v) => v.toFixed(2),
			unit: selectedUnit,
			desc: "Maximum vertical extent",
		},
	];
	return (
		<div className={styles.report}>
			<div className={styles.reportHeader}>
				<span className={styles.reportTitle}>Complexity Metrics</span>
			</div>
			<table className={styles.table}>
				<thead>
					<tr>
						<th className={styles.th}>Metric</th>
						<th className={styles.th}>Value</th>
						<th className={`${styles.th} ${styles.thDesc}`}>Description</th>
					</tr>
				</thead>
				<tbody>
					{METRICS.map(({ key, label, format, unit, desc }) => {
						if (isLoading) {
							return (
								<tr key={key} className={styles.tr}>
									<td className={styles.td}>{label}</td>
									<td className={`${styles.td} ${styles.tdValue}`}>
										<span className={styles.skeleton} />
									</td>
									<td className={`${styles.td} ${styles.tdDesc}`}>
										<span className={`${styles.skeleton} ${styles.skeletonWide}`} />
									</td>
								</tr>
							);
						}
						const raw = stats[key];
						if (raw === undefined) return null;
						return (
							<tr key={key} className={styles.tr}>
								<td className={styles.td}>{label}</td>
								<td className={`${styles.td} ${styles.tdValue}`}>
									{format(raw)}
									{unit && <span className={styles.unit}> {unit}</span>}
								</td>
								<td className={`${styles.td} ${styles.tdDesc}`}>{desc}</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}

export default AnalysisReport;
