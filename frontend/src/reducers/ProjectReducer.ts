import type { Image } from "../types/Image";
import type { BBox } from "../types/BBox";
import type { DepthMap } from "../types/DepthMap";
import type { Statistic } from "../types/Statistic";
import type { ProjectState } from "../types/ProjectState";
import type { Point } from "../types/Point";
import type { ReferencePoint } from "../types/ReferencePoint";
import type { Data } from "../types/Data";
export const initialProjectState: ProjectState = {
	dataList: [],
	bboxTemplates: [],
};

export type ProjectAction =
	| {
			type: "ADD_IMAGE";
			payload: { image: Image };
	  }
	| {
			type: "REMOVE_IMAGE";
			payload: { id: number };
	  }
	| {
			type: "SET_BBOX";
			payload: { id: number; bbox: BBox };
	  }
	| {
			type: "SET_DEPTH_MAP";
			payload: { id: number; depthMap: DepthMap };
	  }
	| {
			type: "SET_ANALYSIS_REPORT";
			payload: { id: number; analysisReport: Statistic };
	  }
	| {
			type: "ADD_REFERENCE_POINT";
			payload: { id: number; point: Point; distance: number };
	  }
	| {
			type: "REMOVE_REFERENCE_POINT";
			payload: { id: number; referencePointId: number };
	  }
	| {
			type: "CLEAR_REFERENCE_POINTS";
			payload: { id: number };
	  }
	| {
			type: "UPDATE_UNIT";
			payload: { id: number; newUnit: string };
	  }
	| {
			type: "UPDATE_REFERENCE_POINT";
			payload: { id: number; referencePointId: number; distance: number };
	  }
	| {
			type: "ADD_BBOX_TEMPLATE";
			payload: { bbox: BBox };
	  }
	| {
			type: "REMOVE_BBOX_TEMPLATE";
			payload: { id: number };
	  }
	| {
			type: "LOAD_PROJECT";
			payload: { projectState: ProjectState };
	  };

function addReferencePoint(
	state: ProjectState,
	id: number,
	point: Point,
	distance: number,
): ProjectState {
	const newId =
		state.dataList
			.find((data) => data.id === id)
			?.referencePoints?.slice(-1)[0]?.id ?? 0;
	const referencePoint: ReferencePoint = {
		id: newId + 1,
		point,
		distance,
	};
	return {
		...state,
		dataList: state.dataList.map((data) =>
			data.id === id
				? {
						...data,
						referencePoints: [
							...(data.referencePoints ?? []),
							referencePoint,
						],
					}
				: data,
		),
	};
}

function removeReferencePoint(
	state: ProjectState,
	id: number,
	referencePointId: number,
): ProjectState {
	return {
		...state,
		dataList: state.dataList.map((data) =>
			data.id === id
				? {
						...data,
						referencePoints: (data.referencePoints ?? [])
							.filter((rp) => rp.id !== referencePointId)
							.map((rp, index) => ({ ...rp, id: index + 1 })),
					}
				: data,
		),
	};
}

function clearReferencePoint(state: ProjectState, id: number): ProjectState {
	return {
		...state,
		dataList: state.dataList.map((data) =>
			data.id === id
				? {
						...data,
						referencePoints: [],
					}
				: data,
		),
	};
}

function updateReferencePoint(
	state: ProjectState,
	id: number,
	referencePointId: number,
	distance: number,
): ProjectState {
	return {
		...state,
		dataList: state.dataList.map((data) =>
			data.id === id
				? {
						...data,
						referencePoints: (data.referencePoints ?? []).map((rp) =>
							rp.id === referencePointId ? { ...rp, distance } : rp,
						),
					}
				: data,
		),
	};
}

function updateUnit(state: ProjectState, id: number, unit: string): ProjectState {
	return {
		...state,
		dataList: state.dataList.map((data) =>
			data.id === id ? { ...data, selectedUnit: unit as Data["selectedUnit"] } : data,
		),
	};
}

function addImage(state: ProjectState, image: Image): ProjectState {
	const newId =
		state.dataList.length > 0
			? state.dataList[state.dataList.length - 1].id + 1
			: 1;
	const newData = { image: image, id: newId, selectedUnit: "cm" as const };
	return {
		...state,
		dataList: [...state.dataList, newData],
	};
}

function removeImage(state: ProjectState, id: number): ProjectState {
	return {
		...state,
		dataList: state.dataList.filter((data) => data.id !== id),
	};
}

function setBBox(state: ProjectState, id: number, bbox: BBox): ProjectState {
	return {
		...state,
		dataList: state.dataList.map((data) =>
			data.id === id ? { ...data, bbox } : data,
		),
	};
}

function setDepthMap(
	state: ProjectState,
	id: number,
	depthMap: DepthMap,
): ProjectState {
	return {
		...state,
		dataList: state.dataList.map((data) =>
			data.id === id ? { ...data, depthMap } : data,
		),
	};
}

function addBBoxTemplate(state: ProjectState, bbox: BBox): ProjectState {
	const newId =
		state.bboxTemplates.length > 0
			? state.bboxTemplates[state.bboxTemplates.length - 1].id + 1
			: 1;
	return {
		...state,
		bboxTemplates: [...state.bboxTemplates, { id: newId, bbox }],
	};
}

function removeBBoxTemplate(state: ProjectState, id: number): ProjectState {
	return {
		...state,
		bboxTemplates: state.bboxTemplates.filter((t) => t.id !== id),
	};
}

function setAnalysisReport(
	state: ProjectState,
	id: number,
	analysisReport: Statistic,
): ProjectState {
	return {
		...state,
		dataList: state.dataList.map((data) =>
			data.id === id ? { ...data, analysisReport } : data,
		),
	};
}

export function projectReducer(
	state: ProjectState,
	action: ProjectAction,
): ProjectState {
	switch (action.type) {
		case "ADD_IMAGE":
			return addImage(state, action.payload.image);
		case "REMOVE_IMAGE":
			return removeImage(state, action.payload.id);
		case "SET_BBOX":
			return setBBox(state, action.payload.id, action.payload.bbox);
		case "SET_DEPTH_MAP":
			return setDepthMap(state, action.payload.id, action.payload.depthMap);
		case "SET_ANALYSIS_REPORT":
			return setAnalysisReport(
				state,
				action.payload.id,
				action.payload.analysisReport,
			);
		case "ADD_REFERENCE_POINT":
			return addReferencePoint(
				state,
				action.payload.id,
				action.payload.point,
				action.payload.distance,
			);
		case "REMOVE_REFERENCE_POINT":
			return removeReferencePoint(
				state,
				action.payload.id,
				action.payload.referencePointId,
			);
		case "CLEAR_REFERENCE_POINTS":
			return clearReferencePoint(state, action.payload.id);
		case "UPDATE_UNIT":
			return updateUnit(state, action.payload.id, action.payload.newUnit);
		case "UPDATE_REFERENCE_POINT":
			return updateReferencePoint(
				state,
				action.payload.id,
				action.payload.referencePointId,
				action.payload.distance,
			);
		case "ADD_BBOX_TEMPLATE":
			return addBBoxTemplate(state, action.payload.bbox);
		case "REMOVE_BBOX_TEMPLATE":
			return removeBBoxTemplate(state, action.payload.id);
		case "LOAD_PROJECT":
			return action.payload.projectState;
		default:
			return state;
	}
}
