import { useState, useRef } from "react";
import MeshViewer, { type MeshViewerHandle } from "./MeshViewer";
import PointCloudViewer, {
	type PointCloudViewerHandle,
} from "./PointCloudViewer";
import DepthMapViewer, { type DepthMapViewerHandle } from "./DepthMapViewer";
import styles from "./ModelViewer.module.css";
import type { DepthMap } from "../../types/DepthMap";
import type { BBox } from "../../types/BBox";
import type { DepthModelName } from "../../types/DepthModelName";
import { DEPTH_MODEL_NAMES } from "../../types/DepthModelName";

type ViewMode = "mesh" | "pointcloud" | "depthmap";

interface Props {
	depthMap?: DepthMap;
	imageUrl?: string;
	bbox?: BBox;
	isLoading?: boolean;
	modelName?: DepthModelName;
	onModelChange?: (modelName: DepthModelName) => void;
}

const MODEL_LABELS: Record<DepthModelName, string> = {
	depth_anything_v2: "Depth Anything V2",
	depth_anything_v2_vkitti: "Depth Anything V2 (VKITTI)",
};

function ModelViewer({
	depthMap,
	imageUrl,
	bbox,
	isLoading,
	modelName,
	onModelChange,
}: Props) {
	const [viewMode, setViewMode] = useState<ViewMode>("pointcloud");
	const [autoRotate, setAutoRotate] = useState(true);
	const meshRef = useRef<MeshViewerHandle>(null);
	const pointCloudRef = useRef<PointCloudViewerHandle>(null);
	const depthMapRef = useRef<DepthMapViewerHandle>(null);

	const onReset = () => {
		if (viewMode === "mesh") meshRef.current?.reset();
		else if (viewMode === "pointcloud") pointCloudRef.current?.reset();
		else depthMapRef.current?.reset();
	};

	const onCapture = () => {
		if (viewMode === "mesh") meshRef.current?.capture();
		else if (viewMode === "pointcloud") pointCloudRef.current?.capture();
		else depthMapRef.current?.capture();
	};

	return (
		<div className={styles.viewer}>
			<div className={styles.header}>
				<span className={styles.title}>3D Viewer</span>
				{modelName && onModelChange && (
					<select
						className={styles.modelSelect}
						value={modelName}
						onChange={(e) =>
							onModelChange(e.target.value as DepthModelName)
						}
					>
						{DEPTH_MODEL_NAMES.map((name) => (
							<option key={name} value={name}>
								{MODEL_LABELS[name]}
							</option>
						))}
					</select>
				)}
				<div className={styles.toggleGroup}>
					<button
						className={`${styles.toggleBtn} ${viewMode === "pointcloud" ? styles.toggleBtnActive : ""}`}
						onClick={() => setViewMode("pointcloud")}
					>
						Point Cloud
					</button>
					<button
						className={`${styles.toggleBtn} ${viewMode === "mesh" ? styles.toggleBtnActive : ""}`}
						onClick={() => setViewMode("mesh")}
					>
						Mesh
					</button>
					<button
						className={`${styles.toggleBtn} ${viewMode === "depthmap" ? styles.toggleBtnActive : ""}`}
						onClick={() => setViewMode("depthmap")}
					>
						Depth Map
					</button>
				</div>
				<span className={styles.hint}>
					Left drag: rotate · Right drag: pan · Scroll: zoom
				</span>
				<button
					className={`${styles.rotateBtn} ${autoRotate ? styles.rotateBtnActive : ""}`}
					onClick={() => setAutoRotate((v) => !v)}
					title={autoRotate ? "Disable auto-rotate" : "Enable auto-rotate"}
				>
					Rotate
				</button>
				<button className={styles.resetBtn} onClick={onReset}>
					Reset
				</button>
				<button
					className={styles.captureBtn}
					onClick={onCapture}
					title="Capture screenshot"
				>
					Capture
				</button>
			</div>
			<div className={styles.body}>
				{isLoading && (
					<div className={styles.loadingOverlay}>
						<span className={styles.loadingSpinner} />
						<span className={styles.loadingLabel}>Estimating…</span>
					</div>
				)}
				{!depthMap && !isLoading && (
					<div className={styles.emptyOverlay}>
						<span className={styles.emptyLabel}>No depth map available</span>
					</div>
				)}
				{viewMode === "mesh" && depthMap && (
					<MeshViewer
						ref={meshRef}
						depthMap={depthMap}
						imageUrl={imageUrl}
						bbox={bbox}
						autoRotate={autoRotate}
					/>
				)}
				{viewMode === "pointcloud" && depthMap && (
					<PointCloudViewer
						ref={pointCloudRef}
						depthMap={depthMap}
						imageUrl={imageUrl}
						bbox={bbox}
						autoRotate={autoRotate}
					/>
				)}
				{viewMode === "depthmap" && depthMap && (
					<DepthMapViewer
						ref={depthMapRef}
						depthMap={depthMap}
						autoRotate={autoRotate}
					/>
				)}
			</div>
		</div>
	);
}

export default ModelViewer;
