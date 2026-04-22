from typing import List, Optional

from pydantic import BaseModel


class DepthMap(BaseModel):
    """Model for depth map data."""

    depth_base64: str
    shape: List[int]
    dtype: str


class Point(BaseModel):
    x: int
    y: int


class ReferencePoint(BaseModel):
    point: Point
    distance: float


class DepthEstimationResponse(BaseModel):
    """Response model for depth estimation endpoint.

    The depth map is encoded as a base64 string of raw float32 bytes.
    The client should decode the base64 string, convert it to a Float32Array,
    and reshape it according to the provided shape.
    """

    depth_map: DepthMap


class ComplexityAnalysisRequest(BaseModel):
    """Request model for complexity analysis endpoint."""

    depth_map: DepthMap
    reference_points: List[ReferencePoint]


class ComplexityAnalysisResponse(BaseModel):
    """Response model for complexity analysis endpoint."""

    rugosity: float
    fractal_dimension: float
    colony_height: Optional[float] = None


class EstimateResponse(BaseModel):
    """Response model for the combined estimate endpoint.

    Returns both the depth map and the complexity analysis results
    so the client only needs to make a single request.
    """

    depth_map: DepthMap
    rugosity: float
    fractal_dimension: float
    colony_height: Optional[float] = None
