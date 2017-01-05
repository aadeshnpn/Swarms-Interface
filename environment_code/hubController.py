from agent.agent import *
import numpy as np
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

    def beeCheckout(self, angle, id, state):
        angle = angle % (2*np.pi)
        angle = int(int(angle*(180/np.pi))/5)*5 #converting to fit in the array
        if self.directionParams[angle] == -1:      #No user input, all is well
            self.directions[angle] = self.directions[angle] + 1
        elif self.directionParams[angle] < self.directions[angle]: #this is where it should stop the bee...
            pass
        elif self.directionParams[angle] > self.directions[angle]: #there needs to be more bees in that direction
            self.directions[angle] = self.directions[angle] + 1
        elif self.directionParams[angle] == self.directions[angle]: #This is where it should set it = 0
            pass


        self.agentList[id].direction = angle
        #self.agentList[id].velocity = maybe add this later??
        self.agentList[id].state = state
        self.agentList[id].atHub = 0 #******if explorer set a timer for it, if assessor calculate projected time
        #so upon check out state is used to gauge stuff for right now it can just be used as the array
        pass
    def beeCheckIn(self, id,dir): #technically only explorers or assessors will ever call this (which they do as they enter the hub)
        #check if they are coming in from a weird angle if they're assessors, which can be a 'red flag'
        angle = self.agentList[id].direction

        angle = angle % (2 * np.pi)
        angle = int(int(angle * (180 / np.pi)) / 5) * 5  # converting to fit in the array
        if self.directionParams[angle] == -1:  # No user input, all is well
            self.directions[angle] = self.directions[angle] - 1
        elif self.directionParams[angle] < self.directions[angle]:  # too many bees, accept it.
            self.directions[angle] = self.directions[angle] - 1
        elif self.directionParams[angle] > self.directions[angle]:  # not enough bees, maybe send it out again??
            self.directions[angle] = self.directions[angle] + 1
        elif self.directionParams[angle] == self.directions[angle]:  # This is where it should set it = 0
            pass


        self.agentList[id].atHub = 1


    def directionInput(self, direction, newValue): #user inhibits or excites the amount of bees in each direction
                                                    #direction is given in degrees
        angle = int(int(direction % 360) / 5) * 5  # converting to fit in the array

        self.directionParams[angle] = newValue

   # def hiveAdjust(self, bees): #this will be called by the observers as they are doing they're update function (they check with the hub)


    def hiveAdjust(self, bees):
        for counter in range(0, 71):
            angle = counter*5
            if self.directionParams[angle] == -1:  # No user input, all is well
                pass
            elif self.directionParams[angle] < self.directions[angle]:  # too many bees, just keep stopping them from leaving
                pass
            elif self.directionParams[angle] > self.directions[angle]:  # not enough bees send out more! from observers
                for bee in bees:
                    if bee.state is Observing():
                        bee.state = Exploring()
                        #so now should it be an explorer or an assesor...
                        #so there are two options, the problem with the assessor is that it could miss anything out there by 5 degrees..

                        #so we can start by having it work with 2 degrees... or we can start by having the user change states of everything

            elif self.directionParams[angle] == self.directions[angle]:  # This is where it should set it = 0
                self.directionParams[angle] = -1

#So the biggest question is how we can excite the bees in each direction...
# Do we just pull the bees from each direction? How can we do that if the user has excited several areas...
# I mean we can pull from observers, then resters (check to see dance ratio) make them explorers in that direction, but the problem comes when too many areas have been excited
#
# The other question is if we want it to be in ratios or in numbers of bees
#
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
#
# If we want to also control the state changer, we can just change state of any resters
#
# have an array of bees, id, state
