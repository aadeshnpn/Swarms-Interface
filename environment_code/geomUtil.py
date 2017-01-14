import numpy as np
import math

def distance(x1,y1, x2,y2):
	return math.sqrt((x1-x2)**2 + (y1-y2)**2)

def safe_angle(a, b):
    angle = np.arctan2(b[1], b[0]) - np.arctan2(a[1], a[0])
    while angle > np.pi:
        angle -= 2 * np.pi
    while angle < -np.pi:
        angle += 2 * np.pi
    return angle

