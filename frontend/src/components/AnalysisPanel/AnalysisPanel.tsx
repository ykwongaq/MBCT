import PointCloudViewer from "./PointCloudViewer";
import AnalysisReport from "./AnalysisReport";
import styles from "./AnalysisPanel.module.css";
import type { Statistic } from "../../types/Statistic";

const DEFAULT_STATS: Statistic = {
	rugosity: 1.342,
	fractalDimension: 2.671,
	colonyHeight: 0.23,
};

function AnalysisPanel() {
	return (
		<section className={styles.panel}>
			<div className={styles.panelHeader}>
				<h2 className={styles.panelTitle}>Analysis Results</h2>
				<p className={styles.panelDesc}>
					3D structural complexity metrics derived from photogrammetric
					reconstruction.
				</p>
			</div>
			<div className={styles.viewerWrap}>
				<PointCloudViewer />
			</div>
			<div className={styles.reportWrap}>
				<AnalysisReport stats={DEFAULT_STATS} />
			</div>
		</section>
	);
}

export default AnalysisPanel;
