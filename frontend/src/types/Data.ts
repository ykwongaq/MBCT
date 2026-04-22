import type { Statistic } from "./Statistic";
import type { BBox } from "./BBox";
import type { Image } from "./Image";
import type { PointCloud } from "./PointCloud";
import type { DepthMap } from "./DepthMap";
import type { ReferencePoint } from "./ReferencePoint";

export interface Data {
	image: Image;
	id: number;

	bbox?: BBox;

	depthMap?: DepthMap;
	pointCloud?: PointCloud;
	analysisReport?: Statistic;

	referencePoints?: ReferencePoint[];
	selectedUnit: "cm" | "m" | "mm";
}
