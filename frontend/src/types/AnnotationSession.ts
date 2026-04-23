import type { BBox } from "./BBox";
import type { DepthModelName } from "./DepthModelName";

export interface AnnotationSession {
	currentImageId: number | null;
	pendingBBox: BBox | null;
	isEditingReferencePoints: boolean;
	modelName: DepthModelName;
}
