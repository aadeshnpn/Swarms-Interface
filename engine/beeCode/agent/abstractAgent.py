import warnings
from enum import Enum
import numpy as np
from .stateMachine.StateMachine import StateMachine
from .stateMachine.state import State
from .debug import *
from abc import abstractmethod

uavInput = Enum('uavInput', 'targetFound targetLost reachedRallyPoint refueled')
#safe_angle returns the angle needed to be added to a to get b
def safe_angle(a, b):
    angle = np.arctan2(b[1], b[0]) - np.arctan2(a[1], a[0])
    while angle > np.pi:
        angle -= 2 * np.pi
    while angle < -np.pi:
        angle += 2 * np.pi
    return angle

def distance(a,b):
	return np.sqrt((b[0]-a[0])**2 + (b[1]-a[1])**2)

#doesn't implement getUiRepresentation, therefore is also abstract
class Agent(StateMachine): #we could use even more abstract classes... hub Agent
    #and non hub agent
    def __init__(self, environment, agentId, initialstate, params):#, uiRepresentation):
        self.environment = environment
        self.id = agentId
        self.state = initialstate
        self.live = True

        self.location = [0, 0]#[hub["x"], hub["y"]]
        self.direction = 2*np.pi*np.random.random()  # should be initialized? potentially random?
        self.parameters = params
        # This time-stamp should be updated whenever the bee receives new parameters

        self.neighbors = []

    #TODO: Change to to_dict instead? this isn't json
    @abstractmethod
    def to_json(self):
        agent_dict = {}
        agent_dict["x"] = self.location[0]
        agent_dict["y"] = self.location[1]
        #agent_dict["dPos"] = self.locationsVisited
        agent_dict["id"] = self.id
        agent_dict["state"] = self.state.name
        agent_dict["direction"] = self.direction
        agent_dict["live"] = self.live
        return agent_dict

    @property
    def direction(self):
        return self.__direction

    @direction.setter
    def direction(self, value):
        self.__direction = value
        #self.environment.actions["turns"] += 1

    def sense(self, environment):
        self.state.sense(self, environment)

    def act(self):
        self.state.act(self)

    def move(self, destination):
        dx = destination[0] - self.location[0]
        dy = destination[1] - self.location[1]
        self.direction = np.arctan2(dy, dx)

    def update(self, environment):
        #eprint(self.state.__class__.__name__)
        self.nextState(self.state.update(self))

    def wander(self, place, radius):
        if ((place[0] - self.location[0]) ** 2 + (place[1] - self.location[1]) ** 2)**.5 >= radius:
            dx = place[0] - self.location[0]
            dy = place[1] - self.location[1]
            self.direction = np.arctan2(dy, dx)
        else:
            delta_d = np.random.normal(0, .3)
            self.direction = (self.direction + delta_d) % (2 * np.pi)

    def steerTowardsPoint(self, destination):
        #eprint(destination)
        self.direction = np.arctan2((float)(destination[1]) - (float)(self.location[1]), (float)(destination[0]) - (float)(self.location[0]))

class HubAgent(Agent):
    def __init__(self, environment, agentId, initialState, params, hub):
        super().__init__(environment,agentId, initialState, params)
        self.hub = [hub["x"], hub["y"]]
        self.hubRadius = hub["radius"]
        self.inHub = True

        #hub agent can interface with attractor / repulsor
        self.attractor = None
        self.attracted = None

        self.repulsor = None
        self.ignore_repulsor = None

    def isAttracted(self):
        if(self.attracted is True):
            return True
        return False
    def isInRangeOfNearestAttractor(self):
        #assert(self.attractor is not None)

        return distance(self.attractor.point, self.location) < self.attractor.radius

    def isInfluencedByNearestAttractor(self):
        return self.isAttracted() and self.isInRangeOfNearestAttractor()

    #if(agent.attractor is not None and distance(agent.attractor.point, agent.location) < agent.attractor.radius and agent.attracted is True):
    def orientTowardsNearestAttractor(self):
        #assert(self.attractor is not None)
        angle = safe_angle((np.cos(self.direction),np.sin(self.direction)), (self.attractor.x-self.location[0],self.attractor.y-self.location[1]))
        angle = np.clip(angle, -np.pi/16, np.pi/16)
        error = np.random.normal(0, .3)
        self.direction += angle + error
        self.direction = self.direction % (2 *np.pi)

    #elif(agent.repulsor is not None and distance(agent.repulsor.point, agent.location) < agent.repulsor.radius and agent.ignore_repulsor is False):
    def isRepulsed(self):
        if(self.ignore_repulsor is False): #yeah ignore_repulsor should be "repulsed" or something affirmative instead of negative
            return True

    def isInRangeOfNearestRepulsor(self):
        assert(self.repulsor is not None)

        return distance(self.repulsor.point, self.location) < self.repulsor.radius

    def isRepulsedByNearestRepulsor(self):
        return self.isRepulsed() and self.isInRangeOfNearestRepulsor()

    def avoidNearestRepulsor(self):
        #assert(self.repulsor is not None)
        angle = - safe_angle((np.cos(self.direction),np.sin(self.direction)), (self.repulsor.x-self.location[0],self.repulsor.y-self.location[1]))
        angle = np.clip(angle, -np.pi/16, np.pi/16)
        if(angle >= 0):
            self.direction += .3
        else:
            self.direction -= .3
        self.direction %= 2 * np.pi

    def senseAndProcessAttractor(self, environment):
        self.attractor = environment.flowController.getAttractor(self.location)
        if(self.attractor is not None and self.attracted is None):
            if(np.random.random () > .2):
                self.attracted = True
            else:
                self.attracted = False

    def senseAndProcessRepulsor(self, environment):
        self.repulsor = environment.flowController.getRepulsor(self.location)
        if(self.repulsor is not None and self.ignore_repulsor is None):
            if(np.random.random() >.9):
                 self.ignore_repulsor = True
            else:
                 self.ignore_repulsor = False

    def checkAgentLeave(self):
        if (((self.hub[0] - self.location[0]) ** 2 + (self.hub[1] - self.location[1]) ** 2) ** .5 > self.hubRadius) \
                        and self.inHub is True:
                if self.environment.hubController.checkOut(self) == 0:
                    self.inHub = False
                    return True
        return False
    def checkAgentReturn(self):
        if (((self.hub[0] - self.location[0]) ** 2 + (self.hub[1] - self.location[1])** 2)** .5 < self.hubRadius):
            if not self.inHub: #if probs check if not agent.goingToSite
                self.environment.hubController.checkIn(self)
                self.inHub = True
                return True
        return False
