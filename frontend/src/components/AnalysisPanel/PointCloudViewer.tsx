import {
	useEffect,
	useRef,
	useMemo,
	forwardRef,
	useImperativeHandle,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import styles from "./PointCloudViewer.module.css";
import type { DepthMap } from "../../types/DepthMap";
import type { BBox } from "../../types/BBox";

export interface PointCloudViewerHandle {
	reset: () => void;
}

interface Props {
	depthMap?: DepthMap;
	imageUrl?: string;
	bbox?: BBox;
	autoRotate?: boolean;
}

function buildPointCloudGeometry(depthMap: DepthMap): THREE.BufferGeometry {
	const { data, width, height } = depthMap;

	let min = Infinity;
	let max = -Infinity;
	for (let i = 0; i < data.length; i++) {
		if (data[i] < min) min = data[i];
		if (data[i] > max) max = data[i];
	}
	const range = max - min || 1;

	const positions = new Float32Array(width * height * 3);

	for (let row = 0; row < height; row++) {
		for (let col = 0; col < width; col++) {
			const i = row * width + col;
			const depth = 1 - (data[i] - min) / range;
			positions[i * 3] = (col / (width - 1)) * 2 - 1;
			positions[i * 3 + 1] = depth * 0.8;
			positions[i * 3 + 2] = (row / (height - 1)) * 2 - 1;
		}
	}

	const geo = new THREE.BufferGeometry();
	geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
	return geo;
}

function buildPlaceholderPointCloudGeometry(): THREE.BufferGeometry {
	const res = 60;
	const positions = new Float32Array(res * res * 3);

	for (let row = 0; row < res; row++) {
		for (let col = 0; col < res; col++) {
			const i = row * res + col;
			const x = (col / (res - 1)) * 2 - 1;
			const z = (row / (res - 1)) * 2 - 1;
			const r = Math.sqrt(x * x + z * z);
			const y = Math.max(0, Math.sqrt(Math.max(0, 1 - r * r))) * 0.5;
			positions[i * 3] = x * 0.85;
			positions[i * 3 + 1] = y;
			positions[i * 3 + 2] = z * 0.85;
		}
	}

	const geo = new THREE.BufferGeometry();
	geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
	return geo;
}

interface SceneProps {
	depthMap?: DepthMap;
	imageUrl?: string;
	bbox?: BBox;
	rotXRef: React.RefObject<number>;
	rotYRef: React.RefObject<number>;
	zoomRef: React.RefObject<number>;
	panXRef: React.RefObject<number>;
	panYRef: React.RefObject<number>;
	isDragRef: React.RefObject<boolean>;
	isPanRef: React.RefObject<boolean>;
	autoRotate?: boolean;
}

function createCircleTexture(): THREE.Texture {
	const size = 64;
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext("2d")!;
	ctx.beginPath();
	ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
	ctx.fillStyle = "#ffffff";
	ctx.fill();
	const texture = new THREE.CanvasTexture(canvas);
	texture.needsUpdate = true;
	return texture;
}

function Scene({
	depthMap,
	imageUrl,
	bbox,
	rotXRef,
	rotYRef,
	zoomRef,
	panXRef,
	panYRef,
	isDragRef,
	isPanRef,
	autoRotate,
}: SceneProps) {
	const matRef = useRef<THREE.PointsMaterial>(null);
	const { camera } = useThree();
	const circleTexture = useMemo(() => createCircleTexture(), []);

	const geo = useMemo(
		() =>
			depthMap
				? buildPointCloudGeometry(depthMap)
				: buildPlaceholderPointCloudGeometry(),
		[depthMap],
	);

	useEffect(() => {
		const mat = matRef.current;
		if (!mat) return;

		if (!depthMap || !imageUrl || !bbox) {
			if (geo.hasAttribute("color")) geo.deleteAttribute("color");
			mat.vertexColors = false;
			mat.color.set(0x48c9b0);
			mat.needsUpdate = true;
			return;
		}

		const img = new window.Image();
		img.onload = () => {
			const offscreen = document.createElement("canvas");
			offscreen.width = depthMap.width;
			offscreen.height = depthMap.height;
			const ctx = offscreen.getContext("2d")!;
			ctx.drawImage(
				img,
				Math.round(bbox.x_top_left),
				Math.round(bbox.y_top_left),
				Math.round(bbox.width),
				Math.round(bbox.height),
				0,
				0,
				depthMap.width,
				depthMap.height,
			);
			const imageData = ctx.getImageData(0, 0, depthMap.width, depthMap.height);
			const colors = new Float32Array(depthMap.width * depthMap.height * 3);

			const brightness = 0.8;
			for (let i = 0; i < depthMap.width * depthMap.height; i++) {
				colors[i * 3] = (imageData.data[i * 4] / 255) * brightness;
				colors[i * 3 + 1] = (imageData.data[i * 4 + 1] / 255) * brightness;
				colors[i * 3 + 2] = (imageData.data[i * 4 + 2] / 255) * brightness;
			}
			geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
			if (matRef.current) {
				matRef.current.vertexColors = true;
				matRef.current.color.set(0xffffff);
				matRef.current.needsUpdate = true;
			}
		};
		img.src = imageUrl;
	}, [depthMap, imageUrl, bbox, geo]);

	useFrame(() => {
		if (autoRotate && !isDragRef.current && !isPanRef.current) {
			rotYRef.current += 0.004;
		}
		const r = zoomRef.current;
		const panSensitivity = 0.003 * r;
		const px = panXRef.current * panSensitivity;
		const py = panYRef.current * -panSensitivity;

		// Base camera position (no pan)
		const baseX = Math.sin(rotYRef.current) * Math.cos(rotXRef.current) * r;
		const baseY = Math.sin(-rotXRef.current) * r + 0.3;
		const baseZ = Math.cos(rotYRef.current) * Math.cos(rotXRef.current) * r;

		// Forward vector (from base camera position toward orbit center)
		const fx = -baseX;
		const fy = -(baseY - 0.3);
		const fz = -baseZ;
		const flen = Math.sqrt(fx * fx + fy * fy + fz * fz) || 1;
		const nfx = fx / flen;
		const nfy = fy / flen;
		const nfz = fz / flen;

		// Right vector = normalize(forward × worldUp)
		let rx = -nfz;
		let ry = 0;
		let rz = nfx;
		const rlen = Math.sqrt(rx * rx + ry * ry + rz * rz);
		if (rlen < 1e-6) {
			rx = 1;
			ry = 0;
			rz = 0;
		} else {
			rx /= rlen;
			ry /= rlen;
			rz /= rlen;
		}

		// Up vector = right × forward
		const ux = ry * nfz - rz * nfy;
		const uy = rz * nfx - rx * nfz;
		const uz = rx * nfy - ry * nfx;

		const panX = rx * px + ux * py;
		const panY = ry * px + uy * py;
		const panZ = rz * px + uz * py;

		camera.position.x = baseX + panX;
		camera.position.y = baseY + panY;
		camera.position.z = baseZ + panZ;
		camera.lookAt(panX, 0.3 + panY, panZ);
	});

	return (
		<points geometry={geo}>
			<pointsMaterial
				ref={matRef}
				color={0x48c9b0}
				size={0.02}
				sizeAttenuation
				map={circleTexture}
				transparent
				alphaTest={0.5}
			/>
		</points>
	);
}

const PointCloudViewer = forwardRef<PointCloudViewerHandle, Props>(
	function PointCloudViewer(
		{ depthMap, imageUrl, bbox, autoRotate = true },
		ref,
	) {
		const wrapRef = useRef<HTMLDivElement>(null);
		const isDragRef = useRef(false);
		const isPanRef = useRef(false);
		const lastPtRef = useRef({ x: 0, y: 0 });
		const rotYRef = useRef(0.3);
		const rotXRef = useRef(-0.38);
		const zoomRef = useRef(3.2);
		const panXRef = useRef(0);
		const panYRef = useRef(0);

		useImperativeHandle(ref, () => ({
			reset() {
				rotYRef.current = 0.3;
				rotXRef.current = -0.38;
				zoomRef.current = 3.2;
				panXRef.current = 0;
				panYRef.current = 0;
			},
		}));

		useEffect(() => {
			const wrap = wrapRef.current!;
			const onWheel = (e: WheelEvent) => {
				e.preventDefault();
				zoomRef.current = Math.max(
					0.5,
					Math.min(8.0, zoomRef.current * (e.deltaY > 0 ? 1.05 : 0.95)),
				);
			};
			wrap.addEventListener("wheel", onWheel, { passive: false });
			return () => wrap.removeEventListener("wheel", onWheel);
		}, []);

		const onMouseDown = (e: React.MouseEvent) => {
			if (e.button === 2) isPanRef.current = true;
			else isDragRef.current = true;
			lastPtRef.current = { x: e.clientX, y: e.clientY };
		};

		const onMouseMove = (e: React.MouseEvent) => {
			const dx = e.clientX - lastPtRef.current.x;
			const dy = e.clientY - lastPtRef.current.y;
			if (isPanRef.current) {
				panXRef.current -= dx;
				panYRef.current -= dy;
			} else if (isDragRef.current) {
				rotYRef.current -= dx * 0.008;
				rotXRef.current = Math.max(
					-1.2,
					Math.min(0.5, rotXRef.current - dy * 0.008),
				);
			}
			lastPtRef.current = { x: e.clientX, y: e.clientY };
		};

		const onMouseUp = () => {
			isDragRef.current = false;
			isPanRef.current = false;
		};

		return (
			<div
				ref={wrapRef}
				className={styles.canvasWrap}
				onMouseDown={onMouseDown}
				onMouseMove={onMouseMove}
				onMouseUp={onMouseUp}
				onMouseLeave={onMouseUp}
				onContextMenu={(e) => e.preventDefault()}
			>
				<Canvas
					style={{ position: "absolute", inset: 0 }}
					frameloop="always"
					camera={{ position: [0, 1.5, 3.2], fov: 45, near: 0.01, far: 100 }}
					gl={{ antialias: true, alpha: true }}
				>
					<Scene
						depthMap={depthMap}
						imageUrl={imageUrl}
						bbox={bbox}
						rotXRef={rotXRef}
						rotYRef={rotYRef}
						zoomRef={zoomRef}
						panXRef={panXRef}
						panYRef={panYRef}
						isDragRef={isDragRef}
						isPanRef={isPanRef}
						autoRotate={autoRotate}
					/>
				</Canvas>
			</div>
		);
	},
);

export default PointCloudViewer;
