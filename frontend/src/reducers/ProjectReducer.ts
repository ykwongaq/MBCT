import type { Image } from "../types/Image";
import type { BBox } from "../types/BBox";
import type { DepthMap } from "../types/DepthMap";
import type { ProjectState } from "../types/ProjectState";

export const initialProjectState: ProjectState = {
	dataList: [],
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
	  };

function addImage(state: ProjectState, image: Image): ProjectState {
	const newId =
		state.dataList.length > 0
			? state.dataList[state.dataList.length - 1].id + 1
			: 1;
	const newData = { image, id: newId };
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
		default:
			return state;
	}
}
