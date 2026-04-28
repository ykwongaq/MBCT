import { useState, useRef, useEffect } from "react";
import ModelViewer from "./ModelViewer";
import AnalysisReport from "./AnalysisReport";
import ErrorBox from "../../components/common/MessageBox/ErrorBox";
import styles from "./AnalysisPanel.module.css";
import { useProject } from "../../contexts/ProjectContext";
import { useAnnotationSession } from "../../contexts/AnnotationSessionContext";
import { estimate } from "../../services/EstimateService";
import { analyzeComplexity } from "../../services/ComplexityAnalysisService";
import type { EstimateResult } from "../../services/EstimateService";
import type { BBox } from "../../types/BBox";
import type { ApiRequestHandle } from "../../types/api";

function transformReferencePoints(
	referencePoints: { point: { x: number; y: number }; distance: number }[],
	bbox: BBox,
) {
	return referencePoints
		.map((rp) => ({
			point: {
				x: Math.round(rp.point.x - bbox.x_top_left),
				y: Math.round(rp.point.y - bbox.y_top_left),
			},
			distance: rp.distance,
		}))
		.filter(
			(rp) =>
				rp.point.x >= 0 &&
				rp.point.y >= 0 &&
				rp.point.x < bbox.width &&
				rp.point.y < bbox.height,
		);
}

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
	const { annotationSessionState, annotationSessionDispatch } =
		useAnnotationSession();

	const [isLoading, setIsLoading] = useState(false);
	const [errorBoxOpen, setErrorBoxOpen] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");

	const prevImageIdRef = useRef<number | null | undefined>(undefined);
	const prevBBoxRef = useRef<BBox | undefined>(undefined);
	const estimateHandleRef = useRef<ApiRequestHandle | null>(null);
	const estimateGenRef = useRef(0);
	const prevModelNameRef = useRef<string | undefined>(undefined);

	const currentImageId = annotationSessionState.currentImageId;
	const currentData = projectState.dataList.find(
		(d) => d.id === currentImageId,
	);

	useEffect(() => {
		const prevImageId = prevImageIdRef.current;
		const prevBBox = prevBBoxRef.current;
		const prevModelName = prevModelNameRef.current;

		prevImageIdRef.current = currentImageId;
		prevBBoxRef.current = currentData?.bbox;
		prevModelNameRef.current = annotationSessionState.modelName;

		if (!currentData?.bbox) return;

		const isInitialMount = prevImageId === undefined;
		const imageChanged = !isInitialMount && prevImageId !== currentImageId;
		const bboxChanged =
			!isInitialMount && !imageChanged && currentData.bbox !== prevBBox;
		const modelChanged =
			!isInitialMount && !imageChanged && !bboxChanged && annotationSessionState.modelName !== prevModelName;
		const refPointsChanged =
			!isInitialMount && !imageChanged && !bboxChanged && !modelChanged;

		const { bbox } = currentData;
		const imageUrl = currentData.image.imageUrl;
		const referencePoints = currentData.referencePoints ?? [];
		const imageId = currentImageId;

		// Reference points edited → complexity analysis only (reuse existing depth map)
		if (refPointsChanged) {
			if (!currentData.depthMap || referencePoints.length < 2) return;

			estimateHandleRef.current?.cancel();
			const gen = ++estimateGenRef.current;
			setIsLoading(true);

			const transformed = transformReferencePoints(referencePoints, bbox);
			estimateHandleRef.current = analyzeComplexity(
				currentData.depthMap,
				transformed,
				{
					onComplete: (result) => {
						if (gen !== estimateGenRef.current) return;
						projectDispatch({
							type: "SET_ANALYSIS_REPORT",
							payload: { id: imageId!, analysisReport: result },
						});
						setIsLoading(false);
					},
					onError: (err) => {
						if (gen !== estimateGenRef.current) return;
						setErrorMessage(err.message || "Complexity analysis failed.");
						setErrorBoxOpen(true);
						setIsLoading(false);
					},
				},
			);
			return () => {
				estimateHandleRef.current?.cancel();
			};
		}

		// BBox drawn/changed, model changed, or image changed → full estimation
		estimateHandleRef.current?.cancel();
		const gen = ++estimateGenRef.current;
		setIsLoading(true);

		cropImage(imageUrl, bbox)
			.then((blob) => {
				if (gen !== estimateGenRef.current) return;
				estimateHandleRef.current = estimate(
					blob,
					annotationSessionState.modelName,
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
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		currentImageId,
		currentData?.bbox,
		currentData?.referencePoints,
		projectDispatch,
		annotationSessionState.modelName,
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
					referencePoints={currentData?.referencePoints}
					isLoading={isLoading}
					modelName={annotationSessionState.modelName}
					onModelChange={(modelName) =>
						annotationSessionDispatch({
							type: "SET_MODEL_NAME",
							payload: { modelName },
						})
					}
				/>
			</div>
			<div className={styles.reportWrap}>
				{(isLoading || stats) && (
					<AnalysisReport
						stats={stats ?? { rugosity: 0, fractalDimension: 0 }}
						selectedUnit={currentData?.selectedUnit}
						isLoading={isLoading}
						imageName={currentData?.image.imageName}
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
