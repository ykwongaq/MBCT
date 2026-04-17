import type { BBox } from "./BBox";
import type { Image } from "./Image";

export interface Data {
	image: Image;
	bbox?: BBox;
	id: number;
}
