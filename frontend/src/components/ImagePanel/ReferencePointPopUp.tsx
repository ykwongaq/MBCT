import { useEffect, useState } from "react";
import styles from "./ReferencePointPopUp.module.css";
import type { ReferencePoint } from "../../types/ReferencePoint";
import { useProject } from "../../contexts/ProjectContext";
import { CloseIcon, TrashSimpleIcon } from "./icons";

interface OverlayRect {
	left: number;
	top: number;
	width: number;
	height: number;
}

interface ReferencePointPopUpProps {
	selectedPoint: ReferencePoint | null;
	referencePoints: ReferencePoint[];
	overlayRect: OverlayRect;
	imageWidth: number;
	imageHeight: number;
	selectedUnit: "cm" | "m" | "mm";
	dataId: number;
	onClose: () => void;
}

export default function ReferencePointPopUp({
	selectedPoint,
	referencePoints,
	overlayRect,
	imageWidth,
	imageHeight,
	selectedUnit,
	dataId,
	onClose,
}: ReferencePointPopUpProps) {
	const { projectDispatch } = useProject();
	const [editingDistance, setEditingDistance] = useState<string>("");

	useEffect(() => {
		if (!selectedPoint) return;
		setEditingDistance(String(selectedPoint.distance));
	}, [selectedPoint]);

	if (!selectedPoint) return null;

	const toPixel = (x: number, y: number) => ({
		px: overlayRect.left + (x / imageWidth) * overlayRect.width,
		py: overlayRect.top + (y / imageHeight) * overlayRect.height,
	});

	const { px, py } = toPixel(selectedPoint.point.x, selectedPoint.point.y);
	const popupW = 210;
	const popupH = 130;
	const margin = 8;

	// Prefer positioning to the right, flip left if it would overflow
	let left = px + margin;
	if (overlayRect.width > 0 && left + popupW > overlayRect.left + overlayRect.width) {
		left = px - popupW - margin;
	}
	// Prefer positioning below, flip up if it would overflow
	let top = py + margin;
	if (overlayRect.height > 0 && top + popupH > overlayRect.top + overlayRect.height) {
		top = py - popupH - margin;
	}

	const rpIndex = referencePoints.findIndex((r) => r.id === selectedPoint.id);

	const handleDistanceCommit = () => {
		const val = parseFloat(editingDistance);
		if (isNaN(val) || val < 0) return;
		projectDispatch({
			type: "UPDATE_REFERENCE_POINT",
			payload: { id: dataId, referencePointId: selectedPoint.id, distance: val },
		});
	};

	const handleUnitChange = (newUnit: "cm" | "m" | "mm") => {
		projectDispatch({
			type: "UPDATE_UNIT",
			payload: { id: dataId, newUnit },
		});
	};

	const handleDelete = () => {
		projectDispatch({
			type: "REMOVE_REFERENCE_POINT",
			payload: { id: dataId, referencePointId: selectedPoint.id },
		});
		onClose();
	};

	return (
		<div
			className={styles.popup}
			style={{ left, top }}
			onMouseDown={(e) => e.stopPropagation()}
			onClick={(e) => e.stopPropagation()}
		>
			<div className={styles.popupHeader}>
				<span className={styles.popupTitle}>Point {rpIndex + 1}</span>
				<button
					className={styles.popupClose}
					onClick={onClose}
					aria-label="Close"
				>
					<CloseIcon size={12} strokeWidth={2.5} />
				</button>
			</div>

			<div className={styles.popupRow}>
				<label className={styles.popupLabel}>Distance</label>
				<div className={styles.popupInputGroup}>
					<input
						className={styles.popupInput}
						type="number"
						min="0"
						step="any"
						value={editingDistance}
						onChange={(e) => setEditingDistance(e.target.value)}
						onBlur={handleDistanceCommit}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleDistanceCommit();
						}}
					/>
					<select
						className={styles.popupSelect}
						value={selectedUnit}
						onChange={(e) => handleUnitChange(e.target.value as "cm" | "m" | "mm")}
					>
						<option value="cm">cm</option>
						<option value="mm">mm</option>
						<option value="m">m</option>
					</select>
				</div>
			</div>

			<button
				className={styles.popupDelete}
				onClick={handleDelete}
			>
				<TrashSimpleIcon size={13} />
				Delete point
			</button>
		</div>
	);
}
