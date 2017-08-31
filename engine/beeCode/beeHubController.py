import json

from randomdict import RandomDict
import copy
from .agent.beeAgent import *
from utils.debug import *
import time
import numpy as np
from sympy.geometry import *
from .hubController import HubController

class beeInfo:
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

#TODO: move import statements to top of file

class BeeHubController(HubController):
    def __init__(self, radius, agents, environment, exploreTime):
        self.reset(radius, agents, environment, exploreTime)
        self.siteDistancePriority = 0
        self.siteSizePriority = 0

        self.no_viewer = environment.args.no_viewer

        environment.inputEventManager.subscribe('priorityUpdate', self.handlePriorityUpdate)

    def agentLeave(self,angle,id):
        self.directions[angle] += 1
        agent = self.agentList[id]
        if agent.direction is not None:
            self.incoming[int(agent.direction / 5)] -= 1
        agent.checkOut(angle * 5, self.agentsInHub[id].state)
        self.agentsInHub[id].priorities = self.getSitePriorities()
        del self.agentsInHub[id]

    def handleRadialControl(self, jsonInput):
        jsonDict = jsonInput['state']  # id, dictionary(r:radian, deg: degrees, val: 1-30)
        self.directionInput(jsonDict['deg'], jsonDict['val'])

    def directionInput(self, direction, newValue):  # user inhibits or excites the amount of bees in each direction
        # direction is given in degrees

        angle = int(int(direction % 360) / 5)  # converting to fit in the array

        self.directionParams[angle] = int(newValue)
    def emitUpdateParams(self, params,time):
        self.time = time
        for id,bee in self.agentsInHub.items():
            bee.updateParams(copy.copy(params),self.time)
    def observersCheck(self):
        return self.agentsInHub.random_value()

    def piperCheck(self):
        if len(self.agentsInHub) <= self.piperCount:
            return True
        return False

    def newPiper(self):
        self.piperCount += 1

    def hiveAdjust(self, bees):
        # sortedParams = sorted(self.directionParams, operator.getitem(1), Reverse=True)

        #This code is checking for the dead bees
        if self.exploreCounter < 1 and not self.piperCheck():
            for id, beeInf in self.agentList.items():
                if beeInf.returnedToHub:
                    pass
                elif beeInf.dead is False:
                    beeInf.dead = True
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
                for id, bee in self.agentsInHub.items():
                    if bee.state.__class__ == Observing().__class__ and bee.inHub is True:
                        if np.random.random() > 0.05:  # this gives a 5% chance of it happening
                            break
                        #updating bee info
                        bee.state = Exploring(bee)
                        bee.exploreTransition()
                        bee.state.inputExplore = True
                        bee.counter *= 0.35  # since the bees are going out in an almost straight line: less exploretime
                        bee.direction = ((angle * 5) / 180) * np.pi
                        bee.inHub = False

                        self.environment.influenceActions["turns"] += 1
                        self.environment.influenceActions["stateChanges"] += 1

                        self.agentLeave(angle, bee.id)
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
                            "dead": self.deadBees,
                            "actions": self.environment.actions,
                            "influenceActions": self.environment.influenceActions
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
        for id, bee in agents.items():
            direction = None
            info = beeInfo(direction, bee.velocity, bee.state, 1, False,id)
            self.agentList[bee.id] = info
            self.agentsInHub[id] = bee
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
        #self.siteDistancePriority = float(json_dict["sitePriorities"]["distance"])
        #self.siteSizePriority = float(json_dict["sitePriorities"]["size"])
        self.siteDistancePriority = 0
        self.siteSizePriority = 0
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
