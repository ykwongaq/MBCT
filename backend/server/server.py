import numpy as np
from server.models.depth_anything_model import DepthAnythingV2VKittiModel
from server.utils.path import resolve_path


class Server:
    def __init__(self, config):
        self.config = config

        depth_anything_v2_vkitti_path = config["depth_anything_v2_vkitti_path"]
        depth_anything_v2_vkitti_path = resolve_path(depth_anything_v2_vkitti_path)

        self.depth_anything_v2_vkitti_model = DepthAnythingV2VKittiModel(
            depth_anything_v2_vkitti_path
        )

    def predict_depth(self, image: np.ndarray) -> np.ndarray:
        return self.depth_anything_v2_vkitti_model.infer_image(image)
