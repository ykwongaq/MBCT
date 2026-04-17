import { useEffect, useRef, useState } from "react";
import styles from "./ImageBlock.module.css";
import type { Data } from "../../types/Data";
import type { BBox } from "../../types/BBox";

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
	const imgRef = useRef<HTMLImageElement>(null);
	const svgRef = useRef<SVGSVGElement>(null);
	const onBBoxChangeRef = useRef(onBBoxChange);
	const dragStartRef = useRef<{ x: number; y: number } | null>(null);
	const [overlayRect, setOverlayRect] = useState<OverlayRect>({
		left: 0,
		top: 0,
		width: 0,
		height: 0,
	});
	const [isDragging, setIsDragging] = useState(false);
	const [dragBox, setDragBox] = useState<BBox | null>(null);

	useEffect(() => {
		onBBoxChangeRef.current = onBBoxChange;
	}, [onBBoxChange]);

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
			setDragBox({
				x_top_left: x,
				y_top_left: y,
				width,
				height,
			});
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

	const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
		e.preventDefault();
		const svg = svgRef.current;
		if (!svg) return;
		const pt = svg.createSVGPoint();
		pt.x = e.clientX;
		pt.y = e.clientY;
		const ctm = svg.getScreenCTM();
		if (!ctm) return;
		const loc = pt.matrixTransform(ctm.inverse());

		dragStartRef.current = { x: loc.x, y: loc.y };
		setIsDragging(true);
		setDragBox({
			x_top_left: loc.x,
			y_top_left: loc.y,
			width: 0,
			height: 0,
		});
	};

	const currentBox = isDragging ? dragBox : data.bbox;

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
				className={styles.svgOverlay}
				style={{
					left: overlayRect.left,
					top: overlayRect.top,
					width: overlayRect.width,
					height: overlayRect.height,
				}}
				viewBox={`0 0 ${data.image.imageWidth} ${data.image.imageHeight}`}
				onMouseDown={handleMouseDown}
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
			</svg>
		</div>
	);
}
