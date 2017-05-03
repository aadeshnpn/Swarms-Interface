class Attractor:
    def __init__(self, point, radius):
        self.point = point
        self.time_ticks = 10000
        self.radius = radius #?
        #we need a new radius property -done
        #find the hard coded 40 in python to replace it with the variable/property we just made -is that the array in environment.py?


    def toJson(self): #this is the info that pases the x, y and timer to js
        dict = {}
        dict['x'], dict['y'] = self.point
        dict['timer'] = self.time_ticks
        dict['radius'] = self.radius
        return dict
        #add dynamic radius you just made to dictionary -done
class Repulsor:
    def __init__(self, point, radius):
        self.point = point
        self.time_ticks = 10000

    def toJson(self):
        dict = {}
        dict['x'], dict['y'] = self.point
        dict['timer'] = self.time_ticks
        return dict
