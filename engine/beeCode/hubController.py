import json

from randomdict import RandomDict

from .agent.agent import *
from utils.debug import *


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
    def checkOut(self, direction):
        self.direction = direction
        self.atHub =0
        self.returnedToHub = False
    def checkIn(self, direction):
        self.direction = direction
        self.atHub = 1
        self.returnedToHub = True


class hubController:
    def __init__(self, radius, agents, environment, exploreTime):
        self.reset(radius, agents, environment, exploreTime)
        self.siteDistancePriority = 0
        self.siteSizePriority = 0

        self.no_viewer = environment.args.no_viewer

        environment.inputEventManager.subscribe('priorityUpdate', self.handlePriorityUpdate)

    def beeCheckOut(self, bee):
        angle = bee.direction % (2 * np.pi)
        angle = int(int(angle * (180 / np.pi)) / 5)  # converting to fit in the array
        agent = self.agentList[bee.id]
        if (self.directionParams[angle] == -1):  # No user input, all is well
            self.agentLeave(angle, bee.id)

        elif self.directionParams[angle] < self.directions[angle]:  # too many bees, stop it!
            bee.state = Observing(bee)
            bee.observingTransition()

        elif (self.directionParams[angle] > self.directions[angle]):  # there needs to be more bees in that direction
            self.agentLeave(angle,bee.id)

        elif self.directionParams[angle] == self.directions[angle]:  # perfect amount of bees, stop it
            bee.state = Observing(bee)
            bee.observingTransition()

        agent.state = bee.state
        return agent.atHub
        # TODO if explorer set a timer for it, if assessor calculate projected time

    def beeCheckIn(self,bee):
        # TODO check if they are coming in from a weird angle if they're assessors, which can be a 'red flag'
        #eprint("checking in:", id, " Initial direction:", self.agentList[id].direction, " from:", int(dir*(180/np.pi))+180)

        #angle calculations
        exitAngle = int(self.agentList[bee.id].direction / 5)
        inAngle = (bee.direction - np.pi) % (2 * np.pi)
        inAngle = int(int(inAngle * (180 / np.pi)) / 5)

        #updating hub info and agents
        self.directions[exitAngle] = self.directions[exitAngle] - 1
        self.incoming[inAngle] += 1
        self.agentList[bee.id].checkIn(inAngle*5)
        self.agentsInHub[bee.id] = bee

        if self.agentList[bee.id].dead:
            self.agentList[bee.id].dead = False
            self.deadBees -= 1
        if isinstance(bee.state, Piping):
            self.piperCount += 1

        if (isinstance(bee.state, Assessing) and not self.no_viewer):
            print(json.dumps({"type": "updateMission",
                              "data": {"x": bee.potential_site[0], "y": bee.potential_site[1], "q": bee.q_value}}))

    def handleRadialControl(self, jsonInput):
        jsonDict = jsonInput['state']  # id, dictionary(r:radian, deg: degrees, val: 1-30)
        self.directionInput(jsonDict['deg'], jsonDict['val'])

    def directionInput(self, direction, newValue):  # user inhibits or excites the amount of bees in each direction
        # direction is given in degrees

        angle = int(int(direction % 360) / 5)  # converting to fit in the array

        self.directionParams[angle] = int(newValue)

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
                    self.exploreCounter = self.exploreTime * 1.2
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

                for id, bee in bees.items():  # TODO to speed up use the in hub agents
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

                        self.agentLeave(angle,bee.id)
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
                            "agentDirections": self.directions,
                            "agentsIn": self.incoming,
                            "dead": self.deadBees
                        }
                }
        }

        if not self.no_viewer:
            print(json.dumps(radialJson))

    def agentLeave(self,angle,id):
        self.directions[angle] += 1
        agent = self.agentList[id]
        if agent.direction is not None:
            self.incoming[int(agent.direction / 5)] -= 1
        agent.checkOut(angle * 5)
        del self.agentsInHub[id]

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
