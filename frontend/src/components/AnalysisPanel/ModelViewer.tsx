import { useState, useRef } from "react";
import MeshViewer, { type MeshViewerHandle } from "./MeshViewer";
import PointCloudViewer, {
	type PointCloudViewerHandle,
} from "./PointCloudViewer";
import DepthMapViewer, { type DepthMapViewerHandle } from "./DepthMapViewer";
import styles from "./ModelViewer.module.css";
import type { DepthMap } from "../../types/DepthMap";
import type { BBox } from "../../types/BBox";

type ViewMode = "mesh" | "pointcloud" | "depthmap";

interface Props {
	depthMap?: DepthMap;
	imageUrl?: string;
	bbox?: BBox;
	isLoading?: boolean;
}

function ModelViewer({ depthMap, imageUrl, bbox, isLoading }: Props) {
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

	return (
		<div className={styles.viewer}>
			<div className={styles.header}>
				<span className={styles.title}>3D Viewer</span>
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
			</div>
			<div className={styles.body}>
				{isLoading && (
					<div className={styles.loadingOverlay}>
						<span className={styles.loadingSpinner} />
						<span className={styles.loadingLabel}>Estimating…</span>
					</div>
				)}
				{viewMode === "mesh" && (
					<MeshViewer
						ref={meshRef}
						depthMap={depthMap}
						imageUrl={imageUrl}
						bbox={bbox}
						autoRotate={autoRotate}
					/>
				)}
				{viewMode === "pointcloud" && (
					<PointCloudViewer
						ref={pointCloudRef}
						depthMap={depthMap}
						imageUrl={imageUrl}
						bbox={bbox}
						autoRotate={autoRotate}
					/>
				)}
				{viewMode === "depthmap" && (
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
