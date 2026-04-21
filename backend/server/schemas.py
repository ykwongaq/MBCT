from typing import List

from pydantic import BaseModel


class DepthMap(BaseModel):
    """Model for depth map data."""

    depth_base64: str
    shape: List[int]
    dtype: str


class DepthEstimationResponse(BaseModel):
    """Response model for depth estimation endpoint.

    The depth map is encoded as a base64 string of raw float32 bytes.
    The client should decode the base64 string, convert it to a Float32Array,
    and reshape it according to the provided shape.
    """

    depth_map: DepthMap


class RugosityCalculationRequest(BaseModel):
    """Request model for rugosity calculation endpoint."""

    depth_map: DepthMap
