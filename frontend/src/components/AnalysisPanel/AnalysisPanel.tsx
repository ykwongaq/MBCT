import { useState, useRef, useEffect } from "react";
import ModelViewer from "./ModelViewer";
import AnalysisReport from "./AnalysisReport";
import ErrorBox from "../../components/common/MessageBox/ErrorBox";
import styles from "./AnalysisPanel.module.css";
import { useProject } from "../../contexts/ProjectContext";
import { useAnnotationSession } from "../../contexts/AnnotationSessionContext";
import { estimate } from "../../services/EstimateService";
import type { EstimateResult } from "../../services/EstimateService";
import type { BBox } from "../../types/BBox";
import type { ApiRequestHandle } from "../../types/api";

function cropImage(imageUrl: string, bbox: BBox): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const img = new window.Image();
		img.onload = () => {
			const canvas = document.createElement("canvas");
			canvas.width = Math.round(bbox.width);
			canvas.height = Math.round(bbox.height);
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				reject(new Error("No canvas context"));
				return;
			}
			ctx.drawImage(
				img,
				Math.round(bbox.x_top_left),
				Math.round(bbox.y_top_left),
				Math.round(bbox.width),
				Math.round(bbox.height),
				0,
				0,
				Math.round(bbox.width),
				Math.round(bbox.height),
			);
			canvas.toBlob(
				(blob) => {
					if (blob) resolve(blob);
					else reject(new Error("Canvas toBlob failed"));
				},
				"image/jpeg",
				0.95,
			);
		};
		img.onerror = reject;
		img.src = imageUrl;
	});
}

function AnalysisPanel() {
	const { projectState, projectDispatch } = useProject();
	const { annotationSessionState } = useAnnotationSession();

	const [isLoading, setIsLoading] = useState(false);
	const [errorBoxOpen, setErrorBoxOpen] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");

	const prevImageIdRef = useRef<number | null | undefined>(undefined);
	const estimateHandleRef = useRef<ApiRequestHandle | null>(null);
	const estimateGenRef = useRef(0);

	const currentImageId = annotationSessionState.currentImageId;
	const currentData = projectState.dataList.find(
		(d) => d.id === currentImageId,
	);

	useEffect(() => {
		const prevImageId = prevImageIdRef.current;
		prevImageIdRef.current = currentImageId;

		if (!currentData?.bbox) return;

		const isInitialMount = prevImageId === undefined;
		const imageChanged = !isInitialMount && prevImageId !== currentImageId;
		const shouldCheckDepthMap = isInitialMount || imageChanged;

		// On image switch or initial mount, skip if depth map already exists
		if (shouldCheckDepthMap && currentData.depthMap) return;

		estimateHandleRef.current?.cancel();
		const gen = ++estimateGenRef.current;

		setIsLoading(true);

		const { bbox } = currentData;
		const imageUrl = currentData.image.imageUrl;
		const referencePoints = currentData.referencePoints ?? [];

		const imageId = currentImageId;

		cropImage(imageUrl, bbox)
			.then((blob) => {
				if (gen !== estimateGenRef.current) return;
				estimateHandleRef.current = estimate(
					blob,
					{
						onComplete: (result: EstimateResult) => {
							if (gen !== estimateGenRef.current) return;
							projectDispatch({
								type: "SET_DEPTH_MAP",
								payload: { id: imageId!, depthMap: result.depthMap },
							});
							projectDispatch({
								type: "SET_ANALYSIS_REPORT",
								payload: { id: imageId!, analysisReport: result.statistics },
							});
							setIsLoading(false);
						},
						onError: (err) => {
							if (gen !== estimateGenRef.current) return;
							setErrorMessage(err.message || "Estimation failed.");
							setErrorBoxOpen(true);
							setIsLoading(false);
						},
					},
					referencePoints.length >= 2 ? referencePoints : [],
					bbox,
				);
			})
			.catch((err) => {
				if (gen !== estimateGenRef.current) return;
				setErrorMessage(
					err instanceof Error ? err.message : "Failed to crop image.",
				);
				setErrorBoxOpen(true);
				setIsLoading(false);
			});

		return () => {
			estimateHandleRef.current?.cancel();
			estimateGenRef.current++;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		currentImageId,
		currentData?.bbox,
		currentData?.referencePoints,
		projectDispatch,
	]);

	const stats = currentData?.analysisReport ?? null;

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
					isLoading={isLoading}
				/>
			</div>
			<div className={styles.reportWrap}>
				{(isLoading || stats) && (
					<AnalysisReport
						stats={stats ?? { rugosity: 0, fractalDimension: 0 }}
						selectedUnit={currentData?.selectedUnit}
						isLoading={isLoading}
					/>
				)}
			</div>

			<ErrorBox
				open={errorBoxOpen}
				title="Estimation failed"
				message={errorMessage}
				onClose={() => setErrorBoxOpen(false)}
			/>
		</section>
	);
}

export default AnalysisPanel;
