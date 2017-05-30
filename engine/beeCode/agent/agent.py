
import warnings

from enum import Enum
#from ....utils.debug import eprint
import numpy as np

from .stateMachine.StateMachine import StateMachine
from .stateMachine.state import State

#from .geomUtil import *
# reset velocity of agent at begining of each state transition?

input = Enum('input', 'nestFound exploreTime observeTime dancerFound siteFound tiredDance notTiredDance restingTime siteAssess finAssess startPipe quorum quit')

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

class Agent(StateMachine):

    def sense(self, environment):
        self.state.sense(self, environment)

    def act(self):
        self.state.act(self)

    def update(self, environment):
        self.nextState(self.state.update(self), environment)

    def danceTransition(self, environment):  #this runs after the agent has changed state
        dance = int(self.q_value*1000-(250*self.assessments))
        if dance < 15:
            self.assessments = 1
            self.potential_site = None
            self.nextState(input.tiredDance, environment)
        else:
            self.state.dance_counter = dance

    def getUiRepresentation(self):
        return {
            # these names should match the state.name property for each state
            "states": ["assessing", "exploring", "commit"],
            "transitions": {
                "assessing": ["exploring"],
                "exploring": ["assessing", "commit"],
                "commit": []
            }
        }

    def __init__(self, agentId, initialstate, hub, piping_threshold=40, piping_time=1200, global_velocity=2,
                 explore_time_multiplier=3625, rest_time=2000, dance_time=1150, observe_time=2000,
                 site_assess_time=250, site_assess_radius=15):
        self.state = initialstate

        # These parameters may be modified at run-time
        self.parameters =  {"PipingThreshold":       piping_threshold,
                            "Velocity":              global_velocity,
                            "ExploreTime":           explore_time_multiplier,
                            "RestTime":              rest_time,
                            "DanceTime":             dance_time,
                            "ObserveTime":           observe_time,
                            "SiteAssessTime":        site_assess_time,
                            "SiteAssessRadius":      site_assess_radius,
                            "PipingTime":            piping_time}

        # This time-stamp should be updated whenever the bee receives new parameters
        self.param_time_stamp = 0

        # bee agent variables
        self.live = True
        self.id = agentId  # for communication with environment
        self.location = [hub["x"], hub["y"]]
        self.direction = 2*np.pi*np.random.random()  # should be initialized? potentially random?
        #self.direction = np.pi/2
        self.velocity = self.parameters["Velocity"]
        self.hub = [hub["x"], hub["y"]]  # should be initialized?
        self.potential_site = None  # array [x,y]
        self.q_value = 0
        self.assessments = 1
        self.hubRadius = hub["radius"]
        self.inHub = True
        self.atSite = False
        self.siteIndex = None
        self.goingToSite = True
        self.quadrant = []

        # create table here.
        dict = {(Exploring(self).__class__, input.nestFound): [None, SiteAssess(self)],
                (Exploring(self).__class__, input.exploreTime): [None, Observing(self)],
                (Observing(self).__class__, input.observeTime): [None, Exploring(self)],
                (Observing(self).__class__, input.dancerFound): [None, Assessing(self)],
                (Observing(self).__class__, input.startPipe): [None, Piping(self)],
                (Observing(self).__class__, input.quit): [None, Resting(self)],
                (Assessing(self).__class__, input.siteFound): [self.danceTransition, Dancing(self)], # self.danceTransition()
                (Assessing(self).__class__, input.siteAssess): [None, SiteAssess(self)],
                #(Assessing().__class__, input.quit): [None, Observing(self)],
                (SiteAssess(self).__class__, input.finAssess): [None, Assessing(self)],
                (SiteAssess(self).__class__, input.startPipe): [None, Piping(self)],
                (Dancing(self).__class__, input.tiredDance): [None, Resting(self)],
                (Dancing(self).__class__, input.notTiredDance): [None, Assessing(self)],
                (Dancing(self).__class__, input.startPipe): [None, Piping(self)],
                (Resting(self).__class__, input.restingTime): [None, Observing(self)],
                (Resting(self).__class__, input.startPipe): [None, Piping(self)],
                (Piping(self).__class__, input.quorum): [None, Commit(self)]
                }
        self.transitionTable = dict

        self.attractor = None
        self.attracted = None

        self.repulsor = None
        self.ignore_repulsor = None

    def reset_trans_table(self):
        #  Reset table in order to update parameters in states
        del self.transitionTable
        self.transitionTable = {(Exploring(self).__class__, input.nestFound): [None, SiteAssess(self)],
                (Exploring(self).__class__, input.exploreTime): [None, Observing(self)],
                (Observing(self).__class__, input.observeTime): [None, Exploring(self)],
                (Observing(self).__class__, input.dancerFound): [None, Assessing(self)],
                (Observing(self).__class__, input.startPipe): [None, Piping(self)],
                (Observing(self).__class__, input.quit): [None, Resting(self)],
                (Assessing(self).__class__, input.siteFound): [self.danceTransition, Dancing(self)], # self.danceTransition()
                (Assessing(self).__class__, input.siteAssess): [None, SiteAssess(self)],
                #(Assessing().__class__, input.quit): [None, Observing(self)],
                (SiteAssess(self).__class__, input.finAssess): [None, Assessing(self)],
                (SiteAssess(self).__class__, input.startPipe): [None, Piping(self)],
                (Dancing(self).__class__, input.tiredDance): [None, Resting(self)],
                (Dancing(self).__class__, input.notTiredDance): [None, Assessing(self)],
                (Dancing(self).__class__, input.startPipe): [None, Piping(self)],
                (Resting(self).__class__, input.restingTime): [None, Observing(self)],
                (Resting(self).__class__, input.startPipe): [None, Piping(self)],
                (Piping(self).__class__, input.quorum): [None, Commit(self)]
                }

    # so, the exploring part needs to give the input..
class Exploring(State):
    def __init__(self, agent=None,ExploreTimeMultiplier = None):
        self.name = "exploring"
        self.inputExplore = False
        exp = np.random.normal(1, .002, 1)
        while exp < 0:
            exp = np.random.normal(1, .002, 1)
        if agent is not None:
            self.exploretime = exp*agent.parameters["ExploreTime"]
        elif ExploreTimeMultiplier is not None:
            self.exploretime = exp*ExploreTimeMultiplier
        else:
            warnings.warn("No agent or initial condition given! Using default...")
            self.exploretime = exp*3625

    def sense(self, agent, environment):
        if (((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 > agent.hubRadius) \
                and agent.inHub is True:
                if environment.hubController.beeCheckOut(agent) == 0:
                    agent.inHub = False
                    return

        new_q = environment.get_q(agent)["q"]
        agent.q_value = new_q
        agent.attractor = environment.getAttractor(agent.location)
        if(agent.attractor is not None and agent.attracted is None):
            if(np.random.random () > .2):
                agent.attracted = True
            else:
                agent.attracted = False


        agent.repulsor = environment.getRepulsor(agent.location)
        if(agent.repulsor is not None and agent.ignore_repulsor is None):
            if(np.random.random() >.9):
                 agent.ignore_repulsor = True
            else:
                 agent.ignore_repulsor = False

    def act(self, agent):
        self.move(agent)

    def update(self, agent):
        self.exploretime = self.exploretime - 1
        if agent.q_value > 0:
            agent.potential_site = [agent.location[0], agent.location[1]]
            return input.nestFound
        elif self.exploretime < 1:
            #eprint("hub:", agent.inHub)
            return input.exploreTime

        else:
            return None

    def move(self, agent):

        if(agent.attractor is not None and distance(agent.attractor.point, agent.location) < agent.attractor.radius and agent.attracted is True):
                angle = safe_angle((np.cos(agent.direction),np.sin(agent.direction)), (agent.attractor.x-agent.location[0],agent.attractor.y-agent.location[1]))
                angle = np.clip(angle, -np.pi/16, np.pi/16)
                error = np.random.normal(0, .3)
                agent.direction += angle + error
                agent.direction = agent.direction % (2 *np.pi)

        elif(agent.repulsor is not None and distance(agent.repulsor.point, agent.location) < agent.repulsor.radius and agent.ignore_repulsor is False):
             angle = - safe_angle((np.cos(agent.direction),np.sin(agent.direction)), (agent.repulsor.x-agent.location[0],agent.repulsor.y-agent.location[1]))
             angle = np.clip(angle, -np.pi/16, np.pi/16)
             if(angle >= 0):
                      agent.direction += .3
             else:
                      agent.direction -= .3

             agent.direction %= 2 * np.pi

        elif self.inputExplore: #this is for when the user has requested more bees
            delta_d = np.random.normal(0, .02) # this will assure that the bee moves less erratically, it can be decreased a little as well
            agent.direction = (agent.direction + delta_d) % (2 * np.pi)
        else:
            delta_d = np.random.normal(0, .1)
            agent.direction = (agent.direction + delta_d) % (2 * np.pi)

        return


class Assessing(State):
    def __init__(self, agent=None):
        self.name = "assessing"

    def sense(self, agent, environment):
        if (((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 > agent.hubRadius):
            if agent.goingToSite and agent.inHub:
                if environment.hubController.beeCheckOut(agent)==0:
                    agent.inHub = False
                    return
        if (((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 < agent.hubRadius+1.251858563765788):
            if not agent.goingToSite and not agent.inHub:
                environment.hubController.beeCheckIn(agent)
                agent.inHub = True

    def act(self, agent):
        self.move(agent)

    def update(self, agent):
        if (((agent.hub[0] - agent.location[0]) ** 2 + (
                agent.hub[1] - agent.location[1]) ** 2) ** .5 < agent.hubRadius) and (agent.goingToSite is False):
            agent.goingToSite = True
            return input.siteFound
        elif ((agent.potential_site[0] - agent.location[0]) ** 2 + (
                agent.potential_site[1] - agent.location[1]) ** 2) < 1 and (agent.goingToSite is True):
            agent.goingToSite = False
            #if(np.random.uniform(0,1) < 1 - agent.q_value): # (1-q)% chance of going to observer state instead of dancing
            #    return input.quit
            return input.siteAssess

    def move(self, agent):
        if agent.goingToSite:
            dx = agent.potential_site[0] - agent.location[0]
            dy = agent.potential_site[1] - agent.location[1]
            agent.direction = np.arctan2(dy, dx)
        else:
            dx = agent.hub[0] - agent.location[0]
            dy = agent.hub[1] - agent.location[1]
            agent.direction = np.arctan2(dy, dx)
        return


class Resting(State):
    def __init__(self, agent=None, rest_time=None):
        self.name = "resting"
        self.atHub = True  #we may not need this code at all... to turn it on make it default false.
        self.seesPiper = False
        multiplier = np.abs(np.random.normal(1, 0.6, 1))  #Add normal distribution noise to resting counter
        if agent is not None:
            self.restCountdown = agent.parameters["RestTime"] * multiplier
        elif rest_time is not None:
            self.restCountdown = rest_time * multiplier
        else:
            self.restCountdown = 4000 * multiplier

    def sense(self, agent, environment):
        if self.atHub:
            bee = environment.hubController.observersCheck()
            if isinstance(bee.state, Piping().__class__):
                self.seesPiper = True
                agent.velocity = agent.parameters["Velocity"]
                agent.potential_site = bee.potential_site
                environment.hubController.newPiper()

    def act(self, agent):
        if self.atHub and not self.seesPiper:
            agent.velocity = 0
            self.restCountdown -= 1
        else:
            # if not at hub, move towards it
            self.move(agent)
            if ((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2)**.5 <= 1:
                agent.velocity = 0
                self.atHub = True
                agent.atHub = True

    def update(self, agent):
        if self.seesPiper:
            return input.startPipe
        if self.restCountdown < 1:
            agent.velocity = agent.parameters["Velocity"]
            return input.restingTime

    def move(self, agent):
        dx = agent.location[0] - agent.hub[0]
        dy = agent.location[1] - agent.hub[1]
        agent.direction = np.arctan2(dy, dx)
        return


class Dancing(State):
    def __init__(self, agent=None):
        self.name = "dancing"
        self.seesPiper = False
        if agent is None:
            self.dance_counter = 1150
        else:
            self.dance_counter = agent.parameters["DanceTime"]  # this dance counter should be determined by the q value and the distance,
                                             # we can consider implementing that in the transition.

    def sense(self, agent, environment):
        bee = environment.hubController.observersCheck()
        if isinstance(bee.state, Piping().__class__):
            self.seesPiper = True
            agent.velocity = agent.parameters["Velocity"]
            agent.potential_site = bee.potential_site
            environment.hubController.newPiper()

    def act(self, agent):
        self.move(agent)

    def update(self, agent):
        # info from environment
        if self.seesPiper:
            return input.startPipe
        if self.dance_counter < 1:
            agent.assessments += 1
            agent.q_value = 0
            return input.notTiredDance

        else:
            self.dance_counter -= 1

    def move(self, agent):
        if ((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2)**.5 >= agent.hubRadius:
            dx = agent.hub[0] - agent.location[0]
            dy = agent.hub[1] - agent.location[1]
            agent.direction = np.arctan2(dy, dx)
        else:
            delta_d = np.random.normal(0, .3)
            agent.direction = (agent.direction + delta_d) % (2 * np.pi)
        return

class Observing(State):
    def __init__(self, agent=None, observerTimer=None):
        self.name = "observing"
        if agent is not None:
            self.observerTimer = agent.parameters["ObserveTime"]
        elif observerTimer is not None:
            self.observerTimer = observerTimer
        else:
            warnings.warn("No agent or initial condition given! Using default...")
            self.observerTimer = 2000
        self.seesDancer = False
        self.atHub = False
        self.seesPiper = False

    def sense(self, agent, environment):
        # get nearby bees from environment and check for dancers
        if self.atHub:
            #bees = environment.get_nearby_agents(agent.id, 2)  # we may need to reformat this so the agent knows what is
            #for bee in bees:
            bee = environment.hubController.observersCheck()
            if isinstance(bee.state, Piping().__class__):
                self.seesPiper = True
                agent.velocity = agent.parameters["Velocity"]
                agent.potential_site = bee.potential_site
                environment.hubController.newPiper()
            if isinstance(bee.state, Dancing().__class__):
                if np.random.random()<(bee.q_value*np.sqrt(bee.q_value)*.02):#maybe get rid of the second part
                    self.seesDancer = True
                    agent.velocity = agent.parameters["Velocity"]
                    agent.potential_site = bee.potential_site
        if (((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 < agent.hubRadius) \
                and agent.inHub is False:
                    environment.hubController.beeCheckIn(agent)
                    agent.inHub = True
                    return

    def act(self, agent):
        if self.atHub:
            self.observerTimer -= 1
            if self.observerTimer == 0:
                agent.velocity = agent.parameters["Velocity"]
            self.wander(agent)
        else:
            # if not at hub, more towards it
            self.movehome(agent)
            if ((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 <= 1.1:
                # 1.1 prevents moving back and forth around origin
                self.atHub = True
                #agent.inHub = True
                agent.direction += -89 + 179 * np.random.random()
                agent.velocity = agent.parameters["Velocity"]

    def update(self, agent):
        if self.seesPiper is True:
            return input.startPipe
        if self.seesDancer is True:
            return input.dancerFound
        elif self.observerTimer < 1:
            if np.random.uniform(0, 1) < 0.1:  # 10% chance a bee goes back to rest after observing
                return input.quit
            return input.observeTime

    def movehome(self, agent):
        dx = agent.hub[0] - agent.location[0]
        dy = agent.hub[1] - agent.location[1]
        agent.direction = np.arctan2(dy, dx)

    def wander(self, agent):
        if ((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 >= agent.hubRadius:
            dx = agent.hub[0] - agent.location[0]
            dy = agent.hub[1] - agent.location[1]
            agent.direction = np.arctan2(dy, dx)
        else:
            delta_d = np.random.normal(0, .3)
            agent.direction = (agent.direction + delta_d) % (2 * np.pi)

        return

# Code for site convergence (Chace A.) VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

class SiteAssess(State):
    def __init__(self, agent=None):
        self.name = "site assess"
        if agent is None:
            self.counter = 300
            self.siteRadius = 10
        else:
            self.counter = agent.parameters["SiteAssessTime"]
            self.siteRadius = agent.parameters["SiteAssessRadius"]
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
        if siteInfo["q"] > agent.q_value:
            agent.potential_site = [agent.location[0], agent.location[1]]
            agent.q_value = siteInfo["q"]
        if self.check_num_close_assessors(agent, environment):
            self.thresholdPassed = True

        #TODO this code is making the agents commit/report on different parts of the site
        if siteInfo["q"] >= 0 and siteInfo["radius"] > 0: #CHECK THIS, IT MAY BE A PROBLEM...

            distance = np.sqrt((agent.location[0] - agent.hub[0])**2 + (agent.location[1] - agent.hub[1])**2)
            size     = siteInfo["radius"]
            q        = siteInfo["q"]

            # TODO: have the bees update these values only on hub check-in?
            priorities = environment.hubController.getSitePriorities()

            STD_SITE_SIZE = 25

            # scale from (0 to 30) to (-1 to 1)
            size = size / (STD_SITE_SIZE) - 1

            # scale from (0 to max dist) to (-1 to 1)
            distance = distance / (np.sqrt((environment.x_limit**2) + (environment.y_limit**2)) / 2) - 1

            adjustedQ = siteInfo["q"] + priorities["distance"] * distance + priorities["size"] * size

            #eprint("distance: ", distance, "; size: ", size, "; q: ", q, "; pDist: ", priorities["distance"], "; pSize: ", priorities["size"], "; adjusted: ", adjustedQ)

            agent.q_value = 1 if adjustedQ > 1 else 0 if adjustedQ < 0 else adjustedQ

    def act(self, agent):
        self.move(agent)

    def update(self, agent):
        # check for piping threshold passed
        if self.thresholdPassed:
            return input.startPipe
        # counter functions
        if self.counter < 1:
            agent.atSite = False
            return input.finAssess
        else:
            self.counter -= 1

    def move(self, agent):
        if ((agent.potential_site[0] - agent.location[0]) ** 2
                + (agent.potential_site[1] - agent.location[1]) ** 2) ** .5 >= self.siteRadius:
            dx = agent.potential_site[0] - agent.location[0]
            dy = agent.potential_site[1] - agent.location[1]
            agent.direction = np.arctan2(dy, dx)
        else:
            delta_d = np.random.normal(0, .3)
            agent.direction = (agent.direction + delta_d) % (2 * np.pi)
        return

class Piping(State):
    def __init__(self, agent=None):
        self.name = "piping"
        if agent is None:
            self.pipe_counter = 1000
        else:
            self.pipe_counter = agent.parameters["PipingTime"]
        self.quorum = False

    '''def neighbors_piping(self, agent, environment):
        """Check if all neighboring bees are piping

            Could need to be modified to address corner cases - like when no bees are the hub due to
            exploration or quoruming
        """
        if ((agent.hub[0] - agent.location[0]) ** 2 + (
            agent.hub[1] - agent.location[1]) ** 2) ** .5 <= agent.hubRadius:
            bees = environment.get_nearby_agents(agent.id, 10)  # we may need to reformat this
            for bee in bees:
                if not isinstance(bee.state, Piping().__class__):
                    return
            self.quorum = True

        return'''

    def sense(self, agent, environment):
        #self.neighbors_piping(agent, environment)
        if (((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 < agent.hubRadius) \
                and agent.inHub is False:
                    environment.hubController.beeCheckIn(agent)
                    agent.inHub = True
                    return
        if agent.inHub:
            if environment.hubController.piperCheck():
                self.quorum = True


    def act(self, agent):
        self.move(agent)

    def update(self, agent):
        # info from environment
        if self.pipe_counter > 1:
            self.pipe_counter -= 1
        else:
            if self.quorum is True:
                agent.hub = agent.potential_site
                return input.quorum

    def move(self, agent):
        if ((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2)**.5 \
                >= agent.hubRadius:
            dx = agent.hub[0] - agent.location[0]
            dy = agent.hub[1] - agent.location[1]
            agent.direction = np.arctan2(dy, dx)
        else:
            delta_d = np.random.normal(0, .3)
            agent.direction = (agent.direction + delta_d) % (2 * np.pi)
        return


class Commit(State):
    def __init__(self, agent=None):
        self.name = "commit"
        self.atHub = False  # we may not need this code at all... to turn it on make it default false.

    def sense(self, agent, environment):  # probably not needed for now, but can be considered a place holder
        if (((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 > agent.hubRadius) \
                and agent.inHub is True:
                if environment.hubController.beeCheckOut(agent) == 0:
                    agent.inHub = False
                    return

    def act(self, agent):
        if self.atHub:
            pass
        else:
            # if not at hub, more towards it
            self.move(agent)
            if ((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 <= 1:
                agent.velocity = 0
                self.atHub = True
                agent.inHub = True

    def update(self, agent):
        pass

    def move(self, agent):
        dx = -agent.location[0] + agent.hub[0]
        dy = -agent.location[1] + agent.hub[1]
        agent.direction = np.arctan2(dy, dx)
        return


# End site convergence states ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
