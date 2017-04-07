class Attractor:
    def __init__(self, point):
        self.point = point
        self.time_ticks = 10000

    def toJson(self):
        dict = {}
        dict['x'], dict['y'] = self.point
        dict['timer'] = self.time_ticks
        return dict

class Repulsor:
    def __init__(self, point):
        self.point = point
        self.time_ticks = 10000

    def toJson(self):
        dict = {}
        dict['x'], dict['y'] = self.point
        dict['timer'] = self.time_ticks
        return dict
