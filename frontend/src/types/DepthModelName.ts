export const DEPTH_MODEL_NAMES = [
	"depth_anything_v2",
	"depth_anything_v2_vkitti",
] as const;

export type DepthModelName = (typeof DEPTH_MODEL_NAMES)[number];
