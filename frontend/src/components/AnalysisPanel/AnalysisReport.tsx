import styles from "./AnalysisReport.module.css";
import { useProject } from "../../contexts/ProjectContext";
import type { Data } from "../../types/Data";
import type { Statistic } from "../../types/Statistic";

interface Props {
	data?: Data;
	isLoading?: boolean;
}

const HEADERS = [
	"id",
	"image name",
	"bbox (xywh)",
	"area of the bounding box",
	"rugosity",
	"fractal dimension",
	"colony height",
];

function escapeCsv(value: string): string {
	if (value.includes(",") || value.includes('"') || value.includes("\n")) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

function buildRow(item: Data): string[] {
	const bbox = item.bbox;
	const stats = item.analysisReport;
	console.log("Statistic", stats);
	const unit = item.selectedUnit ?? "m";

	const area =
		bbox && bbox.width != null && bbox.height != null
			? bbox.width * bbox.height
			: undefined;

	const bboxValue = bbox
		? `${bbox.x_top_left}, ${bbox.y_top_left}, ${bbox.width}, ${bbox.height}`
		: "";

	return [
		item.id !== undefined ? String(item.id) : "",
		item.image?.imageName || "",
		bboxValue,
		area !== undefined ? String(area) : "",
		stats?.rugosity !== undefined ? stats.rugosity.toFixed(3) : "",
		stats?.fractalDimension !== undefined
			? stats.fractalDimension.toFixed(3)
			: "",
		stats?.colonyHeight !== undefined
			? `${stats.colonyHeight.toFixed(2)} ${unit}`
			: "",
	];
}

function downloadCsv(filename: string, rows: string[][]) {
	const csvContent = [
		HEADERS.join(","),
		...rows.map((row) => row.map(escapeCsv).join(",")),
	].join("\n");
	const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.setAttribute("download", filename);
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

function AnalysisReport({ data, isLoading }: Props) {
	const { projectState } = useProject();
	const stats = data?.analysisReport;
	const selectedUnit = data?.selectedUnit ?? "m";
	const imageName = data?.image.imageName;
	const METRICS: {
		key: keyof Statistic;
		label: string;
		format: (v: number) => string;
		unit: string;
		desc: string;
	}[] = [
		{
			key: "rugosity",
			label: "Gradient Rugosity",
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

	const handleExport = () => {
		if (!data) return;
		const row = buildRow(data);
		downloadCsv(`analysis_report_${imageName || "export"}.csv`, [row]);
	};

	const handleExportAll = () => {
		const list =
			projectState.dataList.length > 0
				? projectState.dataList
				: data
					? [data]
					: [];
		const rows = list.map(buildRow);
		console.log(rows);
		downloadCsv("analysis_report_all_images.csv", rows);
	};

	return (
		<div className={styles.report}>
			<div className={styles.reportHeader}>
				<span className={styles.reportTitle}>Complexity Metrics</span>
				{!isLoading && (
					<div className={styles.exportButtonGroup}>
						<button
							className={styles.exportButton}
							onClick={handleExport}
							type="button"
						>
							Export
						</button>
						<button
							className={styles.exportButton}
							onClick={handleExportAll}
							type="button"
						>
							Export (All Image)
						</button>
					</div>
				)}
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
										<span
											className={`${styles.skeleton} ${styles.skeletonWide}`}
										/>
									</td>
								</tr>
							);
						}
						const raw = stats?.[key];
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
