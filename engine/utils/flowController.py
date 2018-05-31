import utils.geomUtil as geomUtil
class Attractor:
    def __init__(self, point, radius):
        self.point = point
        self.x = point[0]
        self.y = point[1]
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
        self.x = point[0]
        self.y = point[1]
        self.time_ticks = 10000
        self.radius = radius

    def toJson(self):
        dict = {}
        dict['x'], dict['y'] = self.point
        dict['timer'] = self.time_ticks
        dict['radius'] = self.radius
        return dict

class FlowController:
    def __init__(self):
        self.attractors = []
        self.repulsors = []
        self.clear()

    def clear(self):
        self.attractors.clear()
        self.repulsors.clear()

    def newAttractor(self, json):
        self.attractors.append(Attractor((json['x'], json['y']), json['radius']))

    def newRepulsor(self, json):
        self.repulsors.append(Repulsor((json['x'], json['y']), json['radius']))

    # def newRepulors(self,avoidList):
    #     for avoid in avoidList:
    #         self.repulsors.append(Repulsor((avoid['x'], avoid['y']), avoid['radius']))


    def getClosestFlowController(self, flowControllers, agent_location):
        if (len(flowControllers) == 0):
            raise ValueError('flowControllers list must not be empty.')
        closest = flowControllers[0]
        for flowController in flowControllers:
            if (geomUtil.point_distance(agent_location, flowController.point) < geomUtil.point_distance(agent_location,
                                                                                                        closest.point)):
                closest = flowController
        return closest

    def getAttractor(self, agent_location):
        if (len(self.attractors) > 0):
            return self.getClosestFlowController(self.attractors, agent_location)
        else:
            return None

    def getRepulsor(self, agent_location):
        if (len(self.repulsors) > 0):
            return self.getClosestFlowController(self.repulsors, agent_location)
        else:
            return None

    def updateFlowControllers(self):
        new_attractor_list = []

        for attractor in self.attractors:
            attractor.time_ticks -= 1
            if (attractor.time_ticks > 0):
                new_attractor_list.append(attractor)
        self.attractors = new_attractor_list

        new_repulsor_list = []

        for repulsor in self.repulsors:
            repulsor.time_ticks -= 1
            if (repulsor.time_ticks > 0):
                new_repulsor_list.append(repulsor)
        self.repulsors = new_repulsor_list
