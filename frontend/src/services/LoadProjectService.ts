import { unzipSync, strFromU8 } from "fflate";
import type { ProjectState, BBoxTemplate } from "../types/ProjectState";
import type { Data } from "../types/Data";
import type { DepthMap } from "../types/DepthMap";

function base64ToFloat32Array(base64: string): Float32Array {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return new Float32Array(bytes.buffer);
}

function getMimeType(imageName: string): string {
	const ext = imageName.split(".").pop()?.toLowerCase() ?? "";
	if (ext === "png") return "image/png";
	if (ext === "tiff" || ext === "tif") return "image/tiff";
	return "image/jpeg";
}

export async function loadProject(file: File): Promise<ProjectState> {
	const buffer = await file.arrayBuffer();
	const unzipped = unzipSync(new Uint8Array(buffer));

	const projectJsonBytes = unzipped["project.json"];
	if (!projectJsonBytes) {
		throw new Error("Invalid .mbct file: missing project.json");
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const projectJson = JSON.parse(strFromU8(projectJsonBytes)) as any;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const dataList: Data[] = projectJson.dataList.map((item: any): Data => {
		const imageBytes = unzipped[item.image.imageUrl];
		let imageUrl = "";
		if (imageBytes) {
			const plain = new Uint8Array(imageBytes.byteLength);
			plain.set(imageBytes);
			const blob = new Blob([plain], { type: getMimeType(item.image.imageName) });
			imageUrl = URL.createObjectURL(blob);
		}

		let depthMap: DepthMap | undefined;
		if (item.depthMap?.__type === "DepthMap") {
			depthMap = {
				data: base64ToFloat32Array(item.depthMap.data),
				width: item.depthMap.width,
				height: item.depthMap.height,
			};
		}

		return {
			id: item.id,
			selectedUnit: item.selectedUnit,
			image: {
				imageUrl,
				imageName: item.image.imageName,
				imageWidth: item.image.imageWidth,
				imageHeight: item.image.imageHeight,
			},
			bbox: item.bbox ?? undefined,
			depthMap,
			pointCloud: item.pointCloud ?? undefined,
			analysisReport: item.analysisReport ?? undefined,
			referencePoints: item.referencePoints ?? [],
		};
	});

	const bboxTemplates: BBoxTemplate[] = projectJson.bboxTemplates ?? [];

	return { dataList, bboxTemplates };
}
