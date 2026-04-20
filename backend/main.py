import base64
import json
import os

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from server.schemas import DepthEstimationResponse
from server.server import Server
from server.utils.image import read_image_file_to_BGR
from server.utils.logger import get_logger

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(_SCRIPT_DIR, "config.json")

_logger = get_logger(__name__)

with open(config_path, "r") as f:
    config = json.load(f)

_logger.info("Loaded config from %s", config_path)

_server = Server(config)
app = FastAPI(title="CoralSCOP-LAT API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/mbct/depth_estimation", response_model=DepthEstimationResponse)
async def depth_estimation(image: UploadFile = File(...)) -> DepthEstimationResponse:
    # Read the uploaded image file into a numpy array (BGR format)
    image = await read_image_file_to_BGR(image)
    depth_map = _server.predict_depth(image)

    # Encode the float32 depth map as a base64 string
    depth_bytes = depth_map.astype(np.float32).tobytes()
    depth_base64 = base64.b64encode(depth_bytes).decode("utf-8")

    return DepthEstimationResponse(
        depth_base64=depth_base64,
        shape=list(depth_map.shape),
        dtype=str(depth_map.dtype),
    )
