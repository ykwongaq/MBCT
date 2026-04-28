import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./RectangleBox.module.css";
import type { BBox } from "../../../types/BBox";
import type { Point } from "../../../types/Point";

type Corner = "nw" | "ne" | "sw" | "se";

interface RectangleBoxProps {
	bbox: BBox;
	onChange: (bbox: BBox) => void;
	getSvgPoint: (e: { clientX: number; clientY: number }) => Point | null;
	interactive?: boolean;
	handleRadius?: number;
}

export default function RectangleBox({
	bbox,
	onChange,
	getSvgPoint,
	interactive = true,
	handleRadius = 8,
}: RectangleBoxProps) {
	const [previewBox, setPreviewBox] = useState<BBox | null>(null);
	const [isDragging, setIsDragging] = useState(false);

	const getSvgPointRef = useRef(getSvgPoint);
	const onChangeRef = useRef(onChange);

	useEffect(() => {
		getSvgPointRef.current = getSvgPoint;
	}, [getSvgPoint]);

	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);

	const dragStateRef = useRef<
		| { type: "idle" }
		| { type: "move"; startBox: BBox; startPoint: Point }
		| {
				type: "resize";
				corner: Corner;
				startBox: BBox;
				startPoint: Point;
				anchor: Point;
		  }
	>({ type: "idle" });

	useEffect(() => {
		if (!isDragging) return;

		const handleMouseMove = (e: MouseEvent) => {
			const state = dragStateRef.current;
			if (state.type === "idle") return;

			const pt = getSvgPointRef.current(e);
			if (!pt) return;

			if (state.type === "move") {
				const dx = pt.x - state.startPoint.x;
				const dy = pt.y - state.startPoint.y;
				setPreviewBox({
					x_top_left: state.startBox.x_top_left + dx,
					y_top_left: state.startBox.y_top_left + dy,
					width: state.startBox.width,
					height: state.startBox.height,
				});
			} else if (state.type === "resize") {
				const x = Math.min(pt.x, state.anchor.x);
				const y = Math.min(pt.y, state.anchor.y);
				const width = Math.abs(pt.x - state.anchor.x);
				const height = Math.abs(pt.y - state.anchor.y);
				setPreviewBox({
					x_top_left: x,
					y_top_left: y,
					width,
					height,
				});
			}
		};

		const handleMouseUp = () => {
			dragStateRef.current = { type: "idle" };
			setIsDragging(false);
			setPreviewBox((prev) => {
				if (prev && prev.width > 2 && prev.height > 2) {
					onChangeRef.current(prev);
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

	const startMove = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			const pt = getSvgPointRef.current(e);
			if (!pt) return;
			dragStateRef.current = {
				type: "move",
				startBox: bbox,
				startPoint: pt,
			};
			setPreviewBox(bbox);
			setIsDragging(true);
		},
		[bbox],
	);

	const startResize = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			const corner = (e.currentTarget as SVGCircleElement)
				.dataset.corner as Corner;
			const pt = getSvgPointRef.current(e);
			if (!pt) return;

			let anchor: Point;
			const x1 = bbox.x_top_left;
			const y1 = bbox.y_top_left;
			const x2 = bbox.x_top_left + bbox.width;
			const y2 = bbox.y_top_left + bbox.height;

			switch (corner) {
				case "nw":
					anchor = { x: x2, y: y2 };
					break;
				case "ne":
					anchor = { x: x1, y: y2 };
					break;
				case "sw":
					anchor = { x: x2, y: y1 };
					break;
				case "se":
					anchor = { x: x1, y: y1 };
					break;
			}

			dragStateRef.current = {
				type: "resize",
				corner,
				startBox: bbox,
				startPoint: pt,
				anchor,
			};
			setPreviewBox(bbox);
			setIsDragging(true);
		},
		[bbox],
	);

	const box = previewBox ?? bbox;

	const corners: { key: Corner; cx: number; cy: number; cursor: string }[] = [
		{
			key: "nw",
			cx: box.x_top_left,
			cy: box.y_top_left,
			cursor: "nwse-resize",
		},
		{
			key: "ne",
			cx: box.x_top_left + box.width,
			cy: box.y_top_left,
			cursor: "nesw-resize",
		},
		{
			key: "sw",
			cx: box.x_top_left,
			cy: box.y_top_left + box.height,
			cursor: "nesw-resize",
		},
		{
			key: "se",
			cx: box.x_top_left + box.width,
			cy: box.y_top_left + box.height,
			cursor: "nwse-resize",
		},
	];

	return (
		<g className={styles.group}>
			<rect
				className={styles.bboxRect}
				x={box.x_top_left}
				y={box.y_top_left}
				width={box.width}
				height={box.height}
				pointerEvents={interactive ? "all" : "none"}
				onMouseDown={interactive ? startMove : undefined}
				style={{ cursor: interactive ? (isDragging ? "grabbing" : "grab") : undefined }}
			/>
			{interactive &&
				corners.map((c) => (
					<circle
						key={c.key}
						className={styles.handle}
						cx={c.cx}
						cy={c.cy}
						r={handleRadius}
						style={{ cursor: c.cursor }}
						data-corner={c.key}
						onMouseDown={startResize}
					/>
				))}
		</g>
	);
}
