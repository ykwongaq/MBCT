import { zipSync, strToU8 } from "fflate";
import type { ProjectState } from "../types/ProjectState";
import type { Data } from "../types/Data";

function float32ArrayToBase64(arr: Float32Array): string {
	const bytes = new Uint8Array(arr.buffer);
	let binary = "";
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

async function fetchImageAsUint8Array(url: string): Promise<Uint8Array> {
	const response = await fetch(url);
	const buffer = await response.arrayBuffer();
	return new Uint8Array(buffer);
}

function serializeData(data: Data, imageRelPath: string): object {
	return {
		id: data.id,
		selectedUnit: data.selectedUnit,
		image: {
			imageUrl: imageRelPath,
			imageName: data.image.imageName,
			imageWidth: data.image.imageWidth,
			imageHeight: data.image.imageHeight,
		},
		bbox: data.bbox ?? null,
		depthMap: data.depthMap
			? {
					__type: "DepthMap",
					data: float32ArrayToBase64(data.depthMap.data),
					width: data.depthMap.width,
					height: data.depthMap.height,
				}
			: null,
		pointCloud: data.pointCloud ?? null,
		analysisReport: data.analysisReport ?? null,
		referencePoints: data.referencePoints ?? [],
	};
}

export async function downloadProject(
	projectState: ProjectState,
	filename = "project",
): Promise<void> {
	const files: Record<string, Uint8Array> = {};

	const serializedDataList = await Promise.all(
		projectState.dataList.map(async (data) => {
			const ext = data.image.imageName.split(".").pop() ?? "jpg";
			const imageRelPath = `images/${data.id}.${ext}`;

			try {
				const imageBytes = await fetchImageAsUint8Array(data.image.imageUrl);
				files[imageRelPath] = imageBytes;
			} catch {
				// Skip image if it can't be fetched (e.g., revoked blob URL)
			}

			return serializeData(data, imageRelPath);
		}),
	);

	const projectJson = JSON.stringify(
		{
			dataList: serializedDataList,
			bboxTemplates: projectState.bboxTemplates,
		},
		null,
		2,
	);

	files["project.json"] = strToU8(projectJson);

	const zipBytes = zipSync(files, { level: 6 });

	const blob = new Blob([zipBytes.buffer as ArrayBuffer], { type: "application/octet-stream" });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = `${filename}.mbct`;
	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);
	URL.revokeObjectURL(url);
}
