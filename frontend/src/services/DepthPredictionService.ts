import { apiClient } from "./apiClient";
import type { ApiRequestCallbacks, ApiRequestHandle } from "../types/api";
import type { DepthMap } from "../types/DepthMap";

interface DepthEstimationServerResponse {
	depth_map: {
		depth_base64: string;
		shape: number[];
		dtype: string;
	};
}

export function estimateDepth(
	croppedImageBlob: Blob,
	callbacks: ApiRequestCallbacks<DepthMap>,
): ApiRequestHandle {
	callbacks.onLoading?.();

	const formData = new FormData();
	formData.append("image", croppedImageBlob, "crop.jpg");

	return apiClient.request<DepthEstimationServerResponse>(
		"/api/mbct/depth_estimation",
		{
			method: "POST",
			body: formData,
			onError: callbacks.onError,
			onComplete: (response) => {
				const depthMap = response.depth_map;
				const binaryString = atob(depthMap.depth_base64);
				const bytes = new Uint8Array(binaryString.length);
				for (let i = 0; i < binaryString.length; i++) {
					bytes[i] = binaryString.charCodeAt(i);
				}
				const [height, width] = depthMap.shape;
				callbacks.onComplete?.({
					data: new Float32Array(bytes.buffer),
					width,
					height,
				});
			},
		},
	);
}
