import cv2
import svgwrite
import os
import numpy as np

# Input and output paths
input_path = "X.png"
output_path = "logo.svg"
png_transparent_path = "logo.png"

# Read image using OpenCV
img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)

# Create a transparent PNG first just in case
if img.shape[2] == 4:
    # already has alpha
    img_gray = cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY)
    alpha = img[:, :, 3]
else:
    img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # create alpha channel (make white pixels transparent)
    # Threshold: pixels > 240 in grayscale become transparent
    _, mask = cv2.threshold(img_gray, 240, 255, cv2.THRESH_BINARY_INV)
    b, g, r = cv2.split(img)
    img_rgba = cv2.merge((b, g, r, mask))
    cv2.imwrite(png_transparent_path, img_rgba)

# Now Vectorize using contours
# Threshold for vectorization
_, binary = cv2.threshold(img_gray, 200, 255, cv2.THRESH_BINARY_INV)

# Find contours
contours, hierarchy = cv2.findContours(binary, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

# Get image dimensions
height, width = binary.shape

# Initialize SVG drawing
dwg = svgwrite.Drawing(output_path, size=(f"{width}px", f"{height}px"), profile='tiny')

# We need to map OpenCV contours to SVG paths.
# OpenCV returns a list of points for each contour.
def contour_to_svg_path(contour):
    if len(contour) == 0:
        return ""
    # start point
    path = f"M {contour[0][0][0]},{contour[0][0][1]} "
    # line to other points
    for pt in contour[1:]:
        path += f"L {pt[0][0]},{pt[0][1]} "
    path += "Z" # close path
    return path

# Add paths to SVG
for i, contour in enumerate(contours):
    # Depending on hierarchy, we can determine if it's a hole or solid, but for a dark logo on white, 
    # filling all contours and relying on fill-rule=evenodd or simply drawing works reasonably well.
    # We will just fill them with black or brand color.
    path_data = contour_to_svg_path(contour)
    if path_data:
        # We will use white for the dark mode theme
        dwg.add(dwg.path(d=path_data, fill="#FFFFFF"))

dwg.save()
print("Vectorization complete.")
