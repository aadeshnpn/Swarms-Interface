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
input = Enum('input', 'nestFound report maxAgents startPatrolling goingToSite tooManyAgents reportingFailed finishedReporting returnToSite exploreTime observeTime searchingSites siteFound  restingTime')

class Drone(HubAgent):
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
        self.following=False;
        # bee agent variables
        self.followSiteInfo={"droppingPheromone":False,
                            "pheromoneTimer":0,
                            "pheromoneMaxEmitTime":20,
                            "swarmLoc":0,
                            "swarmDir":np.random.randint(0,2)}

        self.unfollowRest=200
        self.unfollowing=False;
        self.returnedTimer=0;
        self.nextPheromone={"x":None,"y":None}
        self.seesReporter=False

        self.refound=False
        self.returnTimer=1500
        self.reporting=False;
        self.failedReporting=False;
        self.moveToReturn = False;
        self.view=35
        self.returned=False;
        self.reportTime=300;

        self.starting=True;
        self.patrolChance=np.random.rand(1,1)[0][0];
        self.patrolIndex=None;
        self.patrolTo=[]

        self.location = [hub["x"], hub["y"]]
        self.velocity = self.parameters["Velocity"]
        self.potential_site = None  # array [x,y]
        self.q_value = 0
        self.site_q = 0
        self.assessments = 1
        self.dist=np.random.randint(25,500)


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
                (Exploring(self).__class__, input.exploreTime): [self.observeTransition, Observing(self)],
                (followSite(self).__class__, input.report): [None, ReportToHub(self)],
                (followSite(self).__class__, input.tooManyAgents): [None, Exploring(self)],
                (ReportToHub(self).__class__, input.finishedReporting): [None, ReturnToSite(self)],
                (ReportToHub(self).__class__, input.reportingFailed): [self.exploreTransition, Exploring(self)],
                (ReturnToSite(self).__class__, input.reportingFailed): [self.exploreTransition, Exploring(self)],
                (ReturnToSite(self).__class__, input.nestFound): [None, followSite(self)],
                (Observing(self).__class__, input.observeTime): [self.exploreTransition, Exploring(self)],
                (Observing(self).__class__, input.startPatrolling): [None, Exploring(self)],
                (Observing(self).__class__, input.goingToSite): [None, ReturnToSite(self)],
            }
        self.attractor = None
        self.attracted = None

        self.repulsor = None
        self.ignore_repulsor = None

        environment.states[self.state.name][self.id] = self.id

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
        if agent.starting:
            # eprint(agent.patrolChance)
            if agent.patrolChance>=.2 and agent.patrolIndex == None:

                # eprint(len(environment.patrolList))
                if len(environment.patrolList)>0:
                    environment.agentsPatrolling+=1;
                    # eprint(environment.x_limit)
                    # eprint(environment.patrolList)
                    agent.patrolIndex=np.random.randint(0, len(environment.patrolList))
                    agent.patrolTo=[environment.patrolList[agent.patrolIndex]["x"],environment.patrolList[agent.patrolIndex]["y"]]
                    # eprint(agent.patrolTo)
                    del environment.patrolList[agent.patrolIndex]
                else:
                    agent.starting=False;
                    agent.patrolChance=np.random.rand(1,1)[0][0]
                    agent.patrolIndex=None;
            elif agent.patrolIndex != None:
                if ((agent.patrolTo[0] - agent.location[0]) ** 2 + (agent.patrolTo[1] - agent.location[1]) ** 2) ** .5 >= 3 and agent.q_value <= 0:
                    agent.move(agent.patrolTo)
                else:
                    agent.starting=False;
                    environment.agentsPatrolling-=1;
                    # eprint(environment.agentsPatrolling)
                    agent.patrolChance=np.random.rand(1,1)[0][0]
                    agent.patrolIndex=None;
            elif agent.patrolChance<.2:
                # eprint("Agent not in Patrol")
                agent.starting=False;
                agent.patrolChance=np.random.rand(1,1)[0][0]
                agent.patrolIndex=None;

        # eprint(environment.agentsPatrolling)
        agent.checkAgentLeave()
        site_id=None
        new_q = environment.get_q(agent)["q"]
        if new_q !=0:
            # site_id=environment.get_q(agent)["id"]
            site_id=environment.get_siteIDs(agent)
            site_id=site_id[np.random.randint(0, len(site_id))]
            # eprint({site_id}.issubset(environment.sitesToIgnore))
            # numbers2.issubset(numbers1)

        agent.site_q = environment.get_q(agent)["site_q"]
        agent.q_value = new_q
        if site_id is not None:
            if {site_id}.issubset(environment.sitesToIgnore):
                agent.q_value=0
        if agent.q_value > 0 and not {site_id}.issubset(environment.sitesToIgnore):
            agent.potential_site = [agent.location[0], agent.location[1],site_id]

            if(agent.starting):
                agent.starting=False;
                environment.agentsPatrolling-=1
        agent.senseAndProcessAttractor(environment)
        agent.senseAndProcessRepulsor(environment)
        agent.counter -= 1
        if agent.counter<1 and agent.starting:
            environment.agentsPatrolling-=1;

    def act(self, agent):
        if agent.unfollowing:
            agent.unfollowRest-=1
        if agent.unfollowRest <=0:
            agent.unfollowing=False
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

        if agent.q_value > 0 and not agent.unfollowing:
            agent.following=True
            agent.environment.agentsFollowSite[agent.potential_site[2]]["number"]+=1

            return input.nestFound
            #agent.potential_site = [agent.location[0], agent.location[1]]

        elif agent.counter < 1:
            # eprint("Here")
            return input.exploreTime
        else:
            return None

class Observing(State):
    def __init__(self, agent=None):
        self.name = "observing"
        self.seesDancer = False
        self.seesPiper = False
        self.seesReporter=False

    def sense(self, agent, environment):
        # if the agent is in the hub, it will return to exploring and patrolling if there is a patrol list
        if agent.inHub:
            if len(environment.patrolList) >0:
                agent.starting=True;
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
        if agent.starting:
            return input.startPatrolling
        if self.seesReporter is True:
            return input.goingToSite


class ReturnToSite(State):
    def __init__(self, agent=None):
        self.name = "returnToSite"

    def getNextPheromone(self,agent,environment):
        site_id =agent.potential_site[2]
        if not agent.returned:
            x_dif = agent.location[0] - agent.potential_site[0]
            y_dif = agent.location[1] - agent.potential_site[1]
            tot_dif = (x_dif ** 2 + y_dif ** 2) ** .5
            if tot_dif  <=agent.view:
                agent.returned=True
        if agent.returned:
            for pheromone in environment.pheromoneList:

                if agent.potential_site[2] == pheromone["site"]:
                    p =pheromone["pheromone"]
                    x_dif = agent.location[0] - p.x
                    y_dif = agent.location[1] - p.y
                    tot_dif = (x_dif ** 2 + y_dif ** 2) ** .5
                    if tot_dif <= agent.view:
                        if p.x ==agent.nextPheromone["x"]:
                            #if the agent's next pheromone is the current one
                            agent.failedReporting=True

                        else:
                            agent.nextPheromone["x"]=p.x
                            agent.nextPheromone["y"]=p.y
                    # eprint(str(agent.nextPheromone)+" " + str(agent.id))

    def checkIfAtSite(self,agent,environment):
        for site in environment.sites:

            if site.id == agent.potential_site[2]:
                x_dif = agent.location[0] - site.x
                y_dif = agent.location[1] - site.y
                tot_dif = (x_dif ** 2 + y_dif ** 2) ** .5
                if tot_dif <=agent.view:
                    # eprint("Agent has refound site.")
                    agent.returnTimer=1500
                    agent.refound=True

    def sense(self, agent, environment):
        agent.checkAgentLeave();
        agent.returnTimer -= 1
        if agent.returnTimer <= 0:
            # eprint("Agents return timer is Depleted")
            agent.failedReporting = True;
            agent.reporting=False;

        self.getNextPheromone(agent,environment)

        self.checkIfAtSite(agent,environment)
        # eprint(str(agent.id)+" " +str(agent.reportTimer))
        return



    def act(self, agent):
        if not agent.returned :
            agent.move(agent.potential_site)
        elif agent.returned:
            if agent.nextPheromone["x"] and agent.nextPheromone["y"]:
                pheromoneTrail=[agent.nextPheromone["x"],agent.nextPheromone["y"]]
                agent.move(pheromoneTrail)


        return


    def update(self, agent):

        if agent.failedReporting:
            agent.returned =False

            agent.failedReporting=False;

            agent.returnTimer=1500
            agent.refound=False;
            agent.environment.agentsFollowSite[agent.potential_site[2]]["reporting "] = False;
            agent.environment.agentsFollowSite[agent.potential_site[2]]["returnTime"] = 1500;
            agent.environment.agentsFollowSite[agent.potential_site[2]]["number"]-=1
            return input.reportingFailed
        if agent.refound:
            agent.returned =False
            agent.environment.agentsFollowSite[agent.potential_site[2]]["reporting" ] = False
            agent.environment.agentsFollowSite[agent.potential_site[2]]["returnTime"] = 1500

            # eprint(str(agent.id)+" refound site")
            # eprint ("Agent refound site "+str(agent.potential_site[2]))
            agent.returnedTimer=900;
            agent.velocity/=2
            agent.reporting=False
            agent.refound=False;
            return input.nestFound

        #eprint("Follow Site update")
        return

class ReportToHub(State):
    def __init__(self, agent=None):
        self.name = "reportToHub"

    def sense(self, agent, environment):
        # eprint("In report " + str(agent.id))
        agent.returnTimer-=1
        if agent.returnTimer <=0:
            environment.agentsFollowSite[agent.potential_site[2]]["reporting"] =False;
            environment.agentsFollowSite[agent.potential_site[2]]["returnTime"] =1500;
            environment.agentsFollowSite[agent.potential_site[2]]["number"]-=1

        agent.checkAgentReturn()
        return

    def act(self, agent):
        agent.wander(agent.hub, agent.hubRadius)
        if agent.inHub:
            agent.reportTime-=1;
            if agent.reportTime <=0:
                agent.moveToReturn=True;
        return

    def update(self, agent):

        if agent.moveToReturn:
            agent.reportTime=300;
            agent.moveToReturn = False;

            return input.finishedReporting;
        if agent.returnTimer <= 0:
            # eprint("Agent has failed to report site "+str(agent.potential_site[2])+"\nReturning to exploring" )
            agent.returnTimer=1500
            agent.reportTime=300;
            agent.reporting=False;
            return input.reportingFailed


        return

class followSite(State):
    def __init__(self, agent=None):
            self.name = "follow_site"
            self.siteRadius = 9

    def pheromonePhase(self,agent,environment):
        site_id =agent.potential_site[2]
        if environment.agentsFollowSite[site_id]["agentDropPheromone"]<=8:
            agent.followSiteInfo["droppingPheromone"]=True
            environment.agentsFollowSite[site_id]["agentDropPheromone"]+=1

        if not agent.followSiteInfo["droppingPheromone"]:
            return
        if agent.followSiteInfo["pheromoneTimer"] >=agent.followSiteInfo["pheromoneMaxEmitTime"]:
             environment.pheromoneList.append({"agent":agent.id,"pheromone":Pheromone(agent.location),"site":site_id})
             agent.followSiteInfo["pheromoneTimer"]=0
        agent.followSiteInfo["pheromoneTimer"]+=1


    def followClosestSite(self,agent,environment):
        site_id =agent.potential_site[2]
        for site in environment.sites:
            #Make sure the site they are following is the correct site
            if site_id == site.id:
                dist=distance(agent.location[0],agent.location[1],site.x,site.y)
                # environment.agentsFollowSite[site_id]["number"]=environment.get_numberOfAgentsInState(site_id)
                #if there are 2 or more agents, have one report to hub

                if (environment.agentsFollowSite[site_id]["number"] >= 2 and environment.agentsFollowSite[site_id]["number"] <4 and
                 environment.agentsFollowSite[site_id]["reporting"] ==False ):#and agent.returnedTimer <=0

                    agent.reporting=True;
                    environment.agentsFollowSite[agent.potential_site[2]]["reporting"]=True
                    if agent.followSiteInfo["droppingPheromone"]:
                        environment.agentsFollowSite[site_id]["agentDropPheromone"]-=1
                        agent.followSiteInfo["droppingPheromone"]=False;
                    # eprint("Agent is now returning to hub from site "+ str(agent.potential_site[2]))

                if dist<50:
                    agent.velocity=math.sqrt(site.x**2+ site.y**2)/10
                    if agent.velocity>2:
                        agent.velocity=2;

                    x= math.cos(agent.followSiteInfo["swarmLoc"])*20+site.x
                    y= math.sin(agent.followSiteInfo["swarmLoc"])*20+site.y

                    agent.potential_site=[x, y,site_id]
                    # eprint(agent.swarmDir)
                    if agent.followSiteInfo["swarmDir"]==0:
                        agent.followSiteInfo["swarmLoc"]+=.1
                    else:
                        agent.followSiteInfo["swarmLoc"]-=.1
                else:
                    agent.potential_site=[site.x, site.y,site_id]


    def sense(self, agent, environment):
        if agent.returnedTimer >0:
            agent.returnedTimer-=1;
        else:
            agent.returnedTimer=0;
        site_id =agent.potential_site[2]
        #Emits Pheromones and deletes when the pheromone's strength <=0
        self.pheromonePhase(agent,environment)
        #Once the agent finds the site, it will track the site, and fly in a circular pattern around it
        self.followClosestSite(agent,environment)
        if {site_id}.issubset(environment.sitesToIgnore):
            agent.following=False
        if environment.agentsFollowSite[site_id]["number"] >3:
            # eprint("Site " +str(agent.potential_site[2])+ " has more than 3 agents")
            agent.following=False
            environment.agentsFollowSite[site_id]["number"]-=1
        return

    def act(self, agent):
        return

    def update(self, agent):
        agent.move(agent.potential_site)
        if agent.reporting:
            # eprint(str(agent.id)+" reporting")
            agent.velocity*=2
            return input.report
        if not agent.following:
            agent.velocity=1.6
            agent.unfollowing=True
            agent.unfollowRest=200
            agent.potential_site=None
            return input.tooManyAgents
        return
