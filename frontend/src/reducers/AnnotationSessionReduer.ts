import type { AnnotationSession } from "../types/AnnotationSession";
import type { BBox } from "../types/BBox";

export const initialAnnotationSession: AnnotationSession = {
	currentImageId: null,
	pendingBBox: null,
	isEditingReferencePoints: false,
};

export type AnnotationSessionAction =
	| {
			type: "SET_CURRENT_IMAGE_ID";
			payload: { imageId: number | null };
	  }
	| {
			type: "SET_PENDING_BBOX";
			payload: { bbox: BBox | null };
	  }
	| {
			type: "TOGGLE_IS_EIDITING_REFERENCE_POINT";
			payload: {};
	  };

function toggleIsEditingReferencePoint(
	state: AnnotationSession,
): AnnotationSession {
	const newValue = !state.isEditingReferencePoints;
	return {
		...state,
		isEditingReferencePoints: newValue,
	};
}
function setCurrentImageId(
	state: AnnotationSession,
	imageId: number | null,
): AnnotationSession {
	return {
		...state,
		currentImageId: imageId,
	};
}

function setPendingBBox(
	state: AnnotationSession,
	bbox: BBox | null,
): AnnotationSession {
	return {
		...state,
		pendingBBox: bbox,
	};
}

export function annotationSessionReducer(
	state: AnnotationSession,
	action: AnnotationSessionAction,
): AnnotationSession {
	switch (action.type) {
		case "SET_CURRENT_IMAGE_ID":
			return setCurrentImageId(state, action.payload.imageId);
		case "SET_PENDING_BBOX":
			return setPendingBBox(state, action.payload.bbox);
		case "TOGGLE_IS_EIDITING_REFERENCE_POINT":
			return toggleIsEditingReferencePoint(state);
		default:
			return state;
	}
}
