import numpy as np
import torch

from ..utils.logger import get_logger
from .metric_depth.depth_anything_v2.dpt import DepthAnythingV2
from .model_queue import ModelQueue

_logger = get_logger(__name__)


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
        max_depth = 20
        self.input_size = 1036

        device = "cuda" if torch.cuda.is_available() else "cpu"
        model = DepthAnythingV2(**{**model_configs[encoder], "max_depth": max_depth})
        model.load_state_dict(torch.load(checkpoint_path, map_location=device))
        model = model.to(device)
        model.eval()

        self._queue = ModelQueue(model)

        _logger.info(f"Loaded DepthAnythingV2VKittiModel from {checkpoint_path}")

    def infer_image(self, image: np.ndarray) -> np.ndarray:
        with self._queue as model:
            with torch.no_grad():
                depth = model.infer_image(image, input_size=self.input_size)

        torch.cuda.empty_cache()

        return depth
