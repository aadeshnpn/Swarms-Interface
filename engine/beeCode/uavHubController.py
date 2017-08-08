import json

from randomdict import RandomDict
import copy
from .agent.agent import *
from utils.debug import *
import time
import numpy as np
from sympy.geometry import *

from .hubController import HubController

import random

class UavHubController(HubController):
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

    def checkOutRoute(self):
        eprint("checkOutRoute")
        if(len(self.frontier) == 0):
            eprint("Frontier empty")
            return None
        #eprint(self.frontier)
        route = random.sample(self.frontier, 1)[0]
        self.frontier.remove(route)
        eprint(route)
        return route

    def checkInRoute(self, subsetOfFrontier):
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
    def __init__(self, radius, agents, environment, exploreTime):
        self.reset(radius, agents, environment, exploreTime)
        self.init_probMap()
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
