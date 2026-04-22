from typing import Dict, List

import cv2
import numpy as np
from server.analysis.analysis import Analysis
from server.models.depth_anything_model import DepthAnythingV2VKittiModel
from server.utils.logger import get_logger
from server.utils.path import resolve_path

_logger = get_logger(__name__)


class Server:
    def __init__(self, config: Dict):
        self.config = config

        depth_anything_v2_vkitti_path = config["depth_anything_v2_vkitti_path"]
        depth_anything_v2_vkitti_path = resolve_path(depth_anything_v2_vkitti_path)

        self.depth_anything_v2_vkitti_model = DepthAnythingV2VKittiModel(
            depth_anything_v2_vkitti_path
        )

        self.analysis = Analysis()

    def normalize(self, depth_map: np.ndarray) -> np.ndarray:
        """Normalize the depth map to the range [0, 1]."""
        min_val = np.min(depth_map)
        max_val = np.max(depth_map)
        if max_val - min_val == 0:
            return np.zeros_like(depth_map)
        normalized = (depth_map - min_val) / (max_val - min_val + 1e-8)
        return normalized

    def predict_depth(self, image: np.ndarray) -> np.ndarray:
        return self.depth_anything_v2_vkitti_model.infer_image(image)

    def analyze_complexity(
        self, depth_map: np.ndarray, reference_points: List[Dict[str, float]]
    ) -> tuple:
        # Placeholder implementation - replace with actual analysis logic
        normalized_depth_map = self.normalize(depth_map)
        rugosity = self.analysis.cal_gradient_rugosity(
            normalized_depth_map, kernal_size=147
        )
        fractal_dimension = self.analysis.cal_fractal_dimension(normalized_depth_map)

        # If the reference points are provided, rescale the normalized depth map to the actual depth values and calculate colony height
        # OR else, return None
        if len(reference_points) > 0:
            _, _, colony_height = self.analysis.cal_height_range(
                normalized_depth_map, reference_points
            )
        else:
            colony_height = None
        return rugosity, fractal_dimension, colony_height
