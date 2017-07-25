from .agent import HubAgent
from .stateMachine.StateMachine import StateMachine
from .stateMachine.state import State
from enum import Enum
import numpy as np
def distance(a,b):
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

        #UAV_Patrolling
        self.transitionTable = {(UAV_Searching(self).__class__, uavInput.targetFound): [None, UAV_Tracking(self)],
            (UAV_Tracking(self).__class__, uavInput.targetLost): [None, UAV_Searching(self)],
            (UAV_MovingToRally(self).__class__, uavInput.targetFound): [None, UAV_Tracking(self)],
            (UAV_MovingToRally(self).__class__, uavInput.reachedRallyPoint): [None, UAV_Patrolling(self)],
            (UAV_Refueling(self).__class__, uavInput.refueled): [self.refuelToPatrolTransition, UAV_Patrolling(self)],
            (UAV_Patrolling(self).__class__, uavInput.refuelRequired): [self.patrolToRefuelTransition, UAV_Refueling(self)]
        }

    def patrolToRefuelTransition(self):
        self.counter = 500 * int(self.id) + 100

    def refuelToPatrolTransition(self):
        self.counter = 1000* int(self.id) + 1000
        #eprint('austin')
        patrol_route = self.environment.hubController.checkOutPatrolRoute(self)
        self.patrolPointA = [patrol_route["x0"], patrol_route["y0"]]
        self.patrolPointB = [patrol_route["x1"], patrol_route["y1"]]

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
                agent.environment.hubController.checkInPatrolRoute(agent)
                agent.inHub = True

    def update(self, agent):
        if agent.counter < 1:
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

class UAV_Patrolling(State):
    def __init__(self, agent=None):
        self.name = "UAV_Tracking"
        self.inputExplore = False
        self.beginning = [-400,400]
        self.end = [-200,400]
        self.target = None
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
    #TODO: STEER TOWARDS METHOD
    def act(self, agent):
        agent.counter -= 1
        agent.inHub = False
        self.beginning = agent.patrolPointA
        self.end = agent.patrolPointB
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

    def update(self, agent):
        if agent.counter < 1:
            return uavInput.refuelRequired
        return None
