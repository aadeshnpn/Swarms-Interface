import json

from randomdict import RandomDict
import copy
from droneCode.agent.droneAgent import *
from utils.debug import *
import time
import numpy as np
from sympy.geometry import *
class droneInfo:
    def __init__(self, direction, velocity, state, AtHub, ret,id):
        self.direction = direction  # stored in degrees
        self.velocity = velocity
        self.state = state
        self.atHub = AtHub
        self.returnedToHub = ret
        self.dead = False
        self.id= id

        # include a variable projecting at what time it left the hub? (add later)
    def checkOut(self, direction, state):
        self.state = state
        self.direction = direction
        self.atHub =0
        self.returnedToHub = False
    def checkIn(self, direction, state):
        self.state = state
        self.direction = direction
        self.atHub = 1
        self.returnedToHub = True
class HubController:
    def __init__(self, radius, agents, environment, exploreTime):
        self.reset(radius, agents, environment, exploreTime)
        self.siteDistancePriority = 0
        self.siteSizePriority = 0
        # self.agentsInHub={}
        self.no_viewer = environment.args.no_viewer

        environment.inputEventManager.subscribe('priorityUpdate', self.handlePriorityUpdate)

    def checkoutPatrolRect(self, agent):
        return self.patrol_rects[0]

    def isCheckOutNeeded(self):
        for p in self.patrol_routes:
            if(len(p["ids"]) == 0):
                return True
        return False

    def checkOutPatrolRoute(self, agent):
        eprint(str(agent.id) + "checking out")
        min_sum = 100000000
        min_ind = 0
        for i in range(0, len(self.patrol_routes)):
            s = 0
            for uav_id in self.patrol_routes[i]["ids"]:
                if(agent.environment.agents[uav_id].state.__class__.__name__ == "UAV_Patrolling"):
                    s += agent.environment.agents[uav_id].counter
            if(s < min_sum):
                min_sum = s
                min_ind = i
            #if(len(self.patrol_routes[i]["ids"]) < len(self.patrol_routes[min_ind]["ids"])):
            #    min_ind = i
        self.patrol_routes[min_ind]["ids"].append(agent.id)
        eprint(self.patrol_routes[min_ind])
        return self.patrol_routes[min_ind]
        #return self.patrol_routes[np.random.randint(len(self.patrol_routes))]
    def checkInPatrolRoute(self, agent):
        eprint(str(agent.id) + "checking in")
        for p in self.patrol_routes:
            if agent.id in p["ids"]:
                p["ids"].remove(agent.id)
                break
        eprint(self.patrol_routes)
        #assert(False)

    def agentLeave(self,angle,id):
        self.directions[angle] += 1
        agent = self.agentList[id]
        if agent.direction is not None:
            self.incoming[int(agent.direction / 5)] -= 1
        agent.checkOut(angle * 5, self.agentsInHub[id].state)
        self.agentsInHub[id].priorities = self.getSitePriorities()
        del self.agentsInHub[id]

    def checkOut(self, agent):
        angle = agent.direction % (2 * np.pi)
        angle = int(int(angle * (180 / np.pi)) / 5)  # converting to fit in the array
        agent = self.agentList[agent.id]
        if (self.directionParams[angle] == -1):  # No user input, all is well
            self.agentLeave(angle, agent.id)
        elif self.directionParams[angle] < self.directions[angle]:  # too many bees, stop it!
            agent.state = Observing(agent)
            agent.observeTransition()
        elif (self.directionParams[angle] > self.directions[angle]):  # there needs to be more bees in that direction
            self.agentLeave(angle,agent.id)
        elif self.directionParams[angle] == self.directions[angle]:  # perfect amount of bees, stop it
            agent.state = Observing(agent)
            agent.observeTransition()
        agent.state = agent.state

        return agent.atHub
        # TODO if explorer set a timer for it, if assessor calculate projected time

    def checkIn(self,agent):
        # TODO check a map of where they've been to figure out where traps are.
        #eprint("checking in:", id, " Initial direction:", self.agentList[id].direction, " from:", int(dir*(180/np.pi))+180)

        #angle calculations
        exitAngle = int(self.agentList[agent.id].direction / 5)
        inAngle = (agent.direction - np.pi) % (2 * np.pi)
        inAngle = int(int(inAngle * (180 / np.pi)) / 5)

        agent.updateParams(copy.copy(self.environment.parameters),self.time)

        #updating hub info and agents
        self.directions[exitAngle] = self.directions[exitAngle] - 1
        self.incoming[inAngle] += 1
        self.agentList[agent.id].checkIn(inAngle*5, agent.state)
        self.agentsInHub[agent.id] = agent


        if self.agentList[agent.id].dead:
            self.agentList[agent.id].dead = False
            self.deadBees -= 1

        # eprint(type(agent.state))
        if (isinstance(agent.state,ReportToHub) and not self.no_viewer):
            # eprint(str(bee.state) + " in the hub")
            # eprint("HERE")
            print(json.dumps({"type": "updateMission",
                              "data": {"x": agent.potential_site[0], "y": agent.potential_site[1],"id":agent.potential_site[2], "q": agent.q_value, "site_q": agent.site_q}}))


    def handleRadialControl(self, jsonInput):
        jsonDict = jsonInput['state']  # id, dictionary(r:radian, deg: degrees, val: 1-30)
        self.directionInput(jsonDict['deg'], jsonDict['val'])

    def directionInput(self, direction, newValue):  # user inhibits or excites the amount of bees in each direction
        # direction is given in degrees

        angle = int(int(direction % 360) / 5)  # converting to fit in the array

        self.directionParams[angle] = int(newValue)
    def emitUpdateParams(self, params,time):
        self.time = time
        for id,agent in self.agentsInHub.items():
            agent.updateParams(copy.copy(params),self.time)
    def observersCheck(self):
        return self.agentsInHub.random_value()

    def piperCheck(self):
        if len(self.agentsInHub) <= self.piperCount:
            return True
        return False

    def newPiper(self):
        self.piperCount += 1

    def hiveAdjust(self, agents):
        # sortedParams = sorted(self.directionParams, operator.getitem(1), Reverse=True)

        #This code is checking for the dead bees
        if self.exploreCounter < 1 and not self.piperCheck():
            for id, droneInf in self.agentList.items():
                if droneInf.returnedToHub:
                    pass
                elif droneInf.dead is False:
                    droneInf.dead = True
                    self.deadBees += 1
            self.exploreCounter = self.exploreTime * 1.5
                    # self.environment.parameter[""]# how to change the parameters?????
                    # TODO change the parameters based on how many dead bees
        else:
            self.exploreCounter -= 1

        for counter in range(0, 72):
            angle = counter
            if self.directionParams[angle] == -1:  # No user input, all is well
                pass
            elif self.directionParams[angle] < self.directions[angle]:
                pass # too many bees, just keep stopping them from leaving
            elif self.directionParams[angle] > self.directions[angle]:  # not enough bees send out more! from observers

                #for id, bee in bees.items():  # TODO to speed up use the in hub agents
                for id, agent in self.agentsInHub.items():
                    if agent.state.__class__ == Observing().__class__ and agent.inHub is True:
                        if np.random.random() > 0.05:  # this gives a 5% chance of it happening
                            break
                        #updating bee info
                        agent.state = Exploring(agent)
                        agent.exploreTransition()
                        agent.state.inputExplore = True
                        agent.counter *= 0.35  # since the bees are going out in an almost straight line: less exploretime
                        agent.direction = ((angle * 5) / 180) * np.pi
                        agent.inHub = False

                        self.agentLeave(angle,agent.id)
                        break  # only execute this once per iteration, that way it's a 'slow' change
            elif self.directionParams[angle] == self.directions[angle]:
                # meaning it has reached the user's requirements
                self.directionParams[angle] = -1

        radialJson = {
            "type": "updateRadial",
            "data":
                {
                    "controller":
                        {
                            "hub": self.environment.hub,
                            "agentDirections": self.directions,
                            "agentsIn": self.incoming,
                            "dead": self.deadBees
                            #"dPos": self.dPos;
                        }
                }
        }

        if not self.no_viewer:
            print(json.dumps(radialJson))



    def reset(self, radius, agents, environment, exploreTime):
        self.incoming = [None] * 72
        self.environment = environment
        self.radius = radius  # needs an array of direction parameters
        self.directions = [None] * 72  # #bees that have left the hub in each direction
        self.directionParams = [None] * 72  # desired user values

        self.agentsInHub = RandomDict()
        self.agentList = {}
        for counter in range(0, 72):
            self.directions[counter] = 0
            self.directionParams[counter] = -1
            self.incoming[counter] = 0
        # self.directionParams[10] = 10
        for id, agent in agents.items():
            direction = None
            info = droneInfo(direction, agent.velocity, agent.state, 1, False,id)
            self.agentList[agent.id] = info
            self.agentsInHub[id] = agent
        self.piperCount = 0
        self.exploreTime = int(exploreTime)
        self.exploreCounter = int(exploreTime * 1.2)
        self.deadBees = 0
        self.time = 0
        self.stateCounts ={"searching": 0, "assessing": 0, "commit": 0 }

    def convertToIndex(self, degrees):
        int(int(degrees % 360) / 5)

    def getSitePriorities(self):
        return {"distance": self.siteDistancePriority, "size": self.siteSizePriority}

    def handlePriorityUpdate(self, json_dict):
        self.siteDistancePriority = float(json_dict["sitePriorities"]["distance"])
        self.siteSizePriority = float(json_dict["sitePriorities"]["size"])

        priorityJson = {
            "type": "updateSitePriorities",
            "data":
                {
                    "controller":
                        {
                            "sitePriorities":
                                {
                                    "distance": self.siteDistancePriority,
                                    "size": self.siteSizePriority
                                }
                        }
                }
        }

        print(json.dumps(priorityJson))

    def update_parameters(self, agent, parameters):
        eprint("Updating", agent.id, "parameters")
        agent.parameters = parameters
