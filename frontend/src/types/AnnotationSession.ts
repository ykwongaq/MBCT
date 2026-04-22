import type { BBox } from "./BBox";

export interface AnnotationSession {
	currentImageId: number | null;
	pendingBBox: BBox | null;
	isEditingReferencePoints: boolean;
}
