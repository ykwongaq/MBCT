import { apiClient } from "./apiClient";
import type { ApiRequestCallbacks, ApiRequestHandle } from "../types/api";
import type { DepthMap } from "../types/DepthMap";
import type { Statistic } from "../types/Statistic";
import type { ReferencePoint } from "../types/ReferencePoint";
import type { BBox } from "../types/BBox";

interface EstimateServerResponse {
	depth_map: {
		depth_base64: string;
		shape: number[];
		dtype: string;
	};
	rugosity: number;
	fractal_dimension: number;
	colony_height: number | null;
}

export interface EstimateResult {
	depthMap: DepthMap;
	statistics: Statistic;
}

export function estimate(
	croppedImageBlob: Blob,
	callbacks: ApiRequestCallbacks<EstimateResult>,
	referencePoints: ReferencePoint[] = [],
	bbox?: BBox,
): ApiRequestHandle {
	callbacks.onLoading?.();

	// Transform reference point coordinates to be relative to the bbox origin,
	// and filter out any points that fall outside the crop region.
	const transformedPoints = bbox
		? referencePoints
				.map((rp) => ({
					point: {
						x: Math.round(rp.point.x - bbox.x_top_left),
						y: Math.round(rp.point.y - bbox.y_top_left),
					},
					distance: rp.distance,
				}))
				.filter(
					(rp) =>
						rp.point.x >= 0 &&
						rp.point.y >= 0 &&
						rp.point.x < bbox.width &&
						rp.point.y < bbox.height,
				)
		: [];

	const formData = new FormData();
	formData.append("image", croppedImageBlob, "crop.jpg");
	formData.append("reference_points", JSON.stringify(transformedPoints));

	return apiClient.request<EstimateServerResponse>("/api/mbct/estimate", {
		method: "POST",
		body: formData,
		onError: callbacks.onError,
		onComplete: (response) => {
			const dm = response.depth_map;
			const binaryString = atob(dm.depth_base64);
			const bytes = new Uint8Array(binaryString.length);
			for (let i = 0; i < binaryString.length; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}
			const [height, width] = dm.shape;

			const depthMap: DepthMap = {
				data: new Float32Array(bytes.buffer),
				width,
				height,
			};

			const statistics: Statistic = {
				rugosity: response.rugosity,
				fractalDimension: response.fractal_dimension,
			};
			if (response.colony_height !== null) {
				statistics.colonyHeight = response.colony_height;
			}

			callbacks.onComplete?.({ depthMap, statistics });
		},
	});
}
