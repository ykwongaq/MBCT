from enum import Enum


class DepthModelName(str, Enum):
    """Enum for available depth estimation model names."""

    DEPTH_ANYTHING_V2 = "depth_anything_v2"
    DEPTH_ANYTHING_V2_VKITTI = "depth_anything_v2_vkitti"
