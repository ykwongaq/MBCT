import { useEffect, useRef } from "react";
import styles from "./PointCloudViewer.module.css";

const POINT_COUNT = 2000;

function generatePoints(): Float32Array {
	const pts = new Float32Array(POINT_COUNT * 3);
	for (let i = 0; i < POINT_COUNT; i++) {
		const phi = Math.random() * Math.PI * 2;
		const r = Math.sqrt(Math.random());
		const x = r * Math.cos(phi);
		const z = r * Math.sin(phi);
		const dome = Math.sqrt(Math.max(0, 1 - r * r));
		const noise = (Math.random() - 0.5) * 0.18;
		pts[i * 3] = x * 0.85;
		pts[i * 3 + 1] = Math.max(-0.1, dome * 0.75 + noise);
		pts[i * 3 + 2] = z * 0.85;
	}
	return pts;
}

// Gradient: #1a5276 (base) → #48c9b0 (peak), matching the header palette
function lerpColor(t: number): string {
	const tc = Math.max(0, Math.min(1, t));
	const r = Math.round(26 + (72 - 26) * tc);
	const g = Math.round(82 + (201 - 82) * tc);
	const b = Math.round(118 + (176 - 118) * tc);
	return `rgb(${r},${g},${b})`;
}

function PointCloudViewer() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const wrapRef = useRef<HTMLDivElement>(null);
	const rotYRef = useRef(0.3);
	const rotXRef = useRef(-0.38);
	const isDragRef = useRef(false);
	const isPanRef = useRef(false);
	const lastPtRef = useRef({ x: 0, y: 0 });
	const animRef = useRef<number>(0);
	const ptsRef = useRef<Float32Array>(generatePoints());
	const zoomRef = useRef(1.0);
	const panXRef = useRef(0);
	const panYRef = useRef(0);

	useEffect(() => {
		const canvas = canvasRef.current!;
		const wrap = wrapRef.current!;

		const resize = () => {
			const dpr = window.devicePixelRatio || 1;
			canvas.width = wrap.clientWidth * dpr;
			canvas.height = wrap.clientHeight * dpr;
		};
		resize();
		const ro = new ResizeObserver(resize);
		ro.observe(wrap);

		const render = () => {
			const ctx = canvas.getContext("2d")!;
			const dpr = window.devicePixelRatio || 1;
			const W = canvas.width / dpr;
			const H = canvas.height / dpr;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, W, H);

			const cx = W / 2 + panXRef.current;
			const cy = H / 2 + panYRef.current;
			const scale = Math.min(W, H) * 0.42 * zoomRef.current;
			const fov = 2.8;
			const cosRY = Math.cos(rotYRef.current);
			const sinRY = Math.sin(rotYRef.current);
			const cosRX = Math.cos(rotXRef.current);
			const sinRX = Math.sin(rotXRef.current);

			const pts = ptsRef.current;
			const projected: {
				sx: number;
				sy: number;
				depth: number;
				t: number;
			}[] = [];

			for (let i = 0; i < POINT_COUNT; i++) {
				const px = pts[i * 3];
				const py = pts[i * 3 + 1];
				const pz = pts[i * 3 + 2];

				const rx1 = px * cosRY + pz * sinRY;
				const rz1 = -px * sinRY + pz * cosRY;
				const ry1 = py * cosRX - rz1 * sinRX;
				const rz2 = py * sinRX + rz1 * cosRX;

				const d = fov / (fov + rz2 + 1.5);
				projected.push({
					sx: cx + rx1 * d * scale,
					sy: cy - ry1 * d * scale,
					depth: rz2,
					t: (pts[i * 3 + 1] + 0.1) / 0.85,
				});
			}

			projected.sort((a, b) => a.depth - b.depth);

			for (const p of projected) {
				const d = fov / (fov + p.depth + 1.5);
				ctx.globalAlpha = 0.45 + d * 0.55;
				ctx.fillStyle = lerpColor(p.t);
				ctx.beginPath();
				ctx.arc(p.sx, p.sy, Math.max(0.7, d * 2.6), 0, Math.PI * 2);
				ctx.fill();
			}
			ctx.globalAlpha = 1;
		};

		const animate = () => {
			if (!isDragRef.current && !isPanRef.current) {
				rotYRef.current += 0.004;
			}
			render();
			animRef.current = requestAnimationFrame(animate);
		};
		animRef.current = requestAnimationFrame(animate);

		const onWheel = (e: WheelEvent) => {
			e.preventDefault();
			const factor = e.deltaY > 0 ? 0.95 : 1.05;
			zoomRef.current = Math.max(0.3, Math.min(5.0, zoomRef.current * factor));
		};
		wrap.addEventListener("wheel", onWheel, { passive: false });

		return () => {
			cancelAnimationFrame(animRef.current);
			ro.disconnect();
			wrap.removeEventListener("wheel", onWheel);
		};
	}, []);

	const onMouseDown = (e: React.MouseEvent) => {
		if (e.button === 2) {
			isPanRef.current = true;
		} else {
			isDragRef.current = true;
		}
		lastPtRef.current = { x: e.clientX, y: e.clientY };
	};
	const onMouseMove = (e: React.MouseEvent) => {
		const dx = e.clientX - lastPtRef.current.x;
		const dy = e.clientY - lastPtRef.current.y;
		if (isPanRef.current) {
			panXRef.current += dx;
			panYRef.current += dy;
		} else if (isDragRef.current) {
			rotYRef.current -= dx * 0.008;
			rotXRef.current = Math.max(-1.2, Math.min(0.5, rotXRef.current - dy * 0.008));
		}
		lastPtRef.current = { x: e.clientX, y: e.clientY };
	};
	const onMouseUp = () => {
		isDragRef.current = false;
		isPanRef.current = false;
	};

	const onReset = () => {
		rotYRef.current = 0.3;
		rotXRef.current = -0.38;
		zoomRef.current = 1.0;
		panXRef.current = 0;
		panYRef.current = 0;
	};

	return (
		<div className={styles.viewer}>
			<div className={styles.header}>
				<span className={styles.title}>Point Cloud</span>
				<span className={styles.hint}>Left drag: rotate · Right drag: pan · Scroll: zoom</span>
				<button className={styles.resetBtn} onClick={onReset}>Reset</button>
			</div>
			<div
				ref={wrapRef}
				className={styles.canvasWrap}
				onMouseDown={onMouseDown}
				onMouseMove={onMouseMove}
				onMouseUp={onMouseUp}
				onMouseLeave={onMouseUp}
				onContextMenu={(e) => e.preventDefault()}
			>
				<canvas ref={canvasRef} className={styles.canvas} />
			</div>
		</div>
	);
}

export default PointCloudViewer;
