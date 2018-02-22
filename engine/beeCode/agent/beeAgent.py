import numpy as np
from enum import Enum
from .stateMachine.state import State
from .abstractAgent import HubAgent
from utils.debug import *
import math
import time
from Pheromone import *
from utils.geomUtil import distance

#input = Enum('input', 'nestFound exploreTime observeTime dancerFound searchingSites siteFound  tiredDance notTiredDance restingTime siteAssess finAssess startPipe quorum quit')
input = Enum('input', 'nestFound report maxAgents exploreTime observeTime dancerFound searchingSites siteFound  tiredDance notTiredDance restingTime siteAssess finAssess startPipe quorum quit')

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
    def update(self, environment):
        #eprint(self.state.__class__.__name__)
        old = self.state.name

        if(self.nextState(self.state.update(self))):
            if self.id in environment.states[old]:
                del environment.states[old][self.id]
            environment.states[self.state.name][self.id] = self.id
    @HubAgent.direction.setter
    def direction(self, value):
        self.environment.actions["turns"] += 1
        HubAgent.direction.fset(self, value)


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
        self.reporting=False;
        self.view=35
        self.swarmLoc=0;
        self.location = [hub["x"], hub["y"]]
        self.velocity = self.parameters["Velocity"]
        self.potential_site = None  # array [x,y]
        self.q_value = 0
        self.assessments = 1
        self.dist=np.random.randint(25,500)
        self.swarmDir=np.random.randint(0,2)
        self.swarmSpeed=np.random.rand()
        self.atSite = False
        self.siteIndex = None
        self.goingToSite = False
        self.quadrant = [] #not sure if this is being used....
        self.infoStation = None
        self.assessCounter = 1 #makes sure that they assess at least once.
        self.priorities = None

        # create table here.
        self.transitionTable = {
                (Exploring(self).__class__, input.nestFound): [None, followSite(self)],
                (followSite(self).__class__, input.report): [None, ReportToHub(self)],
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
        # self.transitionTable = {
        #         (Exploring(self).__class__, input.nestFound): [self.siteAssessTransition, SiteAssess(self)],
        #         (Exploring(self).__class__, input.exploreTime): [self.observeTransition, Observing(self)],
        #         (Observing(self).__class__, input.observeTime): [self.exploreTransition, Exploring(self)],
        #         (Observing(self).__class__, input.dancerFound): [None, Assessing(self)],
        #         (Observing(self).__class__, input.startPipe): [self.pipingTransition, Piping(self)],
        #         (Observing(self).__class__, input.quit): [self.restingTransition, Resting(self)],
        #         (Assessing(self).__class__, input.siteFound): [self.danceTransition, Dancing(self)], # self.danceTransition()
        #         (Assessing(self).__class__, input.siteAssess): [self.siteAssessTransition, SiteAssess(self)],
        #         (SiteAssess(self).__class__, input.finAssess): [self.finishAssess, Assessing(self)],
        #         (SiteAssess(self).__class__, input.startPipe): [self.pipingTransition, Piping(self)],
        #         (Dancing(self).__class__, input.tiredDance): [self.restingTransition, Resting(self)],
        #         (Dancing(self).__class__, input.notTiredDance): [None, Assessing(self)],
        #         (Dancing(self).__class__, input.startPipe): [self.pipingTransition, Piping(self)],
        #         (Resting(self).__class__, input.restingTime): [self.observeTransition, Observing(self)],
        #         (Resting(self).__class__, input.startPipe): [self.pipingTransition, Piping(self)],
        #         (Piping(self).__class__, input.quorum): [None, Commit(self)]
        #     }
        self.attractor = None
        self.attracted = None

        self.repulsor = None
        self.ignore_repulsor = None

        environment.states[self.state.name][self.id] = self.id

    #TRANSitions
    def transition(self):
        self.environment.actions["stateChanges"] += 1
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
        if new_q !=0 :
            site_id=environment.get_q(agent)["id"]



        agent.q_value = new_q
        if agent.q_value > 0:
            agent.potential_site = [agent.location[0], agent.location[1],site_id]
        agent.senseAndProcessAttractor(environment)
        agent.senseAndProcessRepulsor(environment)

    def act(self, agent):
        if(agent.isInfluencedByNearestAttractor()):
            agent.orientTowardsNearestAttractor()
            agent.environment.influenceActions["turns"] +=1
        elif(agent.isRepulsedByNearestRepulsor()):
            agent.avoidNearestRepulsor()
            agent.environment.influenceActions["turns"] += 1
        elif self.inputExplore: #this is for when the user has requested more bees
            delta_d = np.random.normal(0, .009) # this will assure that the bee moves less erratically, it can be decreased a little as well
            agent.direction = (agent.direction + delta_d) % (2 * np.pi)
            agent.environment.influenceActions["turns"]+=1
        else:
            delta_d = np.random.normal(0, .1)
            agent.direction = (agent.direction + delta_d) % (2 * np.pi)

    def update(self, agent):
        agent.counter -= 1
        if agent.q_value > 0:
            return input.nestFound
            #agent.potential_site = [agent.location[0], agent.location[1]]

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

class ReportToHub(State):
    def __init__(self, agent=None):
            self.name = "reportToHub"
            self.siteRadius = 9


    def sense(self, agent, environment):

        return



    def act(self, agent):
        #eprint("Follow Site act")
        # eprint(agent.parameters["PheromoneStrength"])
        agent.move(agent.hub)
        return


    def update(self, agent):
        #eprint("Follow Site update")
        return

class followSite(State):
    def __init__(self, agent=None):
            self.name = "follow_site"
            self.siteRadius = 9


    def sense(self, agent, environment):
        site_id =agent.potential_site[2]
        #TODO Add new pheromone every second instead of every frame
        if time.time()%2==0:
            environment.pheromoneList.append({"agent":agent.id,"pheromone":Pheromone(agent.location)})

        i=0
        for pheromone in environment.pheromoneList:
            if pheromone["agent"]==agent.id:
                if(pheromone["pheromone"].strength<=0):
                    environment.pheromoneList.pop(i)
                else:
                    pheromone["pheromone"].strength-=.1
                    pheromone["pheromone"].r+=.1
            i+=1
        # eprint(len(environment.pheromoneList))
        # if environment.pheromoneList[0]["agent"] == agent.id:
        #     eprint(environment.pheromoneList[0]["agent"])

        for site in environment.sites:
            if site_id == site["id"]:
                dist=distance(agent.location[0],agent.location[1],site["x"],site["y"])
                # agent.numberOfFollowers=environment.get_numberOfAgentsInState(site_id)
                environment.agentsFollowSite[site_id]["number"]=environment.get_numberOfAgentsInState(site_id)
                if environment.agentsFollowSite[site_id]["number"] > 4 and environment.agentsFollowSite[site_id]["reporting"] ==False:
                    environment.agentsFollowSite[site_id]["reporting"]=True
                    agent.reporting=True;
                # agent.agentsFollowingSite=environment.agentsFollowSite[site_id]


                if dist<50:
                    agent.velocity=math.sqrt(site["x"]**2+ site["y"]**2)/10
                    if agent.velocity>2:
                        agent.velocity=2;

                    x= (math.cos(agent.swarmLoc)*10)+site["x"]
                    y= (math.sin(agent.swarmLoc)*10)+site["y"]

                    agent.potential_site=[x, y,site_id]
                    # eprint(agent.swarmDir)
                    if agent.swarmDir==0:
                        agent.swarmLoc+=.1
                    else:
                        agent.swarmLoc-=.1
                else:
                    agent.potential_site=[site["x"], site["y"],site_id]
        return



    def act(self, agent):
        #eprint("Follow Site act")
        # eprint(agent.parameters["PheromoneStrength"])

        return


    def update(self, agent):

        agent.move(agent.potential_site)
        if agent.reporting:
            # eprint ("Switching to Report")
            agent.velocity=1.6
            return input.report
        # if(agent.numberOfFollowers > 4):
        #     agent.velocity=1.6
        #     return input.report
        #eprint("Follow Site update")
        return


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
