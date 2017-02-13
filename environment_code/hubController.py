from agent.agent import *
import numpy as np
from debug import *
import operator
class beeInfo:
    def __init__(self, direction, velocity, state, AtHub):
        self.direction = direction #stored in degrees
        self.velocity = velocity
        self.state = state
        self.atHub = AtHub
        #include a variable projecting at what time it left the hub? (add later)

class hubController:
    def __init__(self, radius, agents):
        self.reset(radius, agents)

    def beeCheckOut(self, bee):
        angle = bee.direction % (2*np.pi)
        angle = int(int(angle*(180/np.pi))/5)*5 #converting to fit in the array
        agent = self.agentList[bee.id]
        if (self.directionParams[angle] == -1):      #No user input, all is well
            self.directions[angle] = self.directions[angle] + 1
            agent.atHub = 0
        elif self.directionParams[angle] < self.directions[angle]: #too many bees, stop it!
            bee.state = Observing(bee)
        elif (self.directionParams[angle] > self.directions[angle]): #there needs to be more bees in that direction anyways
            self.directions[angle] = self.directions[angle] + 1
            agent.atHub = 0
        elif self.directionParams[angle] == self.directions[angle]: #perfect amount of bees, stop it
            bee.state = Observing(bee)

        agent.direction = angle
        agent.state = bee.state
        return agent.atHub
         #******if explorer set a timer for it, if assessor calculate projected time
        #so upon check out state is used to gauge stuff for right now it can just be used as the array

    def beeCheckIn(self, id,dir): #technically only explorers or assessors will ever call this (which they do as they enter the hub)
        #check if they are coming in from a weird angle if they're assessors, which can be a 'red flag'
        angle = self.agentList[id].direction

        angle = angle % (2 * np.pi)
        angle = int(int(angle * (180 / np.pi)) / 5) * 5  # converting to fit in the array
        self.directions[angle] = self.directions[angle] - 1

        self.agentList[id].atHub = 1

    def handleRadialControl(self, jsonInput):
        #eprint(jsonInput)
        jsonDict = jsonInput['state'] # id, dictionary(r:radian, deg: degrees, val: 1-30)
        self.directionInput(jsonDict['deg'],jsonDict['val'])

    def directionInput(self, direction, newValue): #user inhibits or excites the amount of bees in each direction
                                                    #direction is given in degrees

        angle = int(int(direction % 360) / 5) * 5  # converting to fit in the array

        self.directionParams[angle] = int(newValue)
        #eprint(angle)
        #eprint(int(newValue))

    def hiveAdjust(self, bees):
        #sortedParams = sorted(self.directionParams, operator.getitem(1), Reverse=True)
        # ^^this is so it will adjust the bees based on the biggest difference or the lowest difference first, an option if this is a problem
        for counter in range(0, 71): #the one problem with this is then the lower buckets have priority of sending bees out hence ^^
            angle = counter*5
            if self.directionParams[angle] == -1:  # No user input, all is well
                #eprint("test1")
                pass
            elif self.directionParams[angle] < self.directions[angle]:  # too many bees, just keep stopping them from leaving
                #eprint("test2")
                pass
            elif self.directionParams[angle] > self.directions[angle]:  # not enough bees send out more! from observers

                for id,bee in bees.items():
                    if bee.state.__class__ == Observing().__class__ and bee.inHub is True: #to speed up keep a list of the observers..
                        if np.random.random() < 0.5: #this gives a 50% chance of it happening
                            break
                        eprint("hiveadjust: ")
                        eprint("angle: ",angle, ".. id: ",bee.id, ".. bee in hub?: ", bee.inHub)
                        bee.state = Exploring(bee)
                        bee.state.inputExplore=True
                        bee.state.exploretime *= 0.5 #since the bees are going out in an almost straight line.
                        bee.direction = (angle/180)*np.pi
                        self.directions[angle] += 1
                        agent = self.agentList[bee.id]
                        agent.direction = angle
                        agent.atHub = 0
                        bee.inHub = False
                        break # only execute this once per iteration, that way it's a 'slow' change
            elif self.directionParams[angle] == self.directions[angle]:  #meaning it has reached the user's requirements
                self.directionParams[angle] = -1


    def reset(self, radius, agents):
        self.radius = radius  # needs an array of direction parameters
        self.directions = {}  # #bees that have left the hub in each direction
        self.directionParams = {}  # #desired user values
        # counter * (np.pi / 72)
        self.agentList = {}
        for counter in range(0, 72):
            self.directions[counter * 5] = 0
            self.directionParams[counter * 5] = -1
        # self.directionParams[10] = 10
        for id, bee in agents.items():
            info = beeInfo(int(bee.direction * (180 / np.pi)), bee.velocity, bee.state, 1)
            self.agentList[bee.id] = info
