import type { Statistic } from "./Statistic";
import type { BBox } from "./BBox";
import type { Image } from "./Image";
import type { PointCloud } from "./PointCloud";
import type { DepthMap } from "./DepthMap";

export interface Data {
	image: Image;
	bbox?: BBox;
	id: number;
	depthMap?: DepthMap;
	pointCloud?: PointCloud;
	analysisReport?: Statistic;
}
