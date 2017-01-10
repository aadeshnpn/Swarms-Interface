from agent.agent import *
import numpy as np
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
        self.radius = radius   #needs an array of direction parameters
        self.directions = {} # #bees that have left the hub in each direction
        #this will be added into by dividing by pi/36 (or 5 degrees) and rounding to get index
        # at each direction there will be a count of the bees in that direction (or a list of pointers to the bee infos
        self.directionParams = {} # #desired user values
        # counter * (np.pi / 72)
        self.agentList= {}
        for counter in range(0, 71):
            self.directions[counter*5] = 0
            self.directionParams[counter*5] = -1

        for bee in agents:
            info = beeInfo(int(bee.direction*(180/np.pi)), bee.velocity, bee.state, 1)
            self.agentList[bee.id] = info

    def beeCheckout(self, bee):
        angle = bee.direction % (2*np.pi)
        angle = int(int(angle*(180/np.pi))/5)*5 #converting to fit in the array
        agent = self.agentList[bee.id]
        if (self.directionParams[angle] == -1) and (agent.atHub):      #No user input, all is well
            self.directions[angle] = self.directions[angle] + 1
            agent.atHub = 0
        elif self.directionParams[angle] < self.directions[angle]: #too many bees, stop it!
            bee.state = Observing()
        elif (self.directionParams[angle] > self.directions[angle]) and (agent.atHub): #there needs to be more bees in that direction anyways
            self.directions[angle] = self.directions[angle] + 1
            agent.atHub = 0
        elif self.directionParams[angle] == self.directions[angle]: #perfect amount of bees, stop it
            bee.state = Observing()


        agent.direction = angle
        agent.state = bee.state
         #******if explorer set a timer for it, if assessor calculate projected time
        #so upon check out state is used to gauge stuff for right now it can just be used as the array

    def beeCheckIn(self, id,dir): #technically only explorers or assessors will ever call this (which they do as they enter the hub)
        #check if they are coming in from a weird angle if they're assessors, which can be a 'red flag'
        angle = self.agentList[id].direction

        angle = angle % (2 * np.pi)
        angle = int(int(angle * (180 / np.pi)) / 5) * 5  # converting to fit in the array
        self.directions[angle] = self.directions[angle] - 1

        self.agentList[id].atHub = 1


    def directionInput(self, direction, newValue): #user inhibits or excites the amount of bees in each direction
                                                    #direction is given in degrees
        angle = int(int(direction % 360) / 5) * 5  # converting to fit in the array

        self.directionParams[angle] = newValue

    def hiveAdjust(self, bees):
        #sortedParams = sorted(self.directionParams, operator.getitem(1), Reverse=True)
        # ^^this is so it will adjust the bees based on the biggest difference or the lowest difference first, an option if this is a problem
        for counter in range(0, 71): #the one problem with this is then the lower buckets have priority of sending bees out hence ^^
            angle = counter*5

            if self.directionParams[angle] == -1:  # No user input, all is well
                pass
            elif self.directionParams[angle] < self.directions[angle]:  # too many bees, just keep stopping them from leaving
                pass
            elif self.directionParams[angle] > self.directions[angle]:  # not enough bees send out more! from observers
                for bee in bees:
                    if bee.state.__class__ == Observing().__class__:
                        bee.state = Exploring()
                        bee.state.inputExplore=True
                        bee.state.exploretime *= 0.5 #since the bees are going out in an almost straight line.
                        self.directions[angle] -= 1
                        #TODO: have the hub remember this bee and include it in its count
                        agent = self.agentList[bee.id]
                        agent.direction = angle
                        agent.atHub = 0
                        break # only execute this once per iteration, that way it's a 'slow' change
            elif self.directionParams[angle] == self.directions[angle]:  #meaning it has reached the user's requirements
                self.directionParams[angle] = -1

#the user wants be a dotted line, and a solid line be the actual extention of that direction
# each bee as it leaves will check/tell the controller what it is doing (angle and velocity)
# if it is not supposed to leave it will immediately become a resting bee

# Hub functionality:
# keep track of where each bee leaves
#    maybe keep track of when they should return (if they are an assessor
#   have bees check in check out (sensor model)
# send array of epileptic blob maybe?
# create possible mission goal blobs
# take input from the environment class and adjust how many are allowed to leave based on that
