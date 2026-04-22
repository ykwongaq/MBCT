import { apiClient } from "./apiClient";
import type { ApiRequestCallbacks, ApiRequestHandle } from "../types/api";
import type { DepthMap } from "../types/DepthMap";
import type { Statistic } from "../types/Statistic";

interface ReferencePoint {
	point: { x: number; y: number };
	distance: number;
}

interface ComplexityAnalysisServerResponse {
	rugosity: number;
	fractal_dimension: number;
	colony_height: number | null;
}

function float32ArrayToBase64(floatArray: Float32Array): string {
	const bytes = new Uint8Array(
		floatArray.buffer,
		floatArray.byteOffset,
		floatArray.byteLength,
	);
	let binaryString = "";
	for (let i = 0; i < bytes.length; i++) {
		binaryString += String.fromCharCode(bytes[i]);
	}
	return btoa(binaryString);
}

export function analyzeComplexity(
	depthMap: DepthMap,
	referencePoints: ReferencePoint[],
	callbacks: ApiRequestCallbacks<Statistic>,
): ApiRequestHandle {
	callbacks.onLoading?.();

	const requestBody = {
		depth_map: {
			depth_base64: float32ArrayToBase64(depthMap.data),
			shape: [depthMap.height, depthMap.width],
			dtype: "float32",
		},
		reference_points: referencePoints,
	};

	return apiClient.request<ComplexityAnalysisServerResponse>(
		"/api/mbct/complexity_analysis",
		{
			method: "POST",
			body: requestBody,
			onError: callbacks.onError,
			onComplete: (response) => {
				const result: Statistic = {
					rugosity: response.rugosity,
					fractalDimension: response.fractal_dimension,
				};
				if (response.colony_height !== null) {
					result.colonyHeight = response.colony_height;
				}
				callbacks.onComplete?.(result);
			},
		},
	);
}
