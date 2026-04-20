import ModelViewer from "./ModelViewer";
import AnalysisReport from "./AnalysisReport";
import styles from "./AnalysisPanel.module.css";
import type { Statistic } from "../../types/Statistic";
import { useProject } from "../../contexts/ProjectContext";
import { useAnnotationSession } from "../../contexts/AnnotationSessionContext";

const DEFAULT_STATS: Statistic = {
	rugosity: 1.342,
	fractalDimension: 2.671,
	colonyHeight: 0.23,
};

function AnalysisPanel() {
	const { projectState } = useProject();
	const { annotationSessionState } = useAnnotationSession();

	const currentData = projectState.dataList.find(
		(d) => d.id === annotationSessionState.currentImageId,
	);

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
				<ModelViewer
					depthMap={currentData?.depthMap}
					imageUrl={currentData?.image.imageUrl}
					bbox={currentData?.bbox}
				/>
			</div>
			<div className={styles.reportWrap}>
				<AnalysisReport stats={DEFAULT_STATS} />
			</div>
		</section>
	);
}

export default AnalysisPanel;
