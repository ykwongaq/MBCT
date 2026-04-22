import { useState, useRef } from "react";
import MeshViewer, { type MeshViewerHandle } from "./MeshViewer";
import PointCloudViewer, { type PointCloudViewerHandle } from "./PointCloudViewer";
import styles from "./ModelViewer.module.css";
import type { DepthMap } from "../../types/DepthMap";
import type { BBox } from "../../types/BBox";

type ViewMode = "mesh" | "pointcloud";

interface Props {
	depthMap?: DepthMap;
	imageUrl?: string;
	bbox?: BBox;
	isLoading?: boolean;
}

function ModelViewer({ depthMap, imageUrl, bbox, isLoading }: Props) {
	const [viewMode, setViewMode] = useState<ViewMode>("mesh");
	const meshRef = useRef<MeshViewerHandle>(null);
	const pointCloudRef = useRef<PointCloudViewerHandle>(null);

	const onReset = () => {
		if (viewMode === "mesh") meshRef.current?.reset();
		else pointCloudRef.current?.reset();
	};

	return (
		<div className={styles.viewer}>
			<div className={styles.header}>
				<span className={styles.title}>3D Viewer</span>
				<div className={styles.toggleGroup}>
					<button
						className={`${styles.toggleBtn} ${viewMode === "mesh" ? styles.toggleBtnActive : ""}`}
						onClick={() => setViewMode("mesh")}
					>
						Mesh
					</button>
					<button
						className={`${styles.toggleBtn} ${viewMode === "pointcloud" ? styles.toggleBtnActive : ""}`}
						onClick={() => setViewMode("pointcloud")}
					>
						Point Cloud
					</button>
				</div>
				<span className={styles.hint}>
					Left drag: rotate · Right drag: pan · Scroll: zoom
				</span>
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
				{viewMode === "mesh" ? (
					<MeshViewer
						ref={meshRef}
						depthMap={depthMap}
						imageUrl={imageUrl}
						bbox={bbox}
					/>
				) : (
					<PointCloudViewer
						ref={pointCloudRef}
						depthMap={depthMap}
						imageUrl={imageUrl}
						bbox={bbox}
					/>
				)}
			</div>
		</div>
	);
}

export default ModelViewer;
