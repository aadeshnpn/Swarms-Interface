from .agent import HubAgent
from .stateMachine.StateMachine import StateMachine
from .stateMachine.state import State
from enum import Enum
import numpy as np
from ..pheromoneMap import PheromoneMap
import time
from .debug import *
import logging
def distance(a,b):
    c = [0.0,0.0]
    a[0] = (float)(a[0])
    a[1] = (float)(a[1])
    c[0] = (float)(b[0])
    c[1] = (float)(b[1])
    return np.sqrt((c[0]-a[0])**2 + (c[1]-a[1])**2)
uavInput = Enum('uavInput', 'targetFound targetLost reachedRallyPoint refueled refuelRequired finishedResting reachedFrontierPoint')
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

        self.destination = None

        self.node = None

        self.route = None

        self.index = -1

        self.target = None

        self.pheromoneMap = PheromoneMap((10,30), 500, 50)
        #UAV_Patrolling
        self.transitionTable = {(UAV_Searching(self).__class__, uavInput.targetFound): [None, UAV_Tracking(self)],
            (UAV_Tracking(self).__class__, uavInput.targetLost): [None, UAV_PheromonePatrol(self)],
            (UAV_Tracking(self).__class__, uavInput.refuelRequired): [self.patrolToRefuelTransition, UAV_FrontierResting(self)],
            (UAV_MovingToRally(self).__class__, uavInput.targetFound): [None, UAV_Tracking(self)],
            (UAV_MovingToRally(self).__class__, uavInput.reachedRallyPoint): [None, UAV_Patrolling(self)],
            #(UAV_Refueling(self).__class__, uavInput.refueled): [self.refuelToPatrolTransition, UAV_Patrolling(self)],
            #(UAV_Patrolling(self).__class__, uavInput.refuelRequired): [self.patrolToRefuelTransition, UAV_Refueling(self)]
            (UAV_Refueling(self).__class__, uavInput.refueled): [self.refuelToPatrolTransition, UAV_Patrolling_Rect(self)],
            (UAV_Patrolling_Rect(self).__class__, uavInput.refuelRequired): [self.patrolToRefuelTransition, UAV_Refueling(self)],

            #(UAV_FrontierExploring(self).__class__, uavInput.reachedFrontierPoint): [None, UAV_FrontierResting(self)],
            #(UAV_FrontierResting(self).__class__, uavInput.finishedResting): [None, UAV_FrontierExploring(self)]

            (UAV_PheromonePatrol(self).__class__, uavInput.refuelRequired): [self.patrolToRefuelTransition, UAV_FrontierResting(self)],
            (UAV_PheromonePatrol(self).__class__, uavInput.targetFound): [None, UAV_Tracking(self)],
            (UAV_FrontierResting(self).__class__, uavInput.finishedResting): [self.refuelToPatrolTransition, UAV_PheromonePatrol(self)]


            #self.patrol_route = self.environment.hubController.checkOutPatrolRoute(self)
        }

    def patrolToRefuelTransition(self):
        self.counter = 500 * int(self.id) + 100
        self.environment.hubController.checkInPheromoneMap(self)
        logging.debug("Agent " + str(self.id) + " to resting")
    def refuelToPatrolTransition(self):
        self.counter = 1000* int(self.id) + 1000
        self.inHub = False
        self.velocity = self.parameters['Velocity']
        self.environment.hubController.checkOutPheromoneMap(self)
        logging.debug("Agent " + str(self.id) + " to patrolling")
        #TODO: sampling should be used in order to pick the next pheromone to go to after checkout - or just use local pheromones
        #eprint('austin')
        #self.patrol_rect = self.environment.hubController.checkOutPatrolRect(self)
        #self.patrol_route = self.environment.hubController.checkOutPatrolRoute(self)
        #self.patrolPointA = [patrol_route["x0"], patrol_route["y0"]]
        #self.patrolPointB = [patrol_route["x1"], patrol_route["y1"]]

class UAV_State(State):
    def __init__(self, agent=None):
        self.name = "UAV_State"

    #override, temporary
    def sense(self, agent, environment):
        agent.neighbors.clear()
        for other_key in environment.agents.keys():
            other = environment.agents[other_key]
            if(distance(agent.location, other.location) < 50 and agent != other):
                agent.neighbors.append(other)

    #TODO: default action should be to move towards some destination
    #      maybe return True if agent has reached destination, false if not
    def act(self, agent):
        pass

    def update(self, agent):
        return None

class UAV_PheromonePatrol(UAV_State):
    def __init__(self, agent=None):
        self.name = self.__class__.__name__

    def act(self, agent):
        agent.counter -= 1
        agent.inHub = False
        if(agent.node is None):
            #TODO: better initialization needed
            agent.node = agent.pheromoneMap.grid[10][10]
            agent.destination = agent.node.position
            eprint(agent.id)
            logging.debug(str(agent.id) + " - initialization: " + str(agent.destination))

        agent.destination = np.array(agent.destination) #TODO: temp
        agent.location = np.array(agent.location) #TODO: temp

        if(np.linalg.norm(agent.destination - agent.location) < 10):
            agent.node.markAsVisited()
            current_time = time.time()
            time_diffs = []
            for n in agent.node.neighbors:
                time_diffs.append(current_time - n.lastVisited)
            probabilities = np.array(time_diffs) / np.sum(time_diffs)
            agent.node = np.random.choice(agent.node.neighbors, p=probabilities)
            logging.debug(str(agent.id) + ": " + str(agent.destination))
            agent.destination = agent.node.position

        agent.move(agent.destination)

    def update(self, agent):
        for n in agent.neighbors:
            if(n.__class__.__name__ == "Evader"):
                agent.target = n
                return uavInput.targetFound
        if(agent.counter < 1):
            return uavInput.refuelRequired
        return None
class UAV_FrontierResting(UAV_State):
    def __init__(self, agent=None):
        self.name = self.__class__.__name__

    def act(self, agent):
        if agent.inHub:
            agent.velocity = 0
            agent.counter -= 1
        else:
            # if not at hub, move towards it
            agent.move(agent.hub)
            if ((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2)**.5 <= 1:
                agent.velocity = 0
                #if(agent.destination is not None):
                    #agent.environment.hubController.checkInRoute([agent.node]) #TODO: []
                #agent.environment.hubController.checkInPatrolRoute(agent)
                agent.inHub = True

    def update(self, agent):
        if agent.inHub is False:
            return None
        #route = agent.environment.hubController.checkOutRoute()
        #route = agent.environment.hubController.checkOutRoute2()
        #if route is None:
        #    return None
        if(agent.counter > 0):
            pass
        else:
            #agent.index = 0
            #agent.route = route
            #agent.destination = route[0].position
            #agent.node = route[0]
            return uavInput.finishedResting

class UAV_FrontierExploring(UAV_State):
    def __init__(self, agent=None):
        self.name = self.__class__.__name__

    def sense(self, agent, environment):
        pass # for now

    def act(self, agent):
        agent.velocity = agent.parameters['Velocity']
        agent.inHub = False
        destination = agent.destination
        position = agent.location
        #eprint(destination)
        #eprint(position)
        agent.direction = np.arctan2(destination[1] - position[1], destination[0] - position[0])
        if(distance(agent.location, agent.destination) < 10 and agent.index < len(agent.route) - 1):
            agent.index += 1
            agent.destination = agent.route[agent.index].position
    def update(self, agent):
        if(distance(agent.location, agent.route[len(agent.route)-1].position) < 10):
            return uavInput.reachedFrontierPoint
        return None

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
            return uavInput.refueled #TODO: uavInput.ready instead - it may have been "refueled"/"ready to go" for a while now

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
        #if(len(agent.neighbors) == 0):
        #    return
        #other_loc = agent.neighbors[0].location
        #this_loc = agent.location
        #agent.direction = np.arctan2(other_loc[1] - this_loc[1], other_loc[0] - this_loc[0]) #+ np.pi/4
        agent.counter -= 1 #TODO: in superclass?
        agent.move(agent.target.location)

    def update(self, agent):
        if(agent.counter < 1):
            return uavInput.refuelRequired
        if(len(agent.neighbors) > 0):
            for neighbor in agent.neighbors:
                if(neighbor.__class__.__name__ == "Evader"):
                    return None
        agent.target = None
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
        self.rect = None#Polygon(Point2D(100, -400),Point2D(100,100),Point2D(300,100),Point2D(300,-400))
        self.waypoint = None#[self.rect.vertices[0][0], self.rect.vertices[0][1]]
        #eprint(self.rect.bounds)


    def sense(self, agent, environment):
        agent.neighbors.clear()
        for other_key in environment.agents.keys():
            other = environment.agents[other_key]
            if(distance(agent.location, other.location) < 50 and agent != other):
                agent.neighbors.append(other)
        #eprint(agent.neighbors)

    def act(self, agent):
        #if(self.rect is None):
        #    self.rect = agent.environment.hubController.checkOutPatrolRect(agent)["rect"] #TODO: ugly, needs fix so all that is passed back is the rectangle
        if(self.waypoint is None):
            self.waypoint = [agent.patrol_rect.vertices[0][0], agent.patrol_rect.vertices[0][1]]

        agent.counter -= 1
        agent.inHub = False

        if(distance(agent.location, self.waypoint) < 1):
            new_waypoint = [None,None]
            if(self.waypoint[0] == agent.patrol_rect.bounds[0]):
                new_waypoint[0] = agent.patrol_rect.bounds[2]
            else:
                new_waypoint[0] = agent.patrol_rect.bounds[0]
            agent.direction %= 2*np.pi
            #eprint(self.rect.bounds)
            if((self.waypoint[1] < agent.patrol_rect.bounds[1] and np.pi < agent.direction) or (self.waypoint[1] > agent.patrol_rect.bounds[3] and np.pi > agent.direction)):
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
            break
            if(neighbor.state.__class__.__name__ == agent.state.__class__.__name__ and neighbor.id < agent.id):
                self.waypoint[0] = neighbor.state.waypoint[0]
                self.waypoint[1] = neighbor.state.waypoint[1]
                self.waypoint[1] += 50
                break

        #eprint(self.waypoint)

        #else:
        #    agent.velocity = 0.0
    def update(self, agent):
        if agent.counter < 1:
            return uavInput.refuelRequired
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
