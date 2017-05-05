import json

from randomdict import RandomDict

from .agent.agent import *
from .debug import *


class beeInfo:
    def __init__(self, direction, velocity, state, AtHub):
        self.direction = direction #stored in degrees
        self.velocity = velocity
        self.state = state
        self.atHub = AtHub
        #include a variable projecting at what time it left the hub? (add later)

class hubController:

    def __init__(self, radius, agents, environment):
        self.reset(radius, agents, environment)
        self.siteDistancePriority = 0
        self.siteSizePriority     = 0

        environment.inputEventManager.subscribe('priorityUpdate', self.handlePriorityUpdate)

    def beeCheckOut(self, bee):
        #eprint("BEECHECKOUT: ")
        #eprint(".. id:", bee.id, "Angle:", np.rad2deg(bee.direction), ".. bee in hub?:", bee.inHub)
        angle = bee.direction % (2*np.pi)
        angle = int(int(angle*(180/np.pi))/5) #converting to fit in the array
        agent = self.agentList[bee.id]
        if (self.directionParams[angle] == -1):      #No user input, all is well
            #eprint("checking out:", bee.id, "direction:", int(bee.direction*(180/np.pi)))
            self.directions[angle] = self.directions[angle] + 1

            if agent.direction is not None:
                self.incoming[int(agent.direction/5)] -= 1

            agent.atHub = 0
            del self.agentsInHub[bee.id]
            agent.direction = angle * 5

        elif self.directionParams[angle] < self.directions[angle]: #too many bees, stop it!
            #eprint("INHIBITED!!!!! ")
            #eprint("Angle:", angle, "  Id:", bee.id, "  Bee in hub?:", bee.inHub)
            bee.state = Observing(bee)

        elif (self.directionParams[angle] > self.directions[angle]): #there needs to be more bees in that direction anyways
            #eprint("checking out:", bee.id, "direction:", int(bee.direction*(180/np.pi)))
            self.directions[angle] = self.directions[angle] + 1
            if agent.direction is not None:
                self.incoming[int(agent.direction/5)] -= 1
            agent.atHub = 0
            del self.agentsInHub[bee.id]
            agent.direction = angle * 5

        elif self.directionParams[angle] == self.directions[angle]: #perfect amount of bees, stop it
            #eprint("INHIBITED!!!!! ")
            #eprint("Angle:", angle, "  Id:", bee.id, "  Bee in hub?:", bee.inHub)
            bee.state = Observing(bee)


        #eprint("going in:", agent.direction)
        agent.state = bee.state


        return agent.atHub
        #******if explorer set a timer for it, if assessor calculate projected time
        #so upon check out state is used to gauge stuff for right now it can just be used as the array

    def beeCheckIn(self, bee): #technically only explorers or assessors will ever call this (which they do as they enter the hub)
        #TODO check if they are coming in from a weird angle if they're assessors, which can be a 'red flag'
        #eprint("checking in:", id, " Initial direction:", self.agentList[id].direction, " from:", int(dir*(180/np.pi))+180)
        angle = int(self.agentList[bee.id].direction/5)

        self.directions[angle] = self.directions[angle] - 1
        angle2 = (bee.direction- np.pi) % (2 * np.pi)
        angle2 = int(int(angle2 * (180 / np.pi)) / 5)
        self.incoming[angle2] += 1
        self.agentList[bee.id].atHub = 1
        self.agentList[bee.id].direction = angle2*5
        self.agentsInHub[bee.id] = bee
        if isinstance(bee.state, Piping):
            self.piperCount +=1

        if (isinstance(bee.state, Assessing)):
            print (json.dumps({"type": "updateMission", "data": {"x": bee.potential_site[0] , "y": bee.potential_site[1], "q": bee.q_value}}))

    def handleRadialControl(self, jsonInput):
        jsonDict = jsonInput['state'] # id, dictionary(r:radian, deg: degrees, val: 1-30)
        self.directionInput(jsonDict['deg'],jsonDict['val'])

    def directionInput(self, direction, newValue): #user inhibits or excites the amount of bees in each direction
                                                    #direction is given in degrees

        angle = int(int(direction % 360) / 5)   # converting to fit in the array

        self.directionParams[angle] = int(newValue)
    def observersCheck(self):
        return self.agentsInHub.random_value()
        #if bee.state ==
    def piperCheck(self):
        if len(self.agentsInHub) <= self.piperCount:
            return True
        return False
    def newPiper(self):
        self.piperCount += 1


    def hiveAdjust(self, bees):
        #sortedParams = sorted(self.directionParams, operator.getitem(1), Reverse=True)
        # ^^this is so it will adjust the bees based on the biggest difference or the lowest difference first, an option if this is a problem
        for counter in range(0, 72): #the one problem with this is then the lower buckets have priority of sending bees out hence ^^
            angle = counter
            if self.directionParams[angle] == -1:  # No user input, all is well
                pass
            elif self.directionParams[angle] < self.directions[angle]:  # too many bees, just keep stopping them from leaving
                pass
            elif self.directionParams[angle] > self.directions[angle]:  # not enough bees send out more! from observers

                for id,bee in bees.items(): #use environment classes soon.
                    if bee.state.__class__ == Observing().__class__ and bee.inHub is True: #to speed up keep a list of the observers..
                        if np.random.random() < 0.05: #this gives a 50% chance of it happening
                            break
                        #eprint("hiveadjust: ")
                        #eprint("angle:",angle*5, ".. id:",bee.id, ".. bee in hub?:", bee.inHub)

                        bee.state = Exploring(bee)
                        bee.state.inputExplore=True
                        bee.state.exploretime *= 0.5 #since the bees are going out in an almost straight line.
                        bee.direction = ((angle*5)/180)*np.pi
                        self.directions[angle] += 1
                        agent = self.agentList[bee.id]
                        agent.direction = angle*5
                        agent.atHub = 0
                        bee.inHub = False
                        del self.agentsInHub[bee.id]
                        break # only execute this once per iteration, that way it's a 'slow' change
            elif self.directionParams[angle] == self.directions[angle]:  #meaning it has reached the user's requirements
                self.directionParams[angle] = -1

        radialJson = {
            "type": "updateRadial",
            "data":
            {
                "controller":
                {
                    "agentDirections" : self.directions,
                    "agentsIn" : self.incoming
                }
            }
        }

        print(json.dumps(radialJson))


    def reset(self, radius, agents, environment):
        self.incoming = [None] *72
        self.environment = environment
        self.radius = radius  # needs an array of direction parameters
        self.directions = [None]*72  # #bees that have left the hub in each direction
        self.directionParams = [None]*72  #desired user values

        self.agentsInHub = RandomDict()
        self.agentList = {}
        for counter in range(0, 72):
            self.directions[counter] = 0
            self.directionParams[counter] = -1
            self.incoming[counter] = 0
        # self.directionParams[10] = 10
        for id, bee in agents.items():
            info = beeInfo(None, bee.velocity, bee.state, 1)
            self.agentList[bee.id] = info

            self.agentsInHub[id] = bee
        self.piperCount = 0


    def convertToIndex(self, degrees):
        int(int(degrees % 360) / 5)

    def getSitePriorities(self):
        return {"distance": self.siteDistancePriority, "size": self.siteSizePriority}

    def handlePriorityUpdate(self, json_dict):
        self.siteDistancePriority = float(json_dict["sitePriorities"]["distance"])
        self.siteSizePriority     = float(json_dict["sitePriorities"]["size"])

        priorityJson = {
            "type": "updateSitePriorities",
            "data":
            {
                "controller":
                {
                    "sitePriorities" :
                    {
                        "distance" : self.siteDistancePriority,
                        "size"     : self.siteSizePriority
                    }
                }
            }
        }

        print(json.dumps(priorityJson))

    def update_parameters(self, agent, parameters):
        eprint("Updating", agent.id, "parameters")
        agent.parameters = parameters
