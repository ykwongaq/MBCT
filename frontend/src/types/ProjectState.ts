import type { Data } from "./Data";
import type { BBox } from "./BBox";

export interface BBoxTemplate {
	id: number;
	bbox: BBox;
}

export interface ProjectState {
	dataList: Data[];
	bboxTemplates: BBoxTemplate[];
}
