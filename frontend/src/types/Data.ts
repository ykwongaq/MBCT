import type { Statistic } from "./Statistic";
import type { BBox } from "./BBox";
import type { Image } from "./Image";
import type { PointCloud } from "./PointCloud";

export interface Data {
	image: Image;
	bbox?: BBox;
	id: number;
	pointCloud?: PointCloud;
	analysisReport?: Statistic;
}
