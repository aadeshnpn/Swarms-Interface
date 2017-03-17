from agent.agent import *
# from worldGenerator import worldGenerator
from InputEventManager import InputEventManager
from potentialField import PotentialField
from infoStation import InfoStation
from debug import *
import flowController
import numpy as np
import json
import os
import copy

import time
import geomUtil

from hubController import hubController

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

class Environment:

    def __init__(self, file_name):
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
        self.states = {Exploring().__class__:[],
                       Assessing().__class__: [],
                       Dancing().__class__:[],
                       Resting().__class__:[],
                       Observing().__class__:[],
                       SiteAssess().__class__:[],
                       Piping().__class__:[],
                       Commit().__class__:[]}
        self.dead_agents = []

        self.quadrants = [[set() for x in range(800)] for y in range(400)]
        self.build_json_environment()  # Calls the function to read in the initialization data from a file

        #  bee parameters
        self.beePipingThreshold       =   12
        self.beeGlobalVelocity        =    2
        self.beeExploreTimeMultiplier = 3625
        self.beeRestTime              =  450
        self.beeDanceTime             = 1150
        self.beeObserveTime           = 2000
        self.beeSiteAccessTime        =  235
        self.beeSiteAccessRadius      =   15
        self.beePipingTimer           = 1200  # long enough to allow all bees to make it back before commit?

        #  environment parameters
        self.number_of_agents = 100
        self.frames_per_sec = 60

        #self.useDefaultParams = True
        self.restart_simulation = False
        self.change_agent_params = False

        self.add_agents()

        self.inputEventManager = InputEventManager()
        self.hubController = hubController([self.hub["x"], self.hub["y"], self.hub["radius"]], self.agents, self)
        self.isPaused = False
        self.attractors = [] #[flowController.Attractor((0, 100)), flowController.Attractor((-100, 0)), flowController.Attractor((100,0))]
        self.repulsors = [] #[flowController.Repulsor((60, -60)), flowController.Repulsor((-40,-40))]
        #self.repulsors[0].time_ticks = 600
        #self.repulsors[1].time_ticks = 1800

        #json aux
        self.previousMetaJson = None

    # Function to initialize data on the environment from a json file
    def build_json_environment(self):
        json_data = open(self.file_name).read()

        data = json.loads(json_data)

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
        self.create_potential_fields()

        for x in range(len(self.sites)):
            self.info_stations.append(InfoStation())

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

    def sort_by_state(self, agent_id, prev_state, cur_state):
        if self.states[prev_state].count(agent_id) > 0:
            self.states[prev_state].remove(agent_id)
            self.states[cur_state].append(agent_id)
        else:
            eprint("Error:", agent_id, "not in", prev_state)
            eprint("It wants to change to", cur_state)

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
                    info.bee_count += 1
                    agent.atSite = True
                    agent.siteIndex = i
                    if info.check_for_changes(agent.current_parameters, agent.param_time_stamp):
                        agent.update_params(info.parameters)
                        agent.param_time_stamp = info.last_update

                # return the q_value as a linear gradient. The center of the site will return 100% of the q_value,
                # the edge will return 75% of the q_value
                return {
                    "radius": site["radius"],
                    "q"     : site["q_value"] - (tot_dif / site["radius"] * .25 * site["q_value"])
                }

        if agent.atSite:
            self.info_stations[agent.siteIndex].bee_count -= 1

            if self.info_stations[agent.siteIndex].check_for_changes(agent.current_parameters, agent.param_time_stamp):
                agent.update_params(self.info_stations[agent.siteIndex].parameters)
                agent.param_time_stamp = self.info_stations[agent.siteIndex].last_update
            agent.atSite = False
            agent.siteIndex = None

        return {"radius": -1, "q": 0}

    # Returns 0 if terrain is clear, -1 if it is rough (slows velocity of agent to half-speed), -2 if there is an
    # obstacle, and -3 if there is a trap
    def check_terrain(self, x, y):
        for trap in self.traps:
            x_dif = x - trap["x"]
            y_dif = y - trap["y"]
            if x_dif ** 2 + y_dif ** 2 <= trap["radius"] ** 2:
                return -3

        for obstacle in self.obstacles:
            x_dif = x - obstacle["x"]
            y_dif = y - obstacle["y"]
            if x_dif ** 2 + y_dif ** 2 <= obstacle["radius"] ** 2:
                return -2

        for spot in self.rough:
            x_dif = x - spot["x"]
            y_dif = y - spot["y"]
            if x_dif ** 2 + y_dif ** 2 <= spot["radius"] ** 2:
                return -1

        return 0

    # Wind affects the whole environment except the hub.
    def wind(self, direction, velocity):
        for agent_id in self.agents:
            agent = self.agents[agent_id]
            if ((agent.location[0] - self.hub["x"]) ** 2 + (agent.location[1] - self.hub["y"]) ** 2) ** .5 > self.hub["radius"]:
                proposed_x = agent.location[0] + np.cos(direction) * velocity
                proposed_y = agent.location[1] + np.sin(direction) * velocity

                terrain_value = self.check_terrain(proposed_x, proposed_y)

                if terrain_value == 0:
                    agent.location[0] = proposed_x
                    agent.location[1] = proposed_y
                elif terrain_value == -3:
                    agent.location[0] = proposed_x
                    agent.location[1] = proposed_y
                    agent.live = False
                    self.dead_agents.append(agent)
                    self.states[agent.state].remove(agent_id)
                    del self.agents[agent_id]
                    return
                elif terrain_value == -2:
                    pass
                elif terrain_value == -1:  # If the agent is in rough terrain, it will move at half speed
                    slow_down = .5
                    agent.location[0] += np.cos(direction) * velocity * slow_down
                    agent.location[1] += np.sin(direction) * velocity * slow_down

            # If the agent goes outside of the limits, it re-enters on the opposite side.
            if agent.location[0] > self.x_limit:
                agent.location[0] -= 2 * self.x_limit
            elif agent.location[0] < self.x_limit * -1:
                agent.location[0] += 2 * self.x_limit
            if agent.location[1] > self.y_limit:
                agent.location[1] -= 2 * self.y_limit
            elif agent.location[1] < self.y_limit * -1:
                agent.location[1] += 2 * self.y_limit

    def get_nearby_dancers(self, agent_id, radius):
        nearby = []
        for other_id in self.states[Dancing().__class__]:
            if ((self.agents[other_id].location[0] - self.agents[agent_id].location[0]) ** 2 + (self.agents[other_id].location[1] - self.agents[agent_id].location[1]) ** 2) ** .5 <= radius:
                nearby.append(self.agents[other_id])
        return nearby

    def get_nearby_pipers(self, agent_id, radius):
        nearby = []
        for other_id in self.states[Piping().__class__]:
            if ((self.agents[other_id].location[0] - self.agents[agent_id].location[0]) ** 2 + (self.agents[other_id].location[1] - self.agents[agent_id].location[1]) ** 2) ** .5 <= radius:
                nearby.append(self.agents[other_id])
        return nearby

    def get_nearby_site_assessors(self, agent_id, radius):
        nearby = []
        for other_id in self.states[SiteAssess().__class__]:
            if other_id != agent_id:
                if ((self.agents[other_id].location[0] - self.agents[agent_id].location[0]) ** 2 + (self.agents[other_id].location[1] - self.agents[agent_id].location[1]) ** 2) ** .5 <= radius:
                    nearby.append(self.agents[other_id])
        return nearby

    def get_nearby_agents(self, agent_id, radius):
        nearby = []
        for other_id in self.agents:
            if other_id != agent_id:
                if ((self.agents[other_id].location[0] - self.agents[agent_id].location[0])**2 + (self.agents[other_id].location[1] - self.agents[agent_id].location[1])**2)**.5 <= radius:
                    #nearby.append([self.agents[other_id].site_location, self.agents[other_id].q_found])
                    nearby.append(self.agents[other_id])
        return nearby

    # agent asks to go in a direction at a certain velocity, use vector addition, updates location
    def suggest_new_direction(self, agentId):
        agent = self.agents[agentId]

        # Check the effects of moving in the suggested direction
        potential_field_effect = self.potential_field_sum(agent.location)
        potential_field_v = np.sqrt(potential_field_effect[0]**2 + potential_field_effect[1]**2)
        potential_field_d = np.arctan2(potential_field_effect[1], potential_field_effect[0])

        proposed_x = agent.location[0] + np.cos(agent.direction) * agent.velocity \
                                        + np.cos(potential_field_d) * potential_field_v
        proposed_y = agent.location[1] + np.sin(agent.direction) * agent.velocity \
                                        + np.sin(potential_field_d) * potential_field_v

        terrain_value = self.check_terrain(proposed_x, proposed_y)

        if terrain_value == 0:
            agent.location[0] = proposed_x
            agent.location[1] = proposed_y
        elif terrain_value == -3:
            agent.location[0] = proposed_x
            agent.location[1] = proposed_y
            agent.live = False
            self.dead_agents.append(agent)
            for state in self.states:
                if self.states[state].count(agentId) > 0:
                    self.states[state].remove(agentId)
                    break
            del self.agents[agentId]
            return
        elif terrain_value == -2:
            #  pass
            agent.location[0] += np.cos(potential_field_d) * potential_field_v  # potential field should push away from obstacles
            agent.location[1] += np.sin(potential_field_d) * potential_field_v
        elif terrain_value == -1:  # If the agent is in rough terrain, it will move at half speed
            slow_down = .5
            agent.location[0] += np.cos(agent.direction) * agent.velocity * slow_down \
                                    + np.cos(potential_field_d) * potential_field_v
            agent.location[1] += np.sin(agent.direction) * agent.velocity * slow_down \
                                    + np.sin(potential_field_d) * potential_field_v

        '''
        This is computationally very expensive!
        # add collision checking for other bees
        for agent_id in self.agents:
            if (self.agents[agent_id].location[:] == agent.location[:]) and (agentId != agent_id):
                agent.location[0] -= np.cos(agent.direction) * agent.velocity
                agent.location[1] -= np.sin(agent.direction) * agent.velocity
                break
        '''

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
        self.attractors.append(flowController.Attractor((json['x'], json['y'])))

    def newRepulsor(self, json):
        self.repulsors.append(flowController.Repulsor((json['x'], json['y'])))

    def updateParameters(self, json):
        params = json['params']

        self.beePipingThreshold       = int  (params['beePipingThreshold'      ])
        self.beeGlobalVelocity        = float(params['beeGlobalVelocity'       ])
        self.beeExploreTimeMultiplier = float(params['beeExploreTimeMultiplier'])
        self.beeRestTime              = int  (params['beeRestTime'             ])
        self.beeDanceTime             = int  (params['beeDanceTime'            ])
        self.beeObserveTime           = int  (params['beeObserveTime'          ])
        self.beeSiteAccessTime        = int  (params['beeSiteAccessTime'       ])
        self.beeSiteAccessRadius      = int  (params['beeSiteAccessRadius'     ])
        self.beePipingTimer           = int  (params['beePipingTimer'          ])
        self.number_of_agents         = int  (params['numberOfAgents'          ])

        self.change_agent_params = True

        # echo the change out for any other connected clients
        print(self.parametersToJson())

    def updateAgentParameters(self, agent):
        agent.PipingThreshold = self.beePipingThreshold
        agent.GlobalVelocity = self.beeGlobalVelocity
        agent.ExploreTimeMultiplier = self.beeExploreTimeMultiplier
        agent.RestTime = self.beeRestTime
        agent.DanceTime = self.beeDanceTime
        agent.ObserveTime = self.beeObserveTime
        agent.SiteAssessTime = self.beeSiteAccessTime
        agent.SiteAssessRadius = self.beeSiteAccessRadius
        agent.PipingTimer = self.beePipingTimer


    def updateUIParameters(self, json):
        params = json['params']

        self.frames_per_sec           = int  (params['uiFps'                   ])

        # echo the change out for any other connected clients
        print(self.UIParametersToJson())

    def restart_sim(self, json):
        self.restart_simulation = True

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

        print(self.parametersToJson())
        world.to_json()

        while True:
            if not self.isPaused:
                world.to_json()
                keys = list(self.agents.keys())  # deleting a key mid-iteration (suggest_new_direction())
                                                        # makes python mad...
                for agent_id in keys:
                    '''
                    agent = self.agents[agent_id]
                    agent.act()
                    agent.sense(self)
                    self.suggest_new_direction(agent.id)
                    # wind_direction = 1  # in radians
                    # wind_velocity = .01
                    # uncomment the next line to add wind to the environment
                    #self.wind(wind_direction, wind_velocity)
                    agent.update(self)
                    '''
                    if self.change_agent_params:
                        self.updateAgentParameters(self.agents[agent_id])
                    # is this faster?
                    self.agents[agent_id].act()
                    self.agents[agent_id].sense(self)
                    self.agents[agent_id].update(self)
                    self.suggest_new_direction(agent_id)

                self.hubController.hiveAdjust(self.agents)
                if self.change_agent_params:
                    self.change_agent_params = False

            self.updateFlowControllers()

            if self.restart_simulation:
                self.reset_sim()
                self.restart_simulation = False

            time.sleep(1/self.frames_per_sec)

    def clear_for_reset(self):
        self.agents.clear()
        self.attractors.clear()
        self.repulsors.clear()
        for state in self.states:
            self.states[state].clear()
        self.dead_agents.clear()

    def add_agents(self):
        for x in range(self.number_of_agents):
            agent_id = str(x)
            #if self.useDefaultParams:
            #    agent = Agent(agent_id, Exploring(ExploreTimeMultiplier=self.beeExploreTimeMultiplier), self.hub)
                #agent = Agent(agent_id,Observing())
            #else:
            agent = Agent(agent_id, Exploring(ExploreTimeMultiplier=self.beeExploreTimeMultiplier), self.hub,
                          piping_threshold        = self.beePipingThreshold,
                          piping_time             = self.beePipingTimer,
                          global_velocity         = self.beeGlobalVelocity,
                          explore_time_multiplier = self.beeExploreTimeMultiplier,
                          rest_time               = self.beeRestTime,
                          dance_time              = self.beeDanceTime,
                          observe_time            = self.beeDanceTime,
                          site_assess_time        = self.beeSiteAccessTime,
                          site_assess_radius      = self.beeSiteAccessRadius)
            self.agents[agent_id] = agent
            self.states[Exploring().__class__].append(agent_id)

    def reset_sim(self):
        self.clear_for_reset()
        self.add_agents()
        self.hubController.reset([self.hub["x"], self.hub["y"], self.hub["radius"]], self.agents, self)
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
            spread = 30  #  What should this be?
            strength = .035  #  Dictates the strength of the field
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
                    "dead_agents": self.dead_agents_to_json()
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

    def agents_to_json(self):
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
            agents.append(agent_dict)
        return agents

    def parametersToJson(self):
        parameterJson = {
            "type": "updateDebugParams",
            "data":
            {
                "parameters":
                {
                    "beePipingThreshold"      : self.beePipingThreshold,
                    "beeGlobalVelocity"       : self.beeGlobalVelocity,
                    "beeExploreTimeMultiplier": self.beeExploreTimeMultiplier,
                    "beeRestTime"             : self.beeRestTime,
                    "beeDanceTime"            : self.beeDanceTime,
                    "beeObserveTime"          : self.beeObserveTime,
                    "beeSiteAccessTime"       : self.beeSiteAccessTime,
                    "beeSiteAccessRadius"     : self.beeSiteAccessRadius,
                    "beePipingTimer"          : self.beePipingTimer,
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
                    "uiFps"                     : self.frames_per_sec
                }
            }
        }

        return json.dumps(parameterJson)

file = "world.json"
world = Environment(os.path.join(ROOT_DIR, file))
world.run()
