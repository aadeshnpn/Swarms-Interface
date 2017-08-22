import json

from randomdict import RandomDict
import copy
from .agent.agent import *
from utils.debug import *
import time
import numpy as np
from sympy.geometry import *

from .hubController import HubController
from .contaminationMap import ContaminationMap
from .pheromoneMap import PheromoneMap
import random

#TODO: this is so gross - does numpy have something we can use?
def distance(a,b):
    c = [0.0,0.0]
    a[0] = (float)(a[0])
    a[1] = (float)(a[1])
    c[0] = (float)(b[0])
    c[1] = (float)(b[1])
    return np.sqrt((c[0]-a[0])**2 + (c[1]-a[1])**2)

class UavHubController(HubController):
    '''
    def init_probMap(self):
        xmin = -600
        xmax = 600
        ymin = -600
        ymax = 600
        self.boundingBox = Polygon(Point2D(xmin,ymin),Point2D(xmin,ymax),Point2D(xmax,ymax),Point2D(xmax,ymin))
        self.probMap = {}

        self.sensing_radius = 60
        x = xmin
        y = ymin
        while(x <= xmax):
            y = ymin
            while(y <= ymax):
                self.probMap[(x,y)] = 1
                y += self.sensing_radius
            x += self.sensing_radius

        self.frontier = set()
        self.frontier.add((120,120))
    '''
    def checkOutPheromoneMap(self, agent):
        #pass #return deep copy of pheromone map to agent
        #return copy.deepcopy(self.pheromoneMap)
        self.pheromoneMap.merge(agent.pheromoneMap)
    def checkInPheromoneMap(self, agent):
        self.pheromoneMap.merge(agent.pheromoneMap)
        #pass #merge pheromone map... how? We expect these agents to be
        #unreliable or some even to be malicious. How ought this be balanced out
        #?

    def checkOutRoute2(self):
        start = self.contaminationMap.getRandomNodeFromFrontier()
        if start is None:
            return None
        flight_plan = [start]
        current = start
        for i in range(0,5):
            if((i+1) != len(flight_plan)):
                break
            candidates = []
            for n in current.neighbors:
                if(n.cleared is False):
                    candidates.append(n)
                    #flight_plan.append(n)
                    #current = n
                    #break
            if(len(candidates) == 0):
                break
            closest = candidates[0]
            for c in candidates:
                if(distance([10,30],c.position) < distance([10,30] , closest.position)):
                    closest = c
            flight_plan.append(closest)
        return flight_plan

    def checkInRoute2(self, flight_plan):
        for node in flight_plan:
            self.contaminationMap.clearNode(node)


    def checkOutRoute(self):
        return self.contaminationMap.getRandomNodeFromFrontier()
        '''
        eprint("checkOutRoute")
        if(len(self.frontier) == 0):
            eprint("Frontier empty")
            return None
        #eprint(self.frontier)

        eprint(route)
        return route
        '''

    def checkInRoute(self, subsetOfFrontier):
        self.contaminationMap.clearNode(subsetOfFrontier[0]) #TODO: remove; is temp.

        '''
        eprint("checkInRoute")
        eprint("subsetOfFrontier : " + str(subsetOfFrontier))
        for r in subsetOfFrontier:
            eprint("\tr = " + str(r))
            self.probMap[r] = 0
            if(r in self.frontier):
                self.frontier.remove(r)
            if(self.probMap[(r[0] + self.sensing_radius, r[1])] == 1):
                self.frontier.add((r[0] + self.sensing_radius, r[1]))
            if(self.probMap[(r[0], r[1]+ self.sensing_radius)] == 1):
                self.frontier.add((r[0], r[1]+ self.sensing_radius))
            if(self.probMap[(r[0] - self.sensing_radius, r[1])] == 1):
                self.frontier.add((r[0] - self.sensing_radius, r[1]))
            if(self.probMap[(r[0], r[1] - self.sensing_radius)] == 1):
                self.frontier.add((r[0], r[1] - self.sensing_radius))
        eprint("new frontier = " + str(self.frontier))
        '''
    def __init__(self, radius, agents, environment, exploreTime):
        self.reset(radius, agents, environment, exploreTime)
        #self.contaminationMap = ContaminationMap((10,30), 500, 50)
        self.pheromoneMap = PheromoneMap((10,30), 500, 50)
        #self.init_probMap()
        self.siteDistancePriority = 0
        self.siteSizePriority = 0

        self.patrol_routes = [{
            "x" : [-390, -210],
            "y" : [100, 100],
            "ids" : []
        },
        {
            "x" : [-190, -10],
            "y" : [100, 100],
            "ids" : []
        },
        {
            "x" : [10, 190],
            "y" : [100, 100],
            "ids" : []
        },

        {
            "x" : [210, 390],
            "y" : [100, 100],
            "ids" : []
        }]

        self.patrol_rects = [{"rect" : Polygon(Point2D(100, -400),Point2D(100,100),Point2D(300,100),Point2D(300,-400)), "ids" : []},
        {"rect" : Polygon(Point2D(-350,50),Point2D(-350,200),Point2D(-200,200),Point2D(-200,50)), "ids" : []},
        {"rect" : Polygon(Point2D(-200,50),Point2D(-200,200),Point2D(0,200),Point2D(0,50)), "ids" : []} ]
        self.no_viewer = environment.args.no_viewer

        environment.inputEventManager.subscribe('priorityUpdate', self.handlePriorityUpdate)

    def checkOutPatrolRect(self, agent):
        eprint("checkOutPatrolRect, id = " + str(agent.id))
        route = min(self.patrol_rects, key = lambda patrol : sum(self.environment.agents[agent_id].counter for agent_id in patrol["ids"]))
        eprint(route)
        route["ids"].append(agent.id)
        return route["rect"]
        #return self.patrol_rects[0]["rect"]

    def checkInPatrolRect(self, agent):
        for p in self.patrol_routes:
            if agent.id in p["ids"]:
                p["ids"].remove(agent.id)
                break

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
