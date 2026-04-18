import json
import os

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from server.server import Server
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


@app.get("/api/mbct/depth_estimation")
async def depth_estimation(image: UploadFile = File(...)):
    pass
