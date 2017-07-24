import warnings
from enum import Enum
import numpy as np
from .stateMachine.StateMachine import StateMachine
from .stateMachine.state import State
from .debug import *
from abc import abstractmethod

input = Enum('input', 'nestFound exploreTime observeTime dancerFound siteFound tiredDance notTiredDance restingTime siteAssess finAssess startPipe quorum quit')
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
        agent_dict["id"] = self.id
        agent_dict["state"] = self.state.name
        agent_dict["direction"] = self.direction
        agent_dict["live"] = self.live
        return agent_dict


    def sense(self, environment):
        self.state.sense(self, environment)

    def act(self):
        self.state.act(self)

    def move(self, destination):
        dx = destination[0] - self.location[0]
        dy = destination[1] - self.location[1]
        self.direction = np.arctan2(dy, dx)

    def update(self, environment):
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
        agent.direction = np.arctan2(destination[1] - self.location[1], destination[0] - self.location[0])

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
        assert(self.attractor is not None)
        return distance(self.attractor.point, self.location) < self.attractor.radius

    def isInfluencedByNearestAttractor(self):
        return self.isAttracted() and self.isInRangeOfNearestAttractor()

    #if(agent.attractor is not None and distance(agent.attractor.point, agent.location) < agent.attractor.radius and agent.attracted is True):
    def orientTowardsNearestAttractor(self):
        assert(self.attractor is not None)
        angle = safe_angle((np.cos(self.direction),np.sin(self.direction)), (self.attractor.x-self.location[0],self.attractor.y-self.location[1]))
        angle = np.clip(angle, -np.pi/16, np.pi/16)
        error = np.random.normal(0, .3)
        self.direction += angle + error
        self.direction = self.direction % (2 *np.pi)

    #elif(agent.repulsor is not None and distance(agent.repulsor.point, agent.location) < agent.repulsor.radius and agent.ignore_repulsor is False):
    def isRepulsed(self):
        if(self.ignore_repulsor is False): #yeah ignore_repulsor should be "repulsed" or something affirmative instead of negative
            return True
        return False

    def isInRangeOfNearestRepulsor(self):
        assert(self.repulsor is not None)
        return distance(self.repulsor.point, self.location) < self.repulsor.radius

    def isRepulsedByNearestRepulsor(self):
        return self.isRepulsed() and self.isInRangeOfNearestRepulsor()

    def avoidNearestRepulsor(self):
        assert(self.repulsor is not None)
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
                if self.environment.hubController.beeCheckOut(self) == 0:
                    self.inHub = False
                    return True
        return False
    def checkAgentReturn(self):
        if (((self.hub[0] - self.location[0]) ** 2 + (self.hub[1] - self.location[1])** 2)** .5 < self.hubRadius):
            if not self.inHub: #if probs check if not agent.goingToSite
                self.environment.hubController.beeCheckIn(self)
                self.inHub = True
                return True
        return False
'''
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
        self.counter = 10

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
            (UAV_Refueling(self).__class__, uavInput.refueled): [self.refuelPatrolTransition, UAV_Patrolling(self)]
            }

    def refuelPatrolTransition(self):
        patrol_route = self.environment.hubController.getNextPatrolRoute()
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
        return None
'''

class Bee(HubAgent):

    def updateParams(self, params,timeStamp):
        self.parameters = params
        self.velocity = self.parameters["Velocity"]
        self.param_time_stamp = timeStamp

    def getUiRepresentation(self):
        return {
            # these names should match the state.name property for each state
            "states": ["searching", "assessing", "commit"],
            "transitions": {
                "exploring": ["assessing", "commit"],
                "assessing": ["exploring"],
                "commit": []
            }
        }

    def __init__(self, environment, agentId, initialstate, hub, params, count=1000):
        super().__init__(environment, agentId, initialstate, params, hub)

        exp = np.random.normal(1, .5, 1)
        while exp < 0:
            exp = np.random.normal(1, .5, 1)
        self.counter = int(count*exp)
        exp = np.random.normal(1, .05, 1)
        while exp < 0:
            exp = np.random.normal(1, .05, 1)
        self.exp =exp
        # These parameters may be modified at run-time
        '''self.parameters =  {"PipingThreshold":       piping_threshold,
                            "Velocity":              global_velocity,
                            "ExploreTime":           explore_time,
                            "RestTime":              rest_time,
                            "DanceTime":             dance_time,
                            "ObserveTime":           observe_time,
                            "SiteAssessTime":        site_assess_time,
                            "PipingTime":            piping_time}'''

        # This time-stamp should be updated whenever the bee receives new parameters
        self.param_time_stamp = 0

        # bee agent variables
        self.live = True
        self.location = [hub["x"], hub["y"]]
        self.velocity = self.parameters["Velocity"]
        self.potential_site = None  # array [x,y]
        self.q_value = 0
        self.assessments = 1

        self.atSite = False
        self.siteIndex = None
        self.goingToSite = False
        self.quadrant = [] #not sure if this is being used....
        self.infoStation = None
        self.assessCounter = 1 #makes sure that they assess at least once.
        self.priorities = None

        # create table here.
        self.transitionTable = {(Exploring(self).__class__, input.nestFound): [self.siteAssessTransition, SiteAssess(self)],
                (Exploring(self).__class__, input.exploreTime): [self.observeTransition, Observing(self)],
                (Observing(self).__class__, input.observeTime): [self.exploreTransition, Exploring(self)],
                (Observing(self).__class__, input.dancerFound): [None, Assessing(self)],
                (Observing(self).__class__, input.startPipe): [self.pipingTransition, Piping(self)],
                (Observing(self).__class__, input.quit): [self.restingTransition, Resting(self)],
                (Assessing(self).__class__, input.siteFound): [self.danceTransition, Dancing(self)], # self.danceTransition()
                (Assessing(self).__class__, input.siteAssess): [self.siteAssessTransition, SiteAssess(self)],
                (SiteAssess(self).__class__, input.finAssess): [self.finishAssess, Assessing(self)],
                (SiteAssess(self).__class__, input.startPipe): [self.pipingTransition, Piping(self)],
                (Dancing(self).__class__, input.tiredDance): [self.restingTransition, Resting(self)],
                (Dancing(self).__class__, input.notTiredDance): [None, Assessing(self)],
                (Dancing(self).__class__, input.startPipe): [self.pipingTransition, Piping(self)],
                (Resting(self).__class__, input.restingTime): [self.observeTransition, Observing(self)],
                (Resting(self).__class__, input.startPipe): [self.pipingTransition, Piping(self)],
                (Piping(self).__class__, input.quorum): [None, Commit(self)]
            }

        self.attractor = None
        self.attracted = None

        self.repulsor = None
        self.ignore_repulsor = None
    #TRANSitions
    def danceTransition(self):  #this runs after the agent has changed state
        dance = int(self.q_value*self.parameters["DanceTime"]-(250*self.assessments))
        if dance < 15:
            self.assessments = 1
            self.potential_site = None
            self.nextState(input.tiredDance)
        else:
            self.counter = dance
    def exploreTransition(self):
        self.counter = self.parameters["ExploreTime"]*self.exp
    def siteAssessTransition(self):
        self.counter = self.parameters["SiteAssessTime"]
    def pipingTransition(self):
        self.counter = self.parameters["PipingTime"]
    def restingTransition(self):
        self.counter = self.parameters["RestTime"] * self.exp
    def observeTransition(self):
        self.counter = self.parameters["ObserveTime"]
    def finishAssess(self):
        self.assessCounter -=1
        self.infoStation.beeLeave(self)
    def to_json(self):
        agent_dict = super().to_json()
        agent_dict["potential_site"] = self.potential_site
        agent_dict["qVal"] = self.q_value
        return agent_dict

    # so, the exploring part needs to give the input..
class Exploring(State):
    def __init__(self, agent=None):
        self.name = "exploring"
        self.inputExplore = False

    def sense(self, agent, environment):
        agent.checkAgentLeave()

        new_q = environment.get_q(agent)["q"]
        agent.q_value = new_q

        agent.senseAndProcessAttractor(environment)
        agent.senseAndProcessRepulsor(environment)

    def act(self, agent):
        if(agent.isInfluencedByNearestAttractor()):
            agent.orientTowardsNearestAttractor()
        elif(agent.isRepulsedByNearestRepulsor()):
            agent.avoidNearestRepulsor()
        elif self.inputExplore: #this is for when the user has requested more bees
            delta_d = np.random.normal(0, .005) # this will assure that the bee moves less erratically, it can be decreased a little as well
            agent.direction = (agent.direction + delta_d) % (2 * np.pi)
        else:
            delta_d = np.random.normal(0, .1)
            agent.direction = (agent.direction + delta_d) % (2 * np.pi)

    def update(self, agent):
        agent.counter -= 1
        if agent.q_value > 0:
            agent.potential_site = [agent.location[0], agent.location[1]]
            return input.nestFound
        elif agent.counter < 1:
            return input.exploreTime
        else:
            return None


class Assessing(State):
    def __init__(self, agent=None):
        self.name = "assessing"
        self.siteFound = False

    def sense(self, agent, environment):
        if not agent.checkAgentLeave(): #if probs check if agent.goingToSite
            self.siteFound = agent.checkAgentReturn() #if probs, check if not agent.goingToSite
    #TODO TODO repeated code in sense and update????
    def act(self, agent):
        if agent.goingToSite:
            agent.move(agent.potential_site)
        else:
            agent.move(agent.hub)
        return

    def update(self, agent):
        '''if (((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 < agent.hubRadius) and (agent.goingToSite is False):
            agent.goingToSite = True
            return input.siteFound
        elif ((agent.potential_site[0] - agent.location[0]) ** 2 + (agent.potential_site[1] - agent.location[1]) ** 2) < 1 and (agent.goingToSite is True):
            agent.goingToSite = False
            return input.siteAssess'''
        if ((agent.potential_site[0] - agent.location[0]) ** 2 + (agent.potential_site[1] - agent.location[1]) ** 2) < 1 and (agent.goingToSite is True):
            agent.goingToSite = False
            return input.siteAssess
        if self.siteFound:
            agent.goingToSite = True
            self.siteFound = False
            return input.siteFound


class Resting(State):
    def __init__(self, agent=None):
        self.name = "resting"
        self.seesPiper = False

    def sense(self, agent, environment):
        if agent.inHub:
            bee = environment.hubController.observersCheck()
            if isinstance(bee.state, Piping().__class__):
                self.seesPiper = True
                agent.velocity = agent.parameters["Velocity"]
                agent.potential_site = bee.potential_site
                environment.hubController.newPiper()

    def act(self, agent):
        if agent.inHub and not self.seesPiper:
            agent.velocity = 0
            agent.counter -= 1
        else:
            # if not at hub, move towards it
            agent.move(agent.hub)
            if ((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2)**.5 <= 1:
                agent.velocity = 0
                agent.inHub = True

    def update(self, agent):
        if self.seesPiper:
            return input.startPipe
        if agent.counter < 1:
            agent.velocity = agent.parameters["Velocity"]
            return input.restingTime

class Dancing(State):
    def __init__(self, agent=None):
        self.name = "dancing"
        self.seesPiper = False

    def sense(self, agent, environment):
        bee = environment.hubController.observersCheck()
        if isinstance(bee.state, Piping().__class__):
            self.seesPiper = True
            agent.potential_site = bee.potential_site
            environment.hubController.newPiper()

    def act(self, agent):
        agent.wander(agent.hub, agent.hubRadius)

    def update(self, agent):
        if self.seesPiper:
            return input.startPipe
        if agent.counter < 1:
            agent.assessments += 1
            agent.q_value = 0
            agent.goingToSite=True
            return input.notTiredDance
        else:
            agent.counter -= 1

class Observing(State):
    def __init__(self, agent=None):
        self.name = "observing"
        self.seesDancer = False
        self.seesPiper = False

    def sense(self, agent, environment):
        # get nearby bees from environment and check for dancers
        if agent.inHub:
            bee = environment.hubController.observersCheck()
            if isinstance(bee.state, Piping().__class__):
                self.seesPiper = True
                agent.potential_site = bee.potential_site
                environment.hubController.newPiper()
            if isinstance(bee.state, Dancing().__class__):
                if np.random.random()<(bee.q_value*np.sqrt(bee.q_value)*.02):#maybe get rid of the second part
                    self.seesDancer = True
                    agent.potential_site = bee.potential_site
        '''if (((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 < agent.hubRadius) \
                and agent.inHub is False:
                    environment.hubController.beeCheckIn(agent)
                    agent.inHub = True
                    return'''
        agent.checkAgentReturn()

    def act(self, agent):
        if agent.inHub:
            agent.counter -= 1
            agent.wander(agent.hub, agent.hubRadius)
        else:
            # if not at hub, more towards it
            agent.move(agent.hub)
            if ((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 <= 1.15:
                # 1.1 prevents moving back and forth around origin
                agent.inHub = True
                agent.direction += -89 + 179 * np.random.random()
    def update(self, agent):
        if self.seesPiper is True:
            return input.startPipe
        if self.seesDancer is True:
            agent.goingToSite = True
            return input.dancerFound
        elif agent.counter < 1:
            if np.random.uniform(0, 1) < 0.1:  # 10% chance a bee goes back to rest after observing
                return input.quit
            return input.observeTime

class SiteAssess(State):
    def __init__(self, agent=None):
        self.name = "site assess"
        self.siteRadius = 9
        self.thresholdPassed = False

    def check_num_close_assessors(self, agent, environment):
        """Check if number of local bees assessing current site exceeds threshold for piping"""
        if agent.siteIndex is not None and environment.info_stations[agent.siteIndex].bee_count > agent.parameters["PipingThreshold"]:
            return True
        else:
            return False

    def sense(self, agent, environment):
        ## Code to help the bees find the center of the site
        siteInfo = environment.get_q(agent)
        if self.check_num_close_assessors(agent, environment)and agent.assessCounter < 1:
            self.thresholdPassed = True

        #TODO this code is making the agents commit/report on different parts of the site
        if siteInfo["q"] >= 0 and siteInfo["radius"] > 0: #CHECK THIS, IT MAY BE A PROBLEM...

            distance = np.sqrt((agent.location[0] - agent.hub[0])**2 + (agent.location[1] - agent.hub[1])**2)
            size     = siteInfo["radius"]
            q        = siteInfo["q"]
            STD_SITE_SIZE = 10
            # scale from (0 to 30) to (-1 to 1)
            size = size / (STD_SITE_SIZE) - 1
            # scale from (0 to max dist) to (-1 to 1)
            distance = distance / (np.sqrt((environment.x_limit**2) + (environment.y_limit**2)) / 2) - 1

            adjustedQ = siteInfo["q"] + agent.priorities["distance"] * distance + agent.priorities["size"] * size

            #eprint("distance: ", distance, "; size: ", size, "; q: ", q, "; pDist: ", agent.priorities["distance"], "; pSize: ", agent.priorities["size"], "; adjusted: ", adjustedQ)
            adjustedQ = 1 if adjustedQ > 1 else 0 if adjustedQ < 0 else adjustedQ
            if adjustedQ > agent.q_value:
                agent.potential_site = [agent.location[0], agent.location[1]]
                agent.q_value = adjustedQ

    def act(self, agent):
        agent.wander(agent.potential_site,self.siteRadius)

    def update(self, agent):
        # check for piping threshold passed
        if self.thresholdPassed:
            return input.startPipe
        # counter functions
        if agent.counter < 1:
            agent.atSite = False
            return input.finAssess
        else:
            agent.counter -= 1


class Piping(State):
    def __init__(self, agent=None):
        self.name = "piping"
        self.quorum = False

    def sense(self, agent, environment):
        agent.checkAgentReturn()
        if agent.inHub:
            if environment.hubController.piperCheck():
                self.quorum = True

    def act(self, agent):
        agent.wander(agent.hub, agent.hubRadius)

    def update(self, agent):
        # info from environment
        if agent.counter > 1:
            agent.counter -= 1
        else:
            if self.quorum is True:
                return input.quorum

class Commit(State):
    def __init__(self, agent=None):
        self.name = "commit"
        self.done =False
          # we may not need this code at all... to turn it on make it default false.

    def sense(self, agent, environment):  # probably not needed for now, but can be considered a place holder
        agent.checkAgentLeave()

    def act(self, agent):
        if self.done:
            pass
        else:
            # if not at hub, more towards it
            agent.move(agent.potential_site)
            if ((agent.potential_site[0] - agent.location[0]) ** 2 + (agent.potential_site[1] - agent.location[1]) ** 2) ** .5 <= 1:
                agent.hub = agent.potential_site
                agent.velocity = 0
                agent.inHub = True
                self.done = True

    def update(self, agent):
        pass
