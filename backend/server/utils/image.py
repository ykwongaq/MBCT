import cv2
import numpy as np


async def read_image_file_to_BGR(image_file) -> np.ndarray:
    # Read the uploaded image file into a numpy array (BGR format)
    contents = await image_file.read()
    np_arr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return image
