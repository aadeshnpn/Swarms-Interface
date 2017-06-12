from joblib import Parallel, delayed
import multiprocessing

import json
import os
import time
#Json doesn't work with numpy type 64
import numpy as np
from utils.debug import *
from InputEventManager import InputEventManager
#from beeCode.agent.agent import *
from antCode.ant.agent import *
from antCode.hubController import hubController
from antCode.infoStation import InfoStation
from utils.potentialField import PotentialField
import utils.flowController as flowController
import utils.geomUtil as geomUtil
import sys, os
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("-m", "--model", choices=["ant", "bee"], help="Run an 'ant' or 'bee' simulation")
parser.add_argument("-n", "--no-viewer", action="store_true", help="Don't output viewer world info")
parser.add_argument("-s", "--stats", action="store_true", help="Output json stats after simulation")
parser.add_argument("-c", "--commit-stop", action="store_true", help="Stop simulation after all agents have committed")
parser.add_argument("-t", "--tick-limit", type=int, help="Stop simulation after TICK_LIMIT ticks")
parser.add_argument("-r", "--randomize", action="store_true", help="randomizes the environment")

args = parser.parse_args()


ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
#Set the seed to always set same random values
#random.seed(123)
#class Site:
#    def __init__(self,location,radius,q_value):

"""
Function to be used for parallel processing
"""
def pherToWorld(self, x, y,x_limit,y_limit):
    #x = int(int(x * 3 + 1) - self.x_limit) this is for 1/3 array
    #y = int(int(y * 3 + 1) - self.y_limit)
    x = int(x-x_limit)
    y = int(y-y_limit)
    return x,y

def create_pheromone_dict(indices,i,x_limit,y_limit):
    pheromone_dict = {}
    x,y = pherToWorld(indicies[0][i],indicies[1][i],x_limit,y_limit)
    pheromone_dict["x"] = x
    pheromone_dict["y"] = y    
    return pheromone_dict

def create_agent_dict(agent):
    agent_dict = {}
    agent_dict["x"] = agent.location[0]
    agent_dict["y"] = agent.location[1]
    agent_dict["id"] = agent.id
    agent_dict["state"] = agent.state.name
    agent_dict["direction"] = agent.direction
    agent_dict["potential_site"] = agent.potential_site
    agent_dict["live"] = agent.live
    agent_dict["qVal"] = agent.q_value
    agent_dict["pVal"] = agent.atPheromone
    #agents.append(agent_dict)    
    return agent_dict
"""
"""
class Environment:

    def __init__(self, file_name):
        self.args = args        
        self.file_name = file_name
        self.x_limit = 0
        self.y_limit = 0
        self.hub = {}
        self.hubController = None
        self.sites = []
        self.obstacles = []
        self.potential_fields = []
        self.traps = []
        self.rough = []
        self.info_stations = []
        self.agents = {}
        self.dead_agents = []
        #  ants parameters
        self.parameters = {#"PipingThreshold":       2,
                           "Velocity":              2,
                           "SearchTime":            2000,
                           "WaitingTime":           2000,
                           "FollowingTime":         10,
                           "RecuritingTime":        50,
                           #"SiteAssessTime":       250,
                           "SiteAssessRadius":      15,
                           #"PipingTime":           1200,
                           "PheromoneStrength":     6,
                           "DiffusionRate":         3,
                           "Strength":              2,
                           "EvaporationRate":       0.01}

        self.build_json_environment()  # Calls the function to read in the initialization data from a file
        #self.randomizeSites()
        #  environment parameters

        self.number_of_agents = 100
        self.frames_per_sec = 300
        ##Threshold for controlling explorers
        self.max_hub_capacity = self.number_of_agents * 10
        self.food_deposite = 0
        #This should be working from angent class. Its not working. So using it over here
        self.following = {}

        #self.useDefaultParams = True
        self.restart_simulation = False
        self.change_agent_params = False

        self.add_agents()
        #print (self.agents['1'])
        self.inputEventManager = InputEventManager()
        self.hubController = hubController([self.hub["x"], self.hub["y"], self.hub["radius"]], self.agents, self, self.parameters["SearchTime"])

        self.isPaused = False
        self.attractors = [] #[flowController.Attractor((0, 100)), flowController.Attractor((-100, 0)), flowController.Attractor((100,0))]
        self.repulsors = [] #[flowController.Repulsor((60, -60)), flowController.Repulsor((-40,-40))]
        #self.repulsors[0].time_ticks = 600
        #self.repulsors[1].time_ticks = 1800
        #drawing the Pheromone list
        #x = int(np.ceil(int(self.x_limit*2)/3))
        #y = int(np.ceil(int(self.y_limit*2)/3))
        ##Following pehromones
        self.pheromoneList = np.zeros([int(self.x_limit*2)+1,int(self.y_limit*2)+1])
        self.pheromoneView = np.zeros([int(self.x_limit*2)+1,int(self.y_limit*2)+1])
        ##Exploring Pheromones
        self.exploring_pheromoneList = np.zeros([int(self.x_limit*2)+1,int(self.y_limit*2)+1])
        ##Dead Pehromones
        self.dead_pheromoneList = np.zeros([int(self.x_limit*2)+1,int(self.y_limit*2)+1])
        #self.dead_pheromoneView = np.zeros([int(self.x_limit*2)+1,int(self.y_limit*2)+1])        
        self.smellRange = 5
        #json aux
        self.previousMetaJson = None
    # Function to initialize data on the environment from a json file
    def build_json_environment(self):
        json_data = open(self.file_name).read()

        data = json.loads(json_data)

        #Uncomment this to randomize sites
        #generator = worldGenerator()
        #js = generator.to_json()
        #data = json.loads(js)

        self.x_limit = data["dimensions"]["x_length"] / 2
        self.y_limit = data["dimensions"]["y_length"] / 2
        self.hub = data["hub"]
        self.sites = data["sites"]
        self.obstacles = data["obstacles"]
        self.traps = data["traps"]
        self.rough = data["rough terrain"]
        self.randomizeSites()
        self.create_potential_fields()

        self.create_infoStations()

    def randomizeSites(self,flag=True):
        #For each site randomize the values
        for site in self.sites:
            site['q_value'] = round(np.random.random(),2)
            site['x'] = np.random.randint(-self.x_limit,self.x_limit)
            site['y'] = np.random.randint(-self.y_limit,self.y_limit)
            site['radius'] = site['q_value']*30
            site['food_unit'] = np.power(site['radius'],3)

    def getClosestFlowController(self, flowControllers, agent_location):
        if(len(flowControllers) == 0):
            raise ValueError('flowControllers list must not be empty.')
        closest = flowControllers[0]
        for flowController in flowControllers:
            if(geomUtil.point_distance(agent_location, flowController.point) < geomUtil.point_distance(agent_location, closest.point)):
                closest = flowController
        return closest

    def getAttractor(self, agent_location):
        if(len(self.attractors)>0):
            return self.getClosestFlowController(self.attractors, agent_location).point
        else:
            return None

    def getRepulsor(self, agent_location):
        if(len(self.repulsors) > 0):
            return self.getClosestFlowController(self.repulsors, agent_location).point
        else:
            return None

    def updateFlowControllers(self):

        new_attractor_list = []

        for attractor in self.attractors:
            attractor.time_ticks -= 1
            if(attractor.time_ticks > 0):
                new_attractor_list.append(attractor)
        self.attractors = new_attractor_list

        new_repulsor_list = []

        for repulsor in self.repulsors:
            repulsor.time_ticks -= 1
            if(repulsor.time_ticks > 0):
                new_repulsor_list.append(repulsor)
        self.repulsors = new_repulsor_list

    # Function to return the Q-value for given coordinates. Returns 0 if nothing is there and a value between 0 and 1
    # if it finds a site.
    def get_q(self, agent):
        # Calculate the distance between the coordinates and the center of each site, then compare that distance with
        # the radius of the obstacles, traps, rough spots, and sites
        for i, site in enumerate(self.sites):
            x_dif = agent.location[0] - site["x"]
            y_dif = agent.location[1] - site["y"]
            tot_dif = (x_dif ** 2 + y_dif ** 2) ** .5
            if tot_dif <= site["radius"]:
                info = self.info_stations[i]
                if not agent.atSite:
                    self.info_stations[i].bee_count += 1
                    agent.atSite = True
                    agent.siteIndex = i
                    #if info.check_for_changes(agent.parameters, agent.param_time_stamp):
                    #    agent.update_params(info.parameters)
                    #    agent.param_time_stamp = info.last_update

                # return the q_value as a linear gradient. The center of the site will return 100% of the q_value,
                # the edge will return 75% of the q_value
                return {
                    "radius": site["radius"],
                    "q"     : site["q_value"] - (tot_dif / site["radius"] * .25 * site["q_value"])
                }

        return {"radius": -1, "q": 0}

    def get_pheromone(self,agent):
        #x=int(int(agent.location[0]+self.x_limit)/3)
        #y=int(int(agent.location[1]+self.y_limit)/3)
        x,y = self.worldToPher(agent.location[0],agent.location[1])
        return self.pheromoneList[x,y]

    def pherToWorld(self, x, y):
        #x = int(int(x * 3 + 1) - self.x_limit) this is for 1/3 array
        #y = int(int(y * 3 + 1) - self.y_limit)
        x = int(x-self.x_limit)
        y = int(y-self.y_limit)
        return x,y
    def worldToPher(self,x,y):
        #x = int(int(x + self.x_limit) / 3) this is for 1/3 array
        #y = int(int(y + self.y_limit) / 3)
        x = int(x+self.x_limit)
        y = int(y+self.y_limit)
        return x,y
    
    def mark_dead_pheromone(self,location):
        x, y = self.worldToPher(location[0], location[1])
        self.dead_pheromoneList[x, y] += 6 * np.sqrt(5)
        self.dead_pheromoneList[x-5:x+5,y-5:y+5] += 2 * np.sqrt(5)
        if np.random.random() < .2:
            self.pheromoneView[x, y] += 6 * np.sqrt(5)   
    
    def smell_dead_agents(self,location):
        x,y = self.worldToPher(location[0], location[1])
        first = self.dead_pheromoneList[x,y]
        lowest = first
        ##Need to compute gradient using finite difference
        lowX = -self.smellRange + x
        upperX = self.smellRange + x
        lowY = -self.smellRange + y
        upperY = self.smellRange + y

        sub_set = self.dead_pheromoneList[lowX:upperX,lowY:upperY]
        #print (sub_set)
        if np.shape(sub_set)[0] <= 3 or np.shape(sub_set)[1] <= 3:
            return -10,-10
        p_x,p_y = np.gradient(sub_set)
        direction = np.arctan2(p_y,p_x)        

        if direction.sum() == 0.0:
            return -10,-10
        else:
            index = np.argmin(direction) + 1
            gradient_x = lowX + (index // len(sub_set))
            gradient_y = lowY + (index % len(sub_set))
            return gradient_x,gradient_y            

    ## this smell function for location pheromone
    def smellNearby(self, location):
        x,y = self.worldToPher(location[0], location[1])
        first = self.pheromoneList[x,y]
        lowest = first
        #lowX = -10
        #lowY = -10
        ##Need to compute gradient using finite difference
        lowX = -self.smellRange + x
        upperX = self.smellRange + x
        lowY = -self.smellRange + y
        upperY = self.smellRange + y

        sub_set = self.pheromoneList[lowX:upperX,lowY:upperY]
        p_x,p_y = np.gradient(sub_set)
        direction = np.arctan2(p_y,p_x)
        #Get a approx direction to hub
        #dx = self.hub["x"] - location[0]
        #dy = self.hub["y"] - location[1]
        #hub_direction = np.arctan2(dy, dx)        
        #eprint (direction)
        if direction.max() == 0.0:
            return -10,-10
        else:
            #direction -= hub_direction
            index = np.argmax(direction) + 1
            gradient_x = lowX + (index // len(sub_set))
            gradient_y = lowY + (index % len(sub_set))
            #eprint (x,y,[gradient_x,gradient_y])
            #eprint (x,y,lowX,lowY)
            #if gradient_x == int(location[0]) and gradient_y == int()
            return gradient_x,gradient_y

        """
        for i in range(-self.smellRange, self.smellRange+1):
            for j in range(-self.smellRange,self.smellRange+1):
                x0 = x+i
                y0 = y+j
                #if self.pheromoneList[x0,y0] > 0 and self.pheromoneList[x0,y0] < lowest and self.pheromoneList[x0,y0] < first+1:
                if self.pheromoneList[x0,y0] > 0 #and self.pheromoneList[x0,y0] < lowest and self.pheromoneList[x0,y0] < first:                
                    lowest = self.pheromoneList[x,y]
                    lowX = x0
                    lowY = y0
        return lowX, lowY
        """

    def consume_food(self):
        if self.food_deposite > 0:
            self.food_deposite -= 0.5

    # Returns 0 if terrain is clear, -1 if it is rough (slows velocity of agent to half-speed), -2 if there is an
    # obstacle, and -3 if there is a trap
    def check_terrain(self, x, y):
        for trap in self.traps:
            x_dif = x - trap["x"]
            y_dif = y - trap["y"]
            if x_dif ** 2 + y_dif ** 2 <= (trap["radius"])** 2:
                return -3

        for obstacle in self.obstacles:
            x_dif = x - obstacle["x"]
            y_dif = y - obstacle["y"]
            if x_dif ** 2 + y_dif ** 2 <= (obstacle["radius"]) ** 2:
                return -2

        for spot in self.rough:
            x_dif = x - spot["x"]
            y_dif = y - spot["y"]
            if x_dif ** 2 + y_dif ** 2 <= spot["radius"] ** 2:
                return -1

        return 0

    # agent asks to go in a direction at a certain velocity, use vector addition, updates location
    def suggest_new_direction(self, agentId):
        agent = self.agents[agentId]
        # Check the effects of moving in the suggested direction
        proposed_x = agent.location[0] + np.cos(agent.direction) * agent.velocity #+ np.cos(potential_field_d) * potential_field_v
        proposed_y = agent.location[1] + np.sin(agent.direction) * agent.velocity #+ np.sin(potential_field_d) * potential_field_v

        #if isinstance(agent.state,Following):
        #    proposed_x = agent.location[0]
        #    proposed_y = agent.location[1]
        terrain_value = self.check_terrain(proposed_x, proposed_y)

        if terrain_value == 0:
            agent.location[0] = proposed_x
            agent.location[1] = proposed_y
        elif terrain_value == -3:
            agent.location[0] = proposed_x
            agent.location[1] = proposed_y
            agent.live = False
            ##Mark the location with dead pheromone and spread it
            self.mark_dead_pheromone(agent.location)
            self.dead_agents.append(agent)
            '''for state in self.states:
                if self.states[state].count(agentId) > 0:
                    self.states[state].remove(agentId)
                    break'''
            del self.agents[agentId]
            return
        elif terrain_value == -2:
            potential_field_effect = self.potential_field_sum(agent.location)
            potential_field_v = np.sqrt(potential_field_effect[0] ** 2 + potential_field_effect[1] ** 2)
            potential_field_d = np.arctan2(potential_field_effect[1], potential_field_effect[0])

            agent.location[0] += np.cos(potential_field_d) * potential_field_v  # potential field should push away from obstacles
            agent.location[1] += np.sin(potential_field_d) * potential_field_v
        elif terrain_value == -1:  # If the agent is in rough terrain, it will move at half speed
            slow_down = .5
            agent.location[0] += np.cos(agent.direction) * agent.velocity * slow_down #+ np.cos(potential_field_d) * potential_field_v
            agent.location[1] += np.sin(agent.direction) * agent.velocity * slow_down # + np.sin(potential_field_d) * potential_field_v

        # If the agent goes outside of the limits, it re-enters on the opposite side.
        if agent.location[0] > self.x_limit:
            agent.location[0] -= 2 * self.x_limit
        elif agent.location[0] < self.x_limit * -1:
            agent.location[0] += 2 * self.x_limit
        if agent.location[1] > self.y_limit:
            agent.location[1] -= 2 * self.y_limit
        elif agent.location[1] < self.y_limit * -1:
            agent.location[1] += 2 * self.y_limit

    def pause(self, json):
        self.isPaused = True

    def play(self, json):
        self.isPaused = False

    def newAttractor(self, json):
        self.attractors.append(flowController.Attractor((json['x'], json['y']),json['radius']))

    def newRepulsor(self, json):
        self.repulsors.append(flowController.Repulsor((json['x'], json['y']),json['radius']))

    def updateParameters(self, json):
        eprint("updateParameters")
        params = json['params']

        #self.parameters["PipingThreshold"]  = int   (params['beePipingThreshold'      ])
        self.parameters["Velocity"]         = float (params['beeGlobalVelocity'       ])
        self.parameters["SearchTime"]      = float (params['beeExploreTimeMultiplier'])
        self.parameters["WaitingTime"]         = int   (params['beeRestTime'             ])
        self.parameters["RecuritingTime"]        = int   (params['beeDanceTime'            ])
        self.parameters["FollowingTime"]      = int   (params['beeObserveTime'          ])
        #self.parameters["SiteAssessTime"]   = int   (params['beeSiteAccessTime'       ])
        self.parameters["SiteAssessRadius"] = int   (params['beeSiteAccessRadius'     ])
        #self.parameters["PipingTime"]       = int   (params['beePipingTimer'          ])
        ##Ants new parameters
        #self.parameters["PheromoneStrength"]       = int   (params['beePipingTimer'          ])
        #self.parameters["DiffuisionRate"]       = int   (params['beePipingTimer'          ])#self.
        #self.parameters["EvaporationRate"]       = int   (params['beePipingTimer'          ])
        #self.parameters["Strength"]       = int   (params['beePipingTimer'          ])        
        self.number_of_agents               = int   (params['numberOfAgents'          ])

        self.smellRange = int   (params['beePipingThreshold'      ])

        self.change_agent_params = True
        eprint("New velocity =", params["beeGlobalVelocity"])

        # echo the change out for any other connected clients
        print(self.parametersToJson())

    def updateAgentParameters(self, agent):
        #agent.PipingThreshold       = int   (self.parameters["PipingThreshold"  ])
        agent.parameters["Velocity"]        = float (self.parameters["Velocity"         ])
        agent.parameters["SearchTime"] = float (self.parameters["SearchTime"      ])
        agent.parameters["WaitingTime"]              = int   (self.parameters["WaitingTime"         ])
        agent.parameters["RecuritingTime"]             = int   (self.parameters["RecuritingTime"        ])
        agent.parameters["FollowingTime"]           = int   (self.parameters["FollowingTime"      ])
        #agent.SiteAssessTime        = int   (self.parameters["SiteAssessTime"   ])
        agent.parameters["SiteAssessRadius"]      = int   (self.parameters["SiteAssessRadius" ])
        #agent.PipingTimer           = int   (self.parameters["PipingTime"       ])
        #agent.parameters["PheromoneStrength"]       = int   (params['beePipingTimer'          ])
        #agent.parameters["DiffuisionRate"]       = int   (params['beePipingTimer'          ])#self.
        #agent.parameters["EvaporationRate"]       = int   (params['beePipingTimer'          ])
        #agent.parameters["Strength"]       = int   (params['beePipingTimer'          ])               
        #agent.reset_trans_table()

    def updateUIParameters(self, json):
        params = json['params']

        self.frames_per_sec           = int  (params['uiFps'                   ])

        # echo the change out for any other connected clients
        print(self.UIParametersToJson())

    def restart_sim(self, json):
        eprint("\n\n\nRESTARTING\n\n\n")
        self.restart_simulation = True

    def getUiStates(self, data):
        eprint("getting ui states")
        print(json.dumps({
            "type" : "setStates",
            "data" : list(self.agents.values())[0].getUiRepresentation()
        }))

    def getParams(self, data):
        print(self.parametersToJson())

    # Move all of the agents
    def run(self):

        self.inputEventManager.start()
        self.inputEventManager.subscribe('pause', self.pause)
        self.inputEventManager.subscribe('play', self.play)
        self.inputEventManager.subscribe('attractor', self.newAttractor)
        self.inputEventManager.subscribe('repulsor', self.newRepulsor)
        self.inputEventManager.subscribe('parameterUpdate', self.updateParameters)
        self.inputEventManager.subscribe('UIParameterUpdate', self.updateUIParameters)
        self.inputEventManager.subscribe('restart', self.restart_sim)
        self.inputEventManager.subscribe('radialControl', self.hubController.handleRadialControl)
        self.inputEventManager.subscribe('requestStates', self.getUiStates)
        self.inputEventManager.subscribe('requestParams', self.getParams)

        world.to_json()

        while True:
            if not self.isPaused:
                world.to_json()
                stateCounts = {}

                keys = list(self.agents.keys())  # deleting a key mid-iteration (suggest_new_direction())
                                                        # makes python mad...
                for agent_id in keys:


                    if self.agents[agent_id].state.name not in stateCounts:
                        stateCounts[self.agents[agent_id].state.name] = 0

                    stateCounts[self.agents[agent_id].state.name] += 1


                    if self.change_agent_params:
                        self.updateAgentParameters(self.agents[agent_id])


                    # is this faster?
                    self.agents[agent_id].act()
                    self.agents[agent_id].sense(self)

                    atSite = False
                    if self.agents[agent_id].atSite:
                        atSite = True

                    self.agents[agent_id].update(self)

                    if atSite and not self.agents[agent_id].atSite:
                        self.info_stations[self.agents[agent_id].siteIndex].bee_count -= 1
                        self.agents[agent_id].siteIndex = None

                    self.suggest_new_direction(agent_id)

                self.hubController.hiveAdjust(self.agents)
                #evapRate = .02
                #self.pheromoneList = np.maximum(0,self.pheromoneList - evapRate)
                self.pheromoneList = np.maximum(0,self.pheromoneList - self.parameters["EvaporationRate"])
                #self.pheromoneList[np.where(self.pheromoneList < 0)] = 0
                #self.pheromoneView = np.maximum(0,self.pheromoneView - evapRate)
                self.pheromoneView = np.maximum(0,self.pheromoneView - self.parameters["EvaporationRate"])
                #self.pheromoneView[np.where(self.pheromoneView < 0)] = 0
                #Consume food
                self.consume_food()
                if self.change_agent_params:
                    self.change_agent_params = False
                #"""
                print(json.dumps({
                    "type": "stateCounts",
                    "data": stateCounts
                }))
                #"""
            self.updateFlowControllers()

            if self.restart_simulation:
                self.reset_sim()
                self.restart_simulation = False

            time.sleep(1/self.frames_per_sec)

    def clear_for_reset(self):
        self.agents.clear()
        self.attractors.clear()
        self.repulsors.clear()
        '''for state in self.states:
            self.states[state].clear()'''
        self.dead_agents.clear()
        self.info_stations.clear()
        self.create_infoStations()

    def create_infoStations(self):
        for x in range(len(self.sites)):
            self.info_stations.append(InfoStation(self.parameters))

    # TODO the hubcontroller keeps track of who is in the hub (cheaper computationally)
    ## Using hubController now
    def agents_at_hub(self,state):
        #agent_state_list = [self.agents[agent].state for agent in self.agents if self.agents[agent].inHub]
        #count_state = agent_state_list.count(state)
        #return count_state,len(agent_state_list)
        agent_state_count = 0
        total_agent_hub = 0
        agent_state_site = {}
        temp_list = []
        #for agent in self.agents:
        for agent in self.hubController.agentsInHub:
            #if self.agents[agent].inHub:
            total_agent_hub += 1
            temp_list.append(self.agents[agent].state.name)
            if self.agents[agent].state.name == state:
                #As our site doesn't have an id using multiplying locations to hash a dictonary. For later purpose we need to give id for site as well
                temp_site_id = int(round (self.agents[agent].potential_site[0] * self.agents[agent].potential_site[0]))
                if temp_site_id in agent_state_site.keys():
                    agent_state_site[temp_site_id].append(agent)
                else:
                    agent_state_site[temp_site_id] = [agent]
                agent_state_count += 1

        return agent_state_count,total_agent_hub,agent_state_site

    def add_agents(self):
        #Start agents in searching, resting and waiting state
        #rest_num = int(.1*self.number_of_agents)
        wait_num = int(.1*self.number_of_agents)
        #for x in range(self.number_of_agents - rest_num):
        for x in range(wait_num):
            agent_id = str(x)
            agent = Agent(self, agent_id, Waiting(None), self.hub, self.parameters)
            #agent = Agent(agent_id, self.hub, Resting())
            self.agents[agent_id] = agent
        for y in range(self.number_of_agents-wait_num):
            agent_id = str(x + y + 1)
            agent = Agent(self, agent_id, Searching(None), self.hub, self.parameters)            
            #agent = Agent(agent_id, self.hub, Resting())
            self.agents[agent_id] = agent

    def reset_sim(self):
        self.clear_for_reset()
        self.add_agents()
        self.hubController.reset([self.hub["x"], self.hub["y"], self.hub["radius"]], self.agents, self, self.parameters["SearchTime"])
        # echo the restart for any other connected clients
        print(
            json.dumps(
            {
                "type": "restart"
            })
        )

    def create_potential_fields(self):
        for obstacle in self.obstacles:
            location = [obstacle["x"], obstacle["y"]]
            spread = 20  #  What should this be?
            strength = .25  #  Dictates the strength of the field
            self.potential_fields.append(PotentialField(location, obstacle["radius"], spread, strength, type='repulsor'))

    def potential_field_sum(self, location):
        dx = 0
        dy = 0
        for field in self.potential_fields:
            delta = field.effect(location)
            dx += delta[0]
            dy += delta[1]
        #  return [0, 0]
        return [dx, dy]

    def change_state(self, agent_id, new_state):
        self.agents[agent_id].state = new_state

    def to_json(self):
        print(
            json.dumps(
            {
                "type": "update",
                "data":
                {
                    "x_limit"   : self.x_limit,
                    "y_limit"   : self.y_limit,
                    "hub"       : self.hub,
                    "sites"     : self.sites,
                    "obstacles" : self.obstacles,
                    "traps"     : self.traps,
                    "rough"     : self.rough,
                    "attractors": list(map(lambda a: a.toJson(), self.attractors)),
                    "repulsors" : list(map(lambda r: r.toJson(), self.repulsors )),
                    "agents"    : self.agents_to_json(),
                    "dead_agents": self.dead_agents_to_json(),
                    "pheromones": self.pheromone_trails_to_json()
                }
            })
        )

    def dead_agents_to_json(self):
        dead_agents = []
        for agent in self.dead_agents:
            agent_dict = {"x": agent.location[0],
                          "y": agent.location[1],
                          "id": agent.id,
                          "state": agent.state.name,
                          "direction": agent.direction,
                          "potential_site": agent.potential_site,
                          "live": agent.live,
                          "qVal": agent.q_value}
            dead_agents.append(agent_dict)
        return dead_agents

    def pheromone_trails_to_json(self):
        #return ''
        #indicies = np.where(self.pheromoneView > 0)        
        #return Parallel(n_jobs=8)(delayed(create_pheromone_dict)(indicies,i,self.x_limit,self.y_limit) for i in range(0,len(indicies[0])))

        pheromones = []
        #indicies [0] is X's, [1] are y's:
        indicies = np.where(self.pheromoneView > 0)
        for i in range(0,len(indicies[0])):
            #int(int(indicies[1][i]*3+1) -self.y_limit)
            pheromone_dict = {}
            x,y = self.pherToWorld(indicies[0][i],indicies[1][i])
            pheromone_dict["x"] = x
            pheromone_dict["y"] = y
            #test = self.pheromoneList[indicies[0][i]][indicies[1][i]]
            pheromones.append(pheromone_dict)
        return pheromones

    def agents_to_json(self):
        #return Parallel(n_jobs=8)(delayed(create_agent_dict)(self.agents['0']) for i in self.agents) 
        #for i in self.agents:
        #    print (self.agents[i])
        #return [create_agent_dict(self.agents['0'])]
        agents = []
        for agent_id in self.agents:
            # would it not be better to initialize this dictionary all at once?
            # dict = {"x":loc[0], "y":loc[1], "id":id, ..., "qVal":q_value}
            agent_dict = {}
            agent_dict["x"] = self.agents[agent_id].location[0]
            agent_dict["y"] = self.agents[agent_id].location[1]
            agent_dict["id"] = self.agents[agent_id].id
            agent_dict["state"] = self.agents[agent_id].state.name
            agent_dict["direction"] = self.agents[agent_id].direction
            agent_dict["potential_site"] = self.agents[agent_id].potential_site
            agent_dict["live"] = self.agents[agent_id].live
            agent_dict["qVal"] = self.agents[agent_id].q_value
            agent_dict["pVal"] = self.agents[agent_id].p_value
            agents.append(agent_dict)
        return agents

    def parametersToJson(self):
        parameterJson = {
            "type": "updateDebugParams",
            "data":
            {
                "parameters":
                {
                    "beePipingThreshold"      : self.smellRange,
                    "beeGlobalVelocity"       : self.parameters["Velocity"],
                    "beeExploreTimeMultiplier": self.parameters["SearchTime"],
                    "beeRestTime"             : self.parameters["WaitingTime"],
                    "beeDanceTime"            : self.parameters["RecuritingTime"],
                    "beeObserveTime"          : self.parameters["FollowingTime"],
                    #"beeSiteAccessTime"       : self.parameters["SiteAssessTime"],
                    "beeSiteAccessRadius"     : self.parameters["SiteAssessRadius"],
                    #"beePipingTimer"          : self.parameters["PipingTime"] ,
                    "numberOfAgents"          : self.number_of_agents
                }
            }
        }
        return json.dumps(parameterJson)

    def UIParametersToJson(self):
        parameterJson = {
            "type": "updateUIParams",
            "data":
            {
                "parameters":
                {
                    "uiFps": self.frames_per_sec
                }
            }
        }

        return json.dumps(parameterJson)
file = "world.json"
world = Environment(os.path.join(ROOT_DIR, file))
world.run()
