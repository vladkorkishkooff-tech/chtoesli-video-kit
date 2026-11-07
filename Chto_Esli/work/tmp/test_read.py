import cv2
import numpy as np
import subprocess
import os
import sys
from PIL import Image, ImageDraw, ImageFont

# Set up paths
INP_VIDEO = 'Незаконченные видео/brain100_short_v10.mp4'
OUT_VIDEO = 'work/tmp/brain_dynamic_visual.mp4'

cap = cv2.VideoCapture(INP_VIDEO)
fps = cap.get(cv2.CAP_PROP_FPS)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
print(f"Source video: {fps} fps, {total_frames} frames ({total_frames/fps:.2f}s)")

# Load all frames into RAM or cache them
# 1392 frames of 1080x1920 in memory is ~8 GB uncompressed, so let's read sequentially or keep a reader.
# Since we know exact time ranges for each scene, let's extract them into an array of frames or read on the fly.
# Actually, 1392 frames: we can read sequentially into RAM if needed, but let's test reading by scene.
