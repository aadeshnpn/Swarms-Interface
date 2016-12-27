from agent.agent import *
class beeInfo:
    def __init__(self, direction, velocity, state):
        self.direction = direction
        self.velocity = velocity
        self.state = state
        #include a variable projecting at what time it left the hub? (add later)

class hubController:
    def __init__(self, radius, agents):
        self.radius = radius   #needs an array of direction parameters
        self.directions = {} #this will be added into by dividing by pi/36 (or 5 degrees) and rounding to get index
        # at each direction there will be a count of the bees in that direction (or a list of pointers to the bee infos
        # counter * (np.pi / 72)
        agentList= {}
        for counter in range(0, 71):
            agentList[counter*5] = 0

        for bee in agents:
            info = beeInfo(bee.direction, bee.velocity, bee.state)
            agentList[bee.id] = info

    def beeCheckout(self,angle, id, state):
        pass
    def beeCheckIn(self): #technically only explorers or assessors will ever call this (which they do as they leave the hub)
        pass
    def directionInput(self): #user inhibits or pushes the amount of bees in each direction
        pass
#
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
