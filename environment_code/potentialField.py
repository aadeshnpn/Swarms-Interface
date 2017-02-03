import numpy as np
import math

class PotentialField:

    def __init__(self, location, null_radius, spread, strength, type='replusor'):
        self.location = location
        self.radius = null_radius
        self.spread = spread
        self.type = type
        self.field_strength = strength

    def distance(self, p1, p2):
        return np.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)

    def effect(self, location):
        if self.type == 'replusor':
            d = self.distance(location, self.location)
            if d > self.radius + self.spread:
                return [0, 0]
            theta = math.atan2(self.location[1] - location[1], self.location[0] - location[0])
            if d > self.radius:
                return [-self.field_strength*(self.spread + self.radius - d)*math.cos(theta),
                        -self.field_strength * (self.spread + self.radius - d) * math.sin(theta)]
            else:
                infinity = 5
                return [-np.sign(math.cos(theta))*infinity, -np.sign(math.sin(theta))*infinity]
        elif self.type == 'tangent':
            d = self.distance(location, self.location)
            if d > self.radius + self.spread:
                return [0, 0]
            theta = math.atan2(self.location[1] - location[1], self.location[0] - location[0]) + 90
            if d > self.radius:
                return [-self.field_strength * (self.spread + self.radius - d) * math.cos(theta),
                        -self.field_strength * (self.spread + self.radius - d) * math.sin(theta)]
            else:
                infinity = 5
                return [-np.sign(math.cos(theta)) * infinity, -np.sign(math.sin(theta)) * infinity]