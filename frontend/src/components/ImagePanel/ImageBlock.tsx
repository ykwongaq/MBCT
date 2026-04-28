import { useEffect, useRef, useState } from "react";
import styles from "./ImageBlock.module.css";
import type { Data } from "../../types/Data";
import type { BBox } from "../../types/BBox";
import type { Point } from "../../types/Point";
import { useProject } from "../../contexts/ProjectContext";
import { useAnnotationSession } from "../../contexts/AnnotationSessionContext";
import ReferencePointPopUp from "./ReferencePointPopUp";
import RectangleBox from "./RectangleBox";

interface ImageBlockProps {
	data: Data;
	onBBoxChange: (bbox: BBox) => void;
	onDragBBoxChange?: (bbox: BBox | null) => void;
	onNewBBoxDrawn?: (bbox: BBox) => void;
}

interface OverlayRect {
	left: number;
	top: number;
	width: number;
	height: number;
}

export default function ImageBlock({ data, onBBoxChange, onDragBBoxChange, onNewBBoxDrawn }: ImageBlockProps) {
	const { projectDispatch } = useProject();
	const { annotationSessionState } = useAnnotationSession();
	const isEditingReferencePoints =
		annotationSessionState.isEditingReferencePoints;

	const imgRef = useRef<HTMLImageElement>(null);
	const svgRef = useRef<SVGSVGElement>(null);
	const onBBoxChangeRef = useRef(onBBoxChange);
	const onDragBBoxChangeRef = useRef(onDragBBoxChange);
	const onNewBBoxDrawnRef = useRef(onNewBBoxDrawn);
	const dragStartRef = useRef<{ x: number; y: number } | null>(null);
	const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
	const dragBoxRef = useRef<BBox | null>(null);

	const [overlayRect, setOverlayRect] = useState<OverlayRect>({
		left: 0,
		top: 0,
		width: 0,
		height: 0,
	});
	const [isDragging, setIsDragging] = useState(false);
	const [dragBox, setDragBox] = useState<BBox | null>(null);
	const [selectedPointId, setSelectedPointId] = useState<number | null>(null);

	useEffect(() => {
		onBBoxChangeRef.current = onBBoxChange;
	}, [onBBoxChange]);

	useEffect(() => {
		onDragBBoxChangeRef.current = onDragBBoxChange;
	}, [onDragBBoxChange]);

	useEffect(() => {
		onNewBBoxDrawnRef.current = onNewBBoxDrawn;
	}, [onNewBBoxDrawn]);

	// Close popup when switching off editing mode
	useEffect(() => {
		if (!isEditingReferencePoints) setSelectedPointId(null);
	}, [isEditingReferencePoints]);

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
			const newBox = { x_top_left: x, y_top_left: y, width, height };
			dragBoxRef.current = newBox;
			setDragBox(newBox);
			onDragBBoxChangeRef.current?.(newBox);
		};

		const handleMouseUp = () => {
			const finalBox = dragBoxRef.current;
			dragBoxRef.current = null;
			dragStartRef.current = null;
			setIsDragging(false);
			setDragBox(null);
			onDragBBoxChangeRef.current?.(null);
			if (finalBox && finalBox.width > 2 && finalBox.height > 2) {
				onBBoxChangeRef.current(finalBox);
				onNewBBoxDrawnRef.current?.(finalBox);
			}
		};

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);
		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isDragging]);

	const getSvgPoint = (e: {
		clientX: number;
		clientY: number;
	}): Point | null => {
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
			payload: { id: data.id, point: loc, distance: 1 },
		});
	};

	const handleMarkerClick = (e: React.MouseEvent, rpId: number) => {
		e.stopPropagation();
		setSelectedPointId((prev) => (prev === rpId ? null : rpId));
	};

	const currentBox = isDragging ? dragBox : data.bbox;
	const referencePoints = data.referencePoints ?? [];
	const selectedUnit = data.selectedUnit;
	const selectedPoint =
		referencePoints.find((r) => r.id === selectedPointId) ?? null;

	// Marker radius in SVG coords (scaled so it appears ~8px on screen)
	const markerR =
		overlayRect.width > 0
			? (10 / overlayRect.width) * data.image.imageWidth
			: 10;

	const handleRadius =
		overlayRect.width > 0 ? (6 / overlayRect.width) * data.image.imageWidth : 6;

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
				{currentBox && (
					<RectangleBox
						bbox={currentBox}
						onChange={onBBoxChange}
						getSvgPoint={getSvgPoint}
						interactive={!isEditingReferencePoints && !isDragging}
						handleRadius={handleRadius}
					/>
				)}
			</svg>

			<ReferencePointPopUp
				selectedPoint={selectedPoint}
				referencePoints={referencePoints}
				overlayRect={overlayRect}
				imageWidth={data.image.imageWidth}
				imageHeight={data.image.imageHeight}
				selectedUnit={selectedUnit}
				dataId={data.id}
				onClose={() => setSelectedPointId(null)}
			/>
		</div>
	);
}
