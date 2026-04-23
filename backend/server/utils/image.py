import io

import numpy as np
from PIL import Image


async def read_image_file_to_BGR(image_file) -> np.ndarray:
    # Read the uploaded image file into a numpy array (BGR format)
    contents = await image_file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    image = np.array(image)
    return image
