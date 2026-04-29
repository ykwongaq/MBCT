import { useCallback, useEffect, useRef, useState } from "react";
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

interface ViewBox {
	x: number;
	y: number;
	w: number;
	h: number;
}

export default function ImageBlock({ data, onBBoxChange, onDragBBoxChange, onNewBBoxDrawn }: ImageBlockProps) {
	const { projectDispatch } = useProject();
	const { annotationSessionState } = useAnnotationSession();
	const isEditingReferencePoints = annotationSessionState.isEditingReferencePoints;

	const svgRef = useRef<SVGSVGElement>(null);
	const onBBoxChangeRef = useRef(onBBoxChange);
	const onDragBBoxChangeRef = useRef(onDragBBoxChange);
	const onNewBBoxDrawnRef = useRef(onNewBBoxDrawn);
	const dragStartRef = useRef<{ x: number; y: number } | null>(null);
	const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
	const dragBoxRef = useRef<BBox | null>(null);
	const panStartRef = useRef<{
		screenX: number;
		screenY: number;
		vx: number;
		vy: number;
		vw: number;
		vh: number;
		svgW: number;
		svgH: number;
	} | null>(null);

	const imageWidth = data.image.imageWidth;
	const imageHeight = data.image.imageHeight;

	const [viewBox, setViewBox] = useState<ViewBox>({ x: 0, y: 0, w: imageWidth, h: imageHeight });
	const [svgScreenSize, setSvgScreenSize] = useState({ width: imageWidth, height: imageHeight });
	const [isDragging, setIsDragging] = useState(false);
	const [isPanning, setIsPanning] = useState(false);
	const [dragBox, setDragBox] = useState<BBox | null>(null);
	const [selectedPointId, setSelectedPointId] = useState<number | null>(null);

	useEffect(() => { onBBoxChangeRef.current = onBBoxChange; }, [onBBoxChange]);
	useEffect(() => { onDragBBoxChangeRef.current = onDragBBoxChange; }, [onDragBBoxChange]);
	useEffect(() => { onNewBBoxDrawnRef.current = onNewBBoxDrawn; }, [onNewBBoxDrawn]);

	// Reset viewBox when switching to a different image
	useEffect(() => {
		setViewBox({ x: 0, y: 0, w: imageWidth, h: imageHeight });
	}, [data.id, imageWidth, imageHeight]);

	// Close popup when switching off editing mode
	useEffect(() => {
		if (!isEditingReferencePoints) setSelectedPointId(null);
	}, [isEditingReferencePoints]);

	// Track SVG rendered size via ResizeObserver for marker scaling and popup positioning
	useEffect(() => {
		const svg = svgRef.current;
		if (!svg) return;
		const ro = new ResizeObserver((entries) => {
			const { width, height } = entries[0].contentRect;
			if (width > 0 && height > 0) setSvgScreenSize({ width, height });
		});
		ro.observe(svg);
		return () => ro.disconnect();
	}, []);

	// Wheel zoom — must use imperative addEventListener with passive:false to call preventDefault
	useEffect(() => {
		const svg = svgRef.current;
		if (!svg) return;

		const handleWheel = (e: WheelEvent) => {
			e.preventDefault();
			const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
			const pt = svg.createSVGPoint();
			pt.x = e.clientX;
			pt.y = e.clientY;
			const ctm = svg.getScreenCTM();
			if (!ctm) return;
			const loc = pt.matrixTransform(ctm.inverse());

			setViewBox((prev) => {
				let newW = prev.w / factor;
				let newH = prev.h / factor;
				// Clamp zoom range to 5%–100% of the image, preserving aspect ratio
				const minW = imageWidth * 0.05;
				if (newW > imageWidth) { newW = imageWidth; newH = imageHeight; }
				if (newW < minW) { newW = minW; newH = minW * (imageHeight / imageWidth); }
				// Keep the cursor position fixed in image space
				const fracX = (loc.x - prev.x) / prev.w;
				const fracY = (loc.y - prev.y) / prev.h;
				let newX = loc.x - fracX * newW;
				let newY = loc.y - fracY * newH;
				newX = Math.max(0, Math.min(newX, imageWidth - newW));
				newY = Math.max(0, Math.min(newY, imageHeight - newH));
				return { x: newX, y: newY, w: newW, h: newH };
			});
		};

		svg.addEventListener("wheel", handleWheel, { passive: false });
		return () => svg.removeEventListener("wheel", handleWheel);
	}, [imageWidth, imageHeight]);

	// Middle-mouse pan
	useEffect(() => {
		if (!isPanning) return;
		const start = panStartRef.current;
		if (!start) return;

		const handleMouseMove = (e: MouseEvent) => {
			const dx = e.clientX - start.screenX;
			const dy = e.clientY - start.screenY;
			const scaleX = start.vw / start.svgW;
			const scaleY = start.vh / start.svgH;
			let newX = start.vx - dx * scaleX;
			let newY = start.vy - dy * scaleY;
			newX = Math.max(0, Math.min(newX, imageWidth - start.vw));
			newY = Math.max(0, Math.min(newY, imageHeight - start.vh));
			setViewBox((prev) => ({ ...prev, x: newX, y: newY }));
		};

		const handleMouseUp = () => {
			panStartRef.current = null;
			setIsPanning(false);
		};

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);
		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isPanning, imageWidth, imageHeight]);

	// Bbox draw drag
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

	const getSvgPoint = useCallback((e: { clientX: number; clientY: number }): Point | null => {
		const svg = svgRef.current;
		if (!svg) return null;
		const pt = svg.createSVGPoint();
		pt.x = e.clientX;
		pt.y = e.clientY;
		const ctm = svg.getScreenCTM();
		if (!ctm) return null;
		const loc = pt.matrixTransform(ctm.inverse());
		return { x: loc.x, y: loc.y };
	}, []);

	const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
		e.preventDefault();

		if (e.button === 2) {
			panStartRef.current = {
				screenX: e.clientX,
				screenY: e.clientY,
				vx: viewBox.x,
				vy: viewBox.y,
				vw: viewBox.w,
				vh: viewBox.h,
				svgW: svgScreenSize.width,
				svgH: svgScreenSize.height,
			};
			setIsPanning(true);
			return;
		}

		if (e.button !== 0) return;
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
		projectDispatch({
			type: "ADD_REFERENCE_POINT",
			payload: { id: data.id, point: loc, distance: 1 },
		});
	};

	// Double-click resets zoom to full image (only when not placing reference points)
	const handleDoubleClick = () => {
		if (!isEditingReferencePoints) {
			setViewBox({ x: 0, y: 0, w: imageWidth, h: imageHeight });
		}
	};

	const handleMarkerClick = (e: React.MouseEvent, rpId: number) => {
		e.stopPropagation();
		setSelectedPointId((prev) => (prev === rpId ? null : rpId));
	};

	const currentBox = isDragging ? dragBox : data.bbox;
	const referencePoints = data.referencePoints ?? [];
	const selectedUnit = data.selectedUnit;
	const selectedPoint = referencePoints.find((r) => r.id === selectedPointId) ?? null;

	// Marker radius in SVG coords so it always appears ~10px on screen regardless of zoom
	const markerR = (10 / svgScreenSize.width) * viewBox.w;
	const handleRadius = (6 / svgScreenSize.width) * viewBox.w;

	// Virtual overlayRect for popup positioning: maps image coords → px relative to imageBlock.
	// Derived so that: px = left + (x / imageWidth) * width  ==  (x - vx) / vw * svgScreenWidth
	const popupOverlayRect = {
		left: -(viewBox.x / viewBox.w) * svgScreenSize.width,
		top: -(viewBox.y / viewBox.h) * svgScreenSize.height,
		width: (imageWidth / viewBox.w) * svgScreenSize.width,
		height: (imageHeight / viewBox.h) * svgScreenSize.height,
	};

	const svgClassName = [
		styles.svgCanvas,
		isEditingReferencePoints ? styles.editingMode : "",
		isPanning ? styles.panningMode : "",
	].filter(Boolean).join(" ");

	return (
		<div className={styles.imageBlock}>
			<svg
				ref={svgRef}
				className={svgClassName}
				viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
				width={imageWidth}
				height={imageHeight}
				onMouseDown={handleMouseDown}
				onClick={handleSvgClick}
				onDoubleClick={handleDoubleClick}
				onContextMenu={(e) => e.preventDefault()}
			>
				<image
					href={data.image.imageUrl}
					x={0}
					y={0}
					width={imageWidth}
					height={imageHeight}
				/>
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
				overlayRect={popupOverlayRect}
				imageWidth={imageWidth}
				imageHeight={imageHeight}
				selectedUnit={selectedUnit}
				dataId={data.id}
				onClose={() => setSelectedPointId(null)}
			/>
		</div>
	);
}
