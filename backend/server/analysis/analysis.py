import logging
import math
import multiprocessing as mp
from typing import Dict, List

import cv2
import matplotlib.pyplot as plt
import numpy as np

from ..utils.logger import get_logger

_logger = get_logger(__name__)


class Analysis:
    def __init__(
        self,
        num_scales=8,
        L=1,
    ):
        self.num_scales = num_scales
        self.L = L
        self.scales = [1 / 2**i for i in range(num_scales)]
        self.L0 = np.min(self.scales)

    def cal_height_range(
        self,
        depth_map: np.ndarray,
        real_distance: List[Dict],
        filter_map: np.ndarray = None,
    ):
        """
        Calculate the height range of a depth map in real-world units.

        Parameters:
        - depth_map (np.ndarray): Input depth map as a numpy array.
        - real_distance (List[Dict]): List of dictionaries containing real distance of pixel.
            {
                "x": int,
                "y": int,
                "distance": float
            }
        - filter_map (np.ndarray): Optional boolean mask to filter valid pixels.
        """
        # --- Step 1: Gather calibration data ---
        calib_depths = []
        calib_reals = []
        for point in real_distance:
            x, y, d = point["x"], point["y"], point["distance"]
            if 0 <= y < depth_map.shape[0] and 0 <= x < depth_map.shape[1]:
                calib_depths.append(depth_map[y, x])
                calib_reals.append(d)

        if len(calib_depths) < 2:
            raise ValueError(
                "Need at least two real-distance calibration points to map depth values."
            )

        calib_depths = np.array(calib_depths)
        calib_reals = np.array(calib_reals)

        # --- Step 2: Fit linear mapping: real_distance = a * depth_value + b ---
        A = np.vstack([calib_depths, np.ones_like(calib_depths)]).T
        a, b = np.linalg.lstsq(A, calib_reals, rcond=None)[0]

        # --- Step 3: Apply optional filter ---
        if filter_map is not None:
            valid_pixels = depth_map[filter_map]
        else:
            valid_pixels = depth_map.flatten()

        # --- Step 4: Compute real-world min/max based on fitted model ---
        real_min = a * np.min(valid_pixels) + b
        real_max = a * np.max(valid_pixels) + b
        height_range = abs(real_max - real_min)

        return float(real_min), float(real_max), float(height_range)

    def cal_fractal_dimension(
        self, depth: np.ndarray, filter_map: np.ndarray = None
    ) -> float:
        """
        Calculate the fractal dimension of a depth map.

        Parameters:
        - depth (np.ndarray): Input depth map as a numpy array.

        Returns:
        - fractal_dimension (float): Fractal dimension of the depth map.
        """
        mean_height_ranges_by_scales = self.cal_mean_heigh_range_by_scale(
            depth, filter_map
        )
        fractal_dimension = self.cal_fractial_dimension_(mean_height_ranges_by_scales)

        if fractal_dimension is None:
            return None

        return fractal_dimension.item()

    def generate_sobel_filter(self, size):
        """
        Generate Sobel filters for a given odd size.

        Parameters:
            size (int): The size of the Sobel filter (must be an odd number).

        Returns:
            sobel_x (ndarray): The Sobel filter for detecting horizontal gradients.
            sobel_y (ndarray): The Sobel filter for detecting vertical gradients.
        """
        if size % 2 == 0:
            raise ValueError("Size must be an odd number.")

        # Compute the range of values for the filter
        range_vals = np.arange(-(size // 2), size // 2 + 1)

        # Horizontal Sobel filter (Sobel X)
        sobel_x = np.zeros((size, size), dtype=int)
        for i, row in enumerate(range_vals):
            sobel_x[i, :] = row

        # Vertical Sobel filter (Sobel Y)
        sobel_y = sobel_x.T  # Transpose of Sobel X

        return sobel_x, sobel_y

    def cal_gradient_rugosity(
        self, depth: np.ndarray, filter_map: np.ndarray = None, kernal_size: int = 33
    ) -> float:

        sobel_x, sobel_y = self.generate_sobel_filter(kernal_size)
        grad_x = cv2.filter2D(depth, -1, sobel_x)
        grad_y = cv2.filter2D(depth, -1, sobel_y)
        grad = np.sqrt(grad_x**2 + grad_y**2)

        if filter_map is not None:
            grad = grad[filter_map]

            if len(grad) == 0:
                return None

        # gradient rugosity is the sum of gradient devided by the number of pixels
        return np.mean(grad) / (kernal_size**2)

    def cal_height_range_internal(
        self, depth: np.ndarray, filter_map: np.ndarray = None
    ) -> float:
        """
        Calculate the height range of a depth map.
        Ignore the filter map.
        """
        if filter_map is not None:
            depth = depth[filter_map]

        if len(depth) == 0:
            return None

        return (np.max(depth) - np.min(depth)).item()

    def cal_mean_heigh_range_by_scale(
        self, depth: np.ndarray, filter_map: np.ndarray = None
    ) -> Dict:
        """
        Calculate the height range for each grid cell at different scales.

        Return:
        Dictionary where the key is the scale and the grid cell coordinates.
        Value is the height range of that grid cell.
        """

        mean_height_ranges_by_scale = {}
        for scale in self.scales:
            grid_coordinates = self.split_image_to_grid(depth, scale)
            height_ranges = []
            for grid in grid_coordinates:
                top_left_row, top_left_col, bottom_right_row, bottom_right_col = grid
                depth_map_region = depth[
                    top_left_row:bottom_right_row, top_left_col:bottom_right_col
                ]

                if filter_map is not None:
                    filter_map_region = filter_map[
                        top_left_row:bottom_right_row, top_left_col:bottom_right_col
                    ]
                    height_range = self.cal_height_range_internal(
                        depth_map_region, filter_map_region
                    )
                else:
                    height_range = self.cal_height_range_internal(depth_map_region)
                height_ranges.append(height_range)

            # Filter out the None values
            height_ranges = [
                x
                for x in height_ranges
                if x is not None and not math.isnan(x) and math.isfinite(x)
            ]
            height_ranges = [x + 1e-6 for x in height_ranges]
            if len(height_ranges) == 0:
                mean_height_range = None
            else:
                mean_height_range = np.mean(np.log(height_ranges))
            mean_height_ranges_by_scale[np.log(self.L * scale)] = mean_height_range

        return mean_height_ranges_by_scale

    def cal_fractial_dimension_(self, mean_height_ranges_by_scales: Dict) -> float:

        scales = list(mean_height_ranges_by_scales.keys())
        mean_height_ranges = list(mean_height_ranges_by_scales.values())

        slope, _ = np.polyfit(scales, mean_height_ranges, 1)
        return 3 - slope

    def split_image_to_grid(self, depth: np.ndarray, scale: float):
        """
        Split the input image into grid cells.

        Parameters:
        - depth (np.ndarray): Input image as a numpy array.
        - scale (float): Scale factor to define the number of regions.
                         For example, 0.5 splits into 2x2 regions, 0.25 splits into 4x4 regions, etc.

        Returns:
        - grid_cells (list): A list of numpy arrays, where each numpy array represents a grid cell.
        """
        image_height, image_width = depth.shape

        num_rows = int(1 / scale)
        num_cols = int(1 / scale)

        if num_rows == 0 or num_cols == 0:
            raise ValueError(
                "Scale is too large for the given image dimensions. Try to set a lower number of scales."
            )

        # Calculate the size of each grid cell
        row_sizes = [image_height // num_rows] * num_rows
        col_sizes = [image_width // num_cols] * num_cols

        # Distribute the remainder to ensure full coverage
        for i in range(image_height % num_rows):
            row_sizes[i] += 1
        for j in range(image_width % num_cols):
            col_sizes[j] += 1

        # Generate the grid coorindates
        grid_coordinates = []
        row_start = 0
        for row_size in row_sizes:
            col_start = 0
            for col_size in col_sizes:
                top_left_row = row_start
                top_left_col = col_start
                bottom_right_row = row_start + row_size
                bottom_right_col = col_start + col_size
                grid_coordinates.append(
                    (top_left_row, top_left_col, bottom_right_row, bottom_right_col)
                )
                col_start += col_size
            row_start += row_size
        return grid_coordinates
        return grid_coordinates
