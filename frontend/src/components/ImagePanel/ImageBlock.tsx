import { useEffect, useRef, useState } from "react";
import styles from "./ImageBlock.module.css";
import type { Data } from "../../types/Data";
import type { BBox } from "../../types/BBox";
import type { Point } from "../../types/Point";
import { useProject } from "../../contexts/ProjectContext";
import { useAnnotationSession } from "../../contexts/AnnotationSessionContext";

interface ImageBlockProps {
	data: Data;
	onBBoxChange: (bbox: BBox) => void;
}

interface OverlayRect {
	left: number;
	top: number;
	width: number;
	height: number;
}

export default function ImageBlock({ data, onBBoxChange }: ImageBlockProps) {
	const { projectDispatch } = useProject();
	const { annotationSessionState } = useAnnotationSession();
	const isEditingReferencePoints = annotationSessionState.isEditingReferencePoints;

	const imgRef = useRef<HTMLImageElement>(null);
	const svgRef = useRef<SVGSVGElement>(null);
	const onBBoxChangeRef = useRef(onBBoxChange);
	const dragStartRef = useRef<{ x: number; y: number } | null>(null);
	const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);

	const [overlayRect, setOverlayRect] = useState<OverlayRect>({
		left: 0,
		top: 0,
		width: 0,
		height: 0,
	});
	const [isDragging, setIsDragging] = useState(false);
	const [dragBox, setDragBox] = useState<BBox | null>(null);
	const [selectedPointId, setSelectedPointId] = useState<number | null>(null);
	const [editingDistance, setEditingDistance] = useState<string>("");

	useEffect(() => {
		onBBoxChangeRef.current = onBBoxChange;
	}, [onBBoxChange]);

	// Close popup when switching off editing mode
	useEffect(() => {
		if (!isEditingReferencePoints) setSelectedPointId(null);
	}, [isEditingReferencePoints]);

	// Sync editing input when selected point changes
	useEffect(() => {
		if (selectedPointId === null) return;
		const rp = (data.referencePoints ?? []).find((r) => r.id === selectedPointId);
		if (rp) setEditingDistance(String(rp.distance));
	}, [selectedPointId, data.referencePoints]);

	const computeOverlay = () => {
		const img = imgRef.current;
		if (!img || !img.naturalWidth) return;
		const imgRect = img.getBoundingClientRect();
		const naturalRatio = img.naturalWidth / img.naturalHeight;
		const rectRatio = imgRect.width / imgRect.height;

		let width = imgRect.width;
		let height = imgRect.height;
		let left = 0;
		let top = 0;

		if (naturalRatio > rectRatio) {
			height = imgRect.width / naturalRatio;
			top = (imgRect.height - height) / 2;
		} else {
			width = imgRect.height * naturalRatio;
			left = (imgRect.width - width) / 2;
		}

		setOverlayRect({ left, top, width, height });
	};

	useEffect(() => {
		computeOverlay();
		const handleResize = () => computeOverlay();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [data.image.imageUrl]);

	useEffect(() => {
		if (!isDragging) return;
		const start = dragStartRef.current;
		if (!start) return;

		const handleMouseMove = (e: MouseEvent) => {
			const svg = svgRef.current;
			if (!svg) return;
			const pt = svg.createSVGPoint();
			pt.x = e.clientX;
			pt.y = e.clientY;
			const ctm = svg.getScreenCTM();
			if (!ctm) return;
			const loc = pt.matrixTransform(ctm.inverse());

			const x = Math.min(start.x, loc.x);
			const y = Math.min(start.y, loc.y);
			const width = Math.abs(loc.x - start.x);
			const height = Math.abs(loc.y - start.y);
			setDragBox({ x_top_left: x, y_top_left: y, width, height });
		};

		const handleMouseUp = () => {
			setIsDragging(false);
			setDragBox((prev) => {
				dragStartRef.current = null;
				if (prev && prev.width > 2 && prev.height > 2) {
					onBBoxChangeRef.current(prev);
				}
				return null;
			});
		};

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);
		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isDragging]);

	const getSvgPoint = (e: React.MouseEvent<SVGSVGElement>): Point | null => {
		const svg = svgRef.current;
		if (!svg) return null;
		const pt = svg.createSVGPoint();
		pt.x = e.clientX;
		pt.y = e.clientY;
		const ctm = svg.getScreenCTM();
		if (!ctm) return null;
		const loc = pt.matrixTransform(ctm.inverse());
		return { x: loc.x, y: loc.y };
	};

	const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
		e.preventDefault();
		const loc = getSvgPoint(e);
		if (!loc) return;
		mouseDownPosRef.current = { x: loc.x, y: loc.y };

		if (!isEditingReferencePoints) {
			dragStartRef.current = { x: loc.x, y: loc.y };
			setIsDragging(true);
			setDragBox({ x_top_left: loc.x, y_top_left: loc.y, width: 0, height: 0 });
		}
	};

	const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
		if (!isEditingReferencePoints) return;
		const loc = getSvgPoint(e);
		if (!loc) return;

		// Don't add point if clicked on an existing marker (those stop propagation)
		projectDispatch({
			type: "ADD_REFERENCE_POINT",
			payload: { id: data.id, point: loc, distance: 0 },
		});
	};

	const handleMarkerClick = (e: React.MouseEvent, rpId: number) => {
		e.stopPropagation();
		setSelectedPointId((prev) => (prev === rpId ? null : rpId));
	};

	const handleDistanceCommit = (rpId: number) => {
		const val = parseFloat(editingDistance);
		if (isNaN(val) || val < 0) return;
		projectDispatch({
			type: "UPDATE_REFERENCE_POINT",
			payload: { id: data.id, referencePointId: rpId, distance: val },
		});
	};

	const handleUnitChange = (newUnit: "cm" | "m" | "mm") => {
		projectDispatch({
			type: "UPDATE_UNIT",
			payload: { id: data.id, newUnit },
		});
	};

	const handleDeletePoint = (rpId: number) => {
		projectDispatch({
			type: "REMOVE_REFERENCE_POINT",
			payload: { id: data.id, referencePointId: rpId },
		});
		setSelectedPointId(null);
	};

	// Convert SVG image coordinates to pixels within the imageBlock div
	const toPixel = (x: number, y: number) => ({
		px: overlayRect.left + (x / data.image.imageWidth) * overlayRect.width,
		py: overlayRect.top + (y / data.image.imageHeight) * overlayRect.height,
	});

	const currentBox = isDragging ? dragBox : data.bbox;
	const referencePoints = data.referencePoints ?? [];
	const selectedUnit = data.selectedUnit;
	const selectedPoint = referencePoints.find((r) => r.id === selectedPointId) ?? null;

	// Marker radius in SVG coords (scaled so it appears ~8px on screen)
	const markerR =
		overlayRect.width > 0
			? (10 / overlayRect.width) * data.image.imageWidth
			: 10;

	return (
		<div className={styles.imageBlock}>
			<img
				ref={imgRef}
				src={data.image.imageUrl}
				alt={data.image.imageName}
				className={styles.mainImage}
				onLoad={computeOverlay}
			/>
			<svg
				ref={svgRef}
				className={`${styles.svgOverlay} ${isEditingReferencePoints ? styles.editingMode : ""}`}
				style={{
					left: overlayRect.left,
					top: overlayRect.top,
					width: overlayRect.width,
					height: overlayRect.height,
				}}
				viewBox={`0 0 ${data.image.imageWidth} ${data.image.imageHeight}`}
				onMouseDown={handleMouseDown}
				onClick={handleSvgClick}
			>
				{currentBox && (
					<rect
						x={currentBox.x_top_left}
						y={currentBox.y_top_left}
						width={currentBox.width}
						height={currentBox.height}
						fill="rgba(251, 146, 60, 0.35)"
						stroke="rgb(251, 146, 60)"
						strokeWidth="3"
					/>
				)}
				{referencePoints.map((rp) => {
					const isSelected = rp.id === selectedPointId;
					return (
						<g
							key={rp.id}
							onClick={(e) => handleMarkerClick(e, rp.id)}
							style={{ cursor: "pointer" }}
						>
							<circle
								cx={rp.point.x}
								cy={rp.point.y}
								r={markerR * 0.5}
								fill={isSelected ? "rgb(59, 130, 246)" : "rgb(34, 197, 94)"}
								stroke="rgb(0, 0, 0)"
								strokeWidth={markerR * 0.15}
							/>
						</g>
					);
				})}
			</svg>

			{selectedPoint && (() => {
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
								onClick={() => setSelectedPointId(null)}
								aria-label="Close"
							>
								<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
									<line x1="18" y1="6" x2="6" y2="18" />
									<line x1="6" y1="6" x2="18" y2="18" />
								</svg>
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
									onBlur={() => handleDistanceCommit(selectedPoint.id)}
									onKeyDown={(e) => {
										if (e.key === "Enter") handleDistanceCommit(selectedPoint.id);
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
							onClick={() => handleDeletePoint(selectedPoint.id)}
						>
							<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<polyline points="3 6 5 6 21 6" />
								<path d="M19 6l-1 14H6L5 6" />
								<path d="M10 11v6M14 11v6" />
								<path d="M9 6V4h6v2" />
							</svg>
							Delete point
						</button>
					</div>
				);
			})()}
		</div>
	);
}
