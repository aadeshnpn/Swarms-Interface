from .agent import HubAgent
from .stateMachine.StateMachine import StateMachine
from .stateMachine.state import State
from enum import Enum
import numpy as np

from .debug import *
def distance(a,b):
    a[0] = (float)(a[0])
    a[1] = (float)(a[1])
    b[0] = (float)(b[0])
    b[1] = (float)(b[1])
    return np.sqrt((b[0]-a[0])**2 + (b[1]-a[1])**2)
uavInput = Enum('uavInput', 'targetFound targetLost reachedRallyPoint refueled refuelRequired')
class UAV(HubAgent):
    def getUiRepresentation(self):
        return {
            # these names should match the state.name property for each state
            "states": ["UAV_Searching"],
            "transitions": {"UAV_Searching" : []}
        }

    def to_json(self):
        return super().to_json()

    def act(self):
        super().act()

    def __init__(self, environment, agentId, initialstate, hub, params, count=1000):
        super().__init__(environment, agentId, initialstate, params, hub)

        #self.live = True
        self.counter = 100

        self.param_time_stamp = 0
        self.velocity = self.parameters["Velocity"] * .95

        self.attractor = None
        self.attracted = None

        self.repulsor = None
        self.ignore_repulsor = None

        self.patrolPointA = None
        self.patrolPointB = None

        self.patrol_rect = None

        #UAV_Patrolling
        self.transitionTable = {(UAV_Searching(self).__class__, uavInput.targetFound): [None, UAV_Tracking(self)],
            (UAV_Tracking(self).__class__, uavInput.targetLost): [None, UAV_Searching(self)],
            (UAV_MovingToRally(self).__class__, uavInput.targetFound): [None, UAV_Tracking(self)],
            (UAV_MovingToRally(self).__class__, uavInput.reachedRallyPoint): [None, UAV_Patrolling(self)],
            #(UAV_Refueling(self).__class__, uavInput.refueled): [self.refuelToPatrolTransition, UAV_Patrolling(self)],
            #(UAV_Patrolling(self).__class__, uavInput.refuelRequired): [self.patrolToRefuelTransition, UAV_Refueling(self)]
            (UAV_Refueling(self).__class__, uavInput.refueled): [self.refuelToPatrolTransition, UAV_Patrolling_Rect(self)],
            (UAV_Patrolling_Rect(self).__class__, uavInput.refuelRequired): [self.patrolToRefuelTransition, UAV_Refueling(self)]

            #self.patrol_route = self.environment.hubController.checkOutPatrolRoute(self)
        }

    def patrolToRefuelTransition(self):
        self.counter = 500 * int(self.id) + 100

    def refuelToPatrolTransition(self):
        self.counter = 1000* int(self.id) + 1000
        #eprint('austin')
        self.patrol_rect = self.environment.hubController.checkOutPatrolRect(self)
        #self.patrol_route = self.environment.hubController.checkOutPatrolRoute(self)
        #self.patrolPointA = [patrol_route["x0"], patrol_route["y0"]]
        #self.patrolPointB = [patrol_route["x1"], patrol_route["y1"]]

class UAV_Refueling(State):
    def __init__(self, agent=None):
        self.name = "resting"

    def sense(self, agent, environment):
        pass

    #TODO: more sophisticated representation of fuel
    def act(self, agent):
        if agent.inHub:
            agent.velocity = 0
            agent.counter -= 1
        else:
            # if not at hub, move towards it
            agent.move(agent.hub)
            if ((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2)**.5 <= 1:
                agent.velocity = 0
                agent.environment.hubController.checkInPatrolRect(agent)
                #agent.environment.hubController.checkInPatrolRoute(agent)
                agent.inHub = True

    def update(self, agent):
        if agent.counter < 1 and agent.environment.hubController.isCheckOutNeeded():
            agent.velocity = agent.parameters["Velocity"]
            return uavInput.refueled

class UAV_Searching(State):
    def __init__(self, agent=None):
        self.name = "UAV_Searching"
        self.inputExplore = False
        #eprint("UAV_Searching init()")

    def sense(self, agent, environment):
        #eprint("UAV_Searching sense()")
        agent.neighbors.clear()
        for other_key in environment.agents.keys():
            other = environment.agents[other_key]
            if(distance(agent.location, other.location) < 50 and agent != other):
                agent.neighbors.append(other)
        for neighbor in agent.neighbors:
            pass
            #eprint(str(neighbor.location[0]) + " " + str(neighbor.location[1]))
    def act(self, agent):
        '''
        if(len(agent.neighbors) > 0):
            for neighbor in agent.neighbors:
                if(neighbor.__class__.__name__ != "UAV"):

            other_loc = agent.neighbors[0].location
            this_loc = agent.location
            agent.direction = np.arctan2(other_loc[1] - this_loc[1], other_loc[0] - this_loc[0]) + np.pi/4
        else:
        '''
        agent.direction = np.random.normal(loc = agent.direction, scale = .3)
        #eprint("UAV act()")

    def update(self, agent):
        if(len(agent.neighbors) > 0):
            for neighbor in agent.neighbors:
                if(neighbor.__class__.__name__ != "UAV"):
                    return uavInput.targetFound
        return None

class UAV_Tracking(State):
    def __init__(self, agent=None):
        self.name = "UAV_Tracking"
        self.inputExplore = False
        #eprint("UAV_Searching init()")

    def sense(self, agent, environment):
        #eprint("UAV_Searching sense()")
        agent.neighbors.clear()
        for other_key in environment.agents.keys():
            other = environment.agents[other_key]
            if(distance(agent.location, other.location) < 50 and agent != other):
                agent.neighbors.append(other)
        for neighbor in agent.neighbors:
            pass
            #eprint(str(neighbor.location[0]) + " " + str(neighbor.location[1]))
    def act(self, agent):
        if(len(agent.neighbors) == 0):
            return
        other_loc = agent.neighbors[0].location
        this_loc = agent.location
        agent.direction = np.arctan2(other_loc[1] - this_loc[1], other_loc[0] - this_loc[0]) + np.pi/4

    def update(self, agent):
        if(len(agent.neighbors) > 0):
            for neighbor in agent.neighbors:
                if(neighbor.__class__.__name__ != "UAV"):
                    return None
        return uavInput.targetLost

class UAV_MovingToRally(State):
    def __init__(self, agent=None):
        self.name = "UAV_Tracking"
        self.inputExplore = False
        self.rallyPoint = [-400,400]
        #eprint("UAV_Searching init()")

    def sense(self, agent, environment):
        #eprint("UAV_Searching sense()")
        agent.neighbors.clear()
        for other_key in environment.agents.keys():
            other = environment.agents[other_key]
            if(distance(agent.location, other.location) < 50 and agent != other):
                agent.neighbors.append(other)
        for neighbor in agent.neighbors:
            pass
            #eprint(str(neighbor.location[0]) + " " + str(neighbor.location[1]))
    def act(self, agent):
        other_loc = self.rallyPoint
        this_loc = agent.location
        agent.direction = np.arctan2(other_loc[1] - this_loc[1], other_loc[0] - this_loc[0])

    def update(self, agent):
        if(distance(agent.location, self.rallyPoint) < 10):
            return uavInput.reachedRallyPoint
        if(len(agent.neighbors) > 0):
            for neighbor in agent.neighbors:
                if(neighbor.__class__.__name__ != "UAV"):
                    return uavInput.targetFound
        return None

from sympy.geometry import *
class UAV_Patrolling_Rect(State):
    def __init__(self, rect = None, agent = None):
        self.name = self.__class__.__name__
        self.rect = Polygon(Point2D(100, -400),Point2D(100,100),Point2D(300,100),Point2D(300,-400))
        self.waypoint = [self.rect.vertices[0][0], self.rect.vertices[0][1]]
        #eprint(self.rect.bounds)


    def sense(self, agent, environment):
        agent.neighbors.clear()
        for other_key in environment.agents.keys():
            other = environment.agents[other_key]
            if(distance(agent.location, other.location) < 50 and agent != other):
                agent.neighbors.append(other)
        #eprint(agent.neighbors)

    def act(self, agent):
        agent.counter -= 1
        agent.inHub = False

        if(distance(agent.location, self.waypoint) < 1):
            new_waypoint = [None,None]
            if(self.waypoint[0] == self.rect.bounds[0]):
                new_waypoint[0] = self.rect.bounds[2]
            else:
                new_waypoint[0] = self.rect.bounds[0]
            agent.direction %= 2*np.pi
            eprint(self.rect.bounds)
            if((self.waypoint[1] < self.rect.bounds[1] and np.pi < agent.direction) or (self.waypoint[1] > self.rect.bounds[3] and np.pi > agent.direction)):
                agent.direction *= -1

            agent.direction %= 2*np.pi
            if(np.pi > agent.direction and agent.direction > 0):
                new_waypoint[1] = self.waypoint[1] + 25
            else:
                new_waypoint[1] = self.waypoint[1] - 25
            #eprint(new_waypoint)
            self.waypoint = new_waypoint
        else:
            agent.steerTowardsPoint(self.waypoint)

        for n in agent.neighbors:
            if(n.__class__.__name__ == "Evader"):
                n.caught()

        for neighbor in agent.neighbors: #of course, this could use improvement. A malicious UAV could broadcast - hey. I've been out the longest. Follow me! - and lead the other UAVS astray
            if(neighbor.state.__class__.__name__ == agent.state.__class__.__name__ and neighbor.id < agent.id):
                self.waypoint[0] = neighbor.state.waypoint[0]
                self.waypoint[1] = neighbor.state.waypoint[1]
                self.waypoint[1] += 50
                break

        eprint(self.waypoint)

        #else:
        #    agent.velocity = 0.0
    def update(self, agent):
        return None


class UAV_Patrolling(State):
    def __init__(self, agent=None):
    #TODO: self.name not necessary - we may use .__class__.__name__ instead
        self.name = "UAV_Patrolling"
        self.inputExplore = False
        self.target = None
        self.waypoint_index = 0
        self.forward = True
        self.dispersing = False
        #eprint("UAV_Searching init()")

    def sense(self, agent, environment):
        #eprint("UAV_Searching sense()")
        agent.neighbors.clear()
        for other_key in environment.agents.keys():
            other = environment.agents[other_key]
            if(distance(agent.location, other.location) < 50 and agent != other):
                agent.neighbors.append(other)
        for neighbor in agent.neighbors:
            pass
            #eprint(str(neighbor.location[0]) + " " + str(neighbor.location[1]))

    def reverse(self, agent):
        self.forward = not self.forward
        if(self.forward is True):
            self.waypoint_index += 1
        else:
            self.waypoint_index -= 1
        self.waypoint_index = np.clip(self.waypoint_index, 0,  len(agent.patrol_route["x"])-1)

    def act(self, agent):
        agent.counter -= 1
        agent.inHub = False

        destination = [agent.patrol_route["x"][self.waypoint_index], agent.patrol_route["y"][self.waypoint_index]]

        for n in agent.neighbors:
            if(n.__class__.__name__ == "Evader"):
                n.caught()
            elif(n.state.__class__.__name__ == "UAV_Patrolling" and agent.id < n.id):
                #other_destination = [n.patrol_route["x"][n.state.waypoint_index], n.patrol_route["y"][n.state.waypoint_index]]
                #else:
                if(self.forward is not n.state.forward and distance(agent.location, destination) >= distance(destination, n.location)):
                    '''
                    eprint("Las chicas no me dehan solo... heh heh heh")
                    eprint(agent.patrol_route)
                    eprint(n.patrol_route)
                    eprint(str(self.waypoint_index))
                    eprint(str(n.state.waypoint_index))
                    '''
                    self.reverse(agent)
                    n.state.reverse(n)
                    '''
                    eprint("agent #" +str(agent.id) + ": " + str(self.forward) +" , "+ str(np.array([agent.patrol_route["x"][self.waypoint_index],agent.patrol_route["y"][self.waypoint_index]])))
                    eprint("agent #" +str(n.id) + ": " + str(n.state.forward) +" , "+str(np.array([n.patrol_route["x"][n.state.waypoint_index],n.patrol_route["y"][n.state.waypoint_index]])))
                    eprint(str(self.waypoint_index))
                    eprint(str(n.state.waypoint_index))
                    eprint(str(agent.direction))
                    eprint(str(n.direction))
                    '''
        destination = [agent.patrol_route["x"][self.waypoint_index], agent.patrol_route["y"][self.waypoint_index]]



        agent.steerTowardsPoint(destination)
        if(distance(agent.location, destination) < 10):
            if(self.waypoint_index == 0):
                self.forward = True
            elif(self.waypoint_index == len(agent.patrol_route["x"]) - 1):
                self.forward = False

            if(self.forward is True):
                self.waypoint_index += 1
            else:
                self.waypoint_index -= 1





            '''
            if(n.__class__.__name__ == "UAV" and n.id > agent.id):
                self.forward = not self.forward
                if(self.forward is True):
                    self.waypoint_index += 1
                else:
                    self.waypoint_index -= 1

                self.waypoint_index = np.clip(self.waypoint_index, 0,  len(agent.patrol_route["x"])-1)

                if(n.state.__class__.__name__ == "UAV_Patrolling" and n.state.forward is not self.forward and distance(destination, n.location) < distance(destination, agent.location)):
                    n.state.forward = not n.state.forward
                    if(n.state.forward is True):
                        n.state.waypoint_index += 1
                    else:
                        n.state.waypoint_index -= 1
                    n.state.waypoint_index = np.clip(self.waypoint_index, 0,  len(agent.patrol_route["x"])-1)
                break
            '''

        '''
        for n in agent.neighbors:
            if(n.__class__.__name__ == "UAV" and distance(n.location, agent.location) < 2 and np.random.random() > .5):
                self.forward = not self.forward
                if(self.forward is True):
                    self.waypoint_index += 1
                else:
                    self.waypoint_index -= 1
                self.waypoint_index %= len(agent.patrol_route["x"])-1 # = np.clip(self.waypoint_index, 0,  len(agent.patrol_route["x"])-1)
                #agent.velocity *= .999
        '''

        '''
        num_uav_neighbors = 0
        average_pos = [0,0]
        for n in agent.neighbors:
            if(n.__class__.__name__ == "UAV" and distance(n.location, agent.location) < 1 ):
                average_pos[0] += n.location[0]
                average_pos[1] += n.location[1]
                num_uav_neighbors += 1
        if(num_uav_neighbors != 0):
            average_pos[0]/=num_uav_neighbors
            average_pos[1]/=num_uav_neighbors
            agent.steerTowardsPoint(average_pos)
            agent.direction *= -1

            self.forward = not self.forward
            if(self.waypoint_index != 0 and self.waypoint_index != len(agent.patrol_route["x"]) - 1):
                if(self.forward is True):
                    self.waypoint_index += 1
                else:
                    self.waypoint_index -= 1
                agent.direction = np.random.normal(agent.direction)
                self.dispersing = True
        '''

        '''
        if(distance(agent.location, self.beginning) < 10):
            other_loc = self.end
            this_loc = agent.location
            agent.direction = np.arctan2(other_loc[1] - this_loc[1], other_loc[0] - this_loc[0])
            self.target = self.end
        elif(distance(agent.location, self.end) < 10):
            other_loc = self.beginning
            this_loc = agent.location
            agent.direction = np.arctan2(other_loc[1] - this_loc[1], other_loc[0] - this_loc[0])
            self.target = self.beginning
        elif(self.target is not None):
            other_loc = self.target
            this_loc = agent.location
            agent.direction = np.arctan2(other_loc[1] - this_loc[1], other_loc[0] - this_loc[0])
        else:
            self.target = self.beginning
        '''
    def update(self, agent):
        if agent.counter < 1:
            return uavInput.refuelRequired
        return None
