import cv2
import numpy as np
import torch

from .metric_depth.depth_anything_v2.dpt import DepthAnythingV2


class DepthAnythingV2VKittiModel:
    def __init__(self, checkpoint_path: str):
        model_configs = {
            "vits": {
                "encoder": "vits",
                "features": 64,
                "out_channels": [48, 96, 192, 384],
            },
            "vitb": {
                "encoder": "vitb",
                "features": 128,
                "out_channels": [96, 192, 384, 768],
            },
            "vitl": {
                "encoder": "vitl",
                "features": 256,
                "out_channels": [256, 512, 1024, 1024],
            },
        }

        encoder = "vitl"
        dataset = "vkitti"
        max_depth = 80

        model = DepthAnythingV2(**{**model_configs[encoder], "max_depth": max_depth})
        model.load_state_dict(torch.load(checkpoint_path, map_location="cuda"))
        model.eval()

        self.model = model

    def predict(self, image: np.ndarray) -> np.ndarray:
        pass
