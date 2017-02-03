from agent.agent import *
from InputEventManager import InputEventManager
from potentialField import PotentialField
import flowController
import numpy as np
import json
import os
import sys
import time
import geomUtil

from hubController import hubController

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

class Environment:

    def __init__(self, file_name):
        self.file_name = file_name
        self.x_limit = 0
        self.y_limit = 0
        self.hub = [0, 0, 1]
        self.hubController = None
        self.sites = []
        self.obstacles = []
        self.potential_fields = []
        self.traps = []
        self.rough = []
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
        self.build_environment()  # Calls the function to read in the initialization data from a file and stores it in a list

        #  bee parameters
        self.beePipingThreshold = None
        self.beeGlobalVelocity = None
        self.beeExploreTimeMultiplier = None
        self.beeRestTime = None
        self.beeDanceTime = None
        self.beeObserveTime = None
        self.beeSiteAccessTime = None
        self.beeSiteAccessRadius = None
        self.beePipingTimer = None  # long enough to allow all bees to make it back before commit?

        #  environment parameters
        self.number_of_agents = 100
        self.frames_per_sec = 64

        self.useDefaultParams = True
        self.restart_simulation = False

        self.add_agents()

        self.inputEventManager = InputEventManager()
        self.hubController = hubController(self.hub[0:2], self.agents)
        self.isPaused = False
        self.attractors = [] #[flowController.Attractor((0, 100)), flowController.Attractor((-100, 0)), flowController.Attractor((100,0))]
        self.repulsors = [] #[flowController.Repulsor((60, -60)), flowController.Repulsor((-40,-40))]
        #self.repulsors[0].time_ticks = 600
        #self.repulsors[1].time_ticks = 1800

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
        #self.states[prev_state].remove(agent_id)
        #self.states[cur_state].append(agent_id)
        pass

    # Converts a cartesian coordinate to the matrix location
    def coord_to_matrix(self, location):
        return [int((location[0] + 800) / 2), int((location[1] + 400) / 2)]

    # reset all quadrants
    def reset_quads(self):
        self.quadrants = [[set() for x in range(800)] for y in range(400)]

    # only reset the quadrants that have agents in them
    def selective_reset_quads(self):
        for y in range(400):
            for x in range(800):
                if len(self.quadrants[y][x]) != 0:
                    self.quadrants[y][x] = set()

    # Sorts the agents into their respective quadrants
    def sort_by_quad(self):
        self.reset_quads()

        for agent in self.agents:
            matrix_address = self.coord_to_matrix(self.agents[agent].location)
            self.quadrants[matrix_address[1]][matrix_address[0]].add(agent)
            self.agents[agent].quadrant = matrix_address

    # Function to initialize data on the environment from a .txt file
    def build_environment(self):
        new_hub = []
        new_sites = []
        new_obstacles = []
        new_traps = []
        new_rough = []

        with open(self.file_name, encoding='utf-8', errors='ignore') as file_in:
            lines = file_in.readlines()
            limit_flag = False
            hub_flag = False
            site_flag = False
            obstacle_flag = False
            trap_flag = False
            rough_flag = False

            for line in lines:
                if line[0] == "X":
                    pass
                elif line == "\n":
                    limit_flag = False
                    hub_flag = False
                    site_flag = False
                    obstacle_flag = False
                    trap_flag = False

                elif rough_flag is True:
                    rough = []
                    for entry in line.split():
                        rough.append(float(entry))
                    new_rough.append(rough)

                    assert abs(rough[0]) + rough[2] < self.x_limit and abs(
                        rough[1]) + rough[2] < self.y_limit, "Not all rough terrain is inside Environment boundaries"

                elif trap_flag is True:
                    trap = []
                    for entry in line.split():
                        trap.append(float(entry))
                    new_traps.append(trap)

                    assert abs(trap[0]) + trap[2] < self.x_limit and abs(trap[1]) + trap[2] < self.y_limit, "Not all traps are inside Environment boundaries"

                elif obstacle_flag is True:
                    obstacle = []
                    for entry in line.split():
                        obstacle.append(float(entry))
                    new_obstacles.append(obstacle)

                    assert abs(obstacle[0]) + obstacle[2] < self.x_limit and abs(obstacle[1]) + obstacle[2] < self.y_limit, "Not all obstacles are inside Environment boundaries"

                elif site_flag is True:
                    site = []
                    for entry in line.split():
                        site.append(float(entry))
                    new_sites.append(site)
                    assert abs(site[0]) + site[2] <= self.x_limit and abs(site[1]) + site[2] <= self.y_limit, "Not all sites are inside Environment boundaries"

                elif hub_flag is True:
                    for entry in line.split():
                        new_hub.append(float(entry))
                    hub_flag = False

                elif limit_flag is True:
                    for x, entry in enumerate(line.split()):
                        if x == 0:
                            self.x_limit = float(entry)
                        elif x == 1:
                            self.y_limit = float(entry)

                if line == "World Limits\n":
                    limit_flag = True
                elif line == "Hub\n":
                    hub_flag = True
                elif line == "Sites\n":
                    site_flag = True
                elif line == "Obstacles\n":
                    obstacle_flag = True
                elif line == "Traps\n":
                    trap_flag = True
                elif line == "Rough Terrain\n":
                    rough_flag = True

            self.hub = new_hub
            self.sites = new_sites
            self.obstacles = new_obstacles
            self.traps = new_traps
            self.rough = new_rough
            self.create_potential_fields()


    # Function to return the Q-value for given coordinates. Returns 0 if nothing is there and a value between 0 and 1
    # if it finds a site.
    def get_q(self, x, y):

        # Calculate the distance between the coordinates and the center of each site, then compare that distance with
        # the radius of the obstacles, traps, rough spots, and sites

        for site in self.sites:
            x_dif = x - site[0]
            y_dif = y - site[1]
            tot_dif = (x_dif ** 2 + y_dif ** 2) ** .5
            if tot_dif <= site[2]:
                return site[3] - tot_dif / site[2] * .25 * site[3]  # the q_value is a linear gradient. The center of the
                                                                    # site will return 100% of the q_value, the edge will
                                                                    # return 75% of the q_value
                # return site[3]*np.random.normal(1, .2, 1)  # for testing purposes I'm just returning the q value.
                #return (site[3] / site[2] ** (tot_dif / site[2])) * site[4] # Uses an inverse-power function to compute
                                                                    # q_value based on distance from center of site,
                                                                    # multiplied by the site's ease of detection
        return 0

    # Returns 0 if terrain is clear, -1 if it is rough (slows velocity of agent to half-speed), -2 if there is an obstacle,
    # and -3 if there is a trap
    def check_terrain(self, x, y):
        for trap in self.traps:
            x_dif = x - trap[0]
            y_dif = y - trap[1]
            if x_dif**2 + y_dif**2 <= trap[2]**2:
                return -3

        for obstacle in self.obstacles:
            x_dif = x - obstacle[0]
            y_dif = y - obstacle[1]
            if x_dif ** 2 + y_dif ** 2 <= obstacle[2] ** 2:
                return -2

        for spot in self.rough:
            x_dif = x - spot[0]
            y_dif = y - spot[1]
            if x_dif ** 2 + y_dif ** 2 <= spot[2] ** 2:
                return -1

        return 0

    # Wind affects the whole environment except the hub.
    def wind(self, direction, velocity):
        for agent_id in self.agents:
            agent = self.agents[agent_id]
            if ((agent.location[0] - self.hub[0]) ** 2 + (agent.location[1] - self.hub[1]) ** 2) ** .5 > self.hub[2]:
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
        proposed_x = agent.location[0] + np.cos(agent.direction) * agent.velocity + potential_field_effect[0]
        proposed_y = agent.location[1] + np.sin(agent.direction) * agent.velocity + potential_field_effect[1]

        terrain_value = self.check_terrain(proposed_x, proposed_y)

        if terrain_value == 0:
            agent.location[0] = proposed_x
            agent.location[1] = proposed_y
        elif terrain_value == -3:
            agent.location[0] = proposed_x
            agent.location[1] = proposed_y
            agent.live = False
            self.dead_agents.append(agent)
            return
        elif terrain_value == -2:
            pass
        elif terrain_value == -1:  # If the agent is in rough terrain, it will move at half speed
            slow_down = .5
            agent.location[0] += np.cos(agent.direction) * agent.velocity * slow_down
            agent.location[1] += np.sin(agent.direction) * agent.velocity * slow_down

        # add collision checking for other bees
        for agent_id in self.agents:
            if (self.agents[agent_id].location[:] == agent.location[:]) and (agentId != agent_id):
                agent.location[0] -= np.cos(agent.direction) * agent.velocity
                agent.location[1] -= np.sin(agent.direction) * agent.velocity
                break

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
        self.beePipingThreshold = int(params['pipingThreshold'])
        self.beeGlobalVelocity = int(params['globalVelocity'])
        self.beeExploreTimeMultiplier = float(params['exploreTimeMultiplier'])
        self.beeRestTime = int(params['restTime'])
        self.beeDanceTime = int(params['danceTime'])
        self.beeObserveTime = int(params['observeTime'])
        self.beeSiteAccessTime = int(params['siteAccessTime'])
        self.beeSiteAccessRadius = int(params['siteAccessRadius'])
        self.beePipingTimer = int(params['pipingTimer'])
        self.number_of_agents = int(params['agentNumber'])
        self.frames_per_sec = int(params['fps'])

        self.useDefaultParams = False
        self.restart_simulation = True

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
        self.inputEventManager.subscribe('restart', self.restart_sim)

        while True:
            if not self.isPaused:
                world.to_json()
                for agent_id in self.agents:
                    agent = self.agents[agent_id]
                    if agent.live is True:
                        agent.act()
                        agent.sense(self)
                        self.suggest_new_direction(agent.id)
                        wind_direction = 1  # in radians
                        wind_velocity = .01
                        # uncomment the next line to add wind to the environment
                        #self.wind(wind_direction, wind_velocity)
                        agent.update(self)

            self.updateFlowControllers()
            #self.hubController.hiveAdjust(self.agents)

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
            if self.useDefaultParams:
                agent = Agent(agent_id, Exploring(ExploreTimeMultiplier=self.beeExploreTimeMultiplier))
            else:
                agent = Agent(agent_id, Exploring(ExploreTimeMultiplier=self.beeExploreTimeMultiplier),
                              piping_threshold=self.beePipingThreshold,
                              piping_time=self.beePipingTimer,
                              global_velocity=self.beeGlobalVelocity,
                              explore_time_multiplier=self.beeExploreTimeMultiplier,
                              rest_time=self.beeRestTime,
                              dance_time=self.beeDanceTime,
                              observe_time=self.beeDanceTime,
                              site_assess_time=self.beeSiteAccessTime,
                              site_assess_radius=self.beeSiteAccessRadius)
            self.agents[agent_id] = agent
            self.states[Exploring().__class__].append(agent_id)

    def reset_sim(self):
        self.clear_for_reset()
        self.add_agents()

    def create_potential_fields(self):
        for obstacle in self.obstacles:
            location = [obstacle[0], obstacle[1]]
            spread = 40 #  What should this be?
            strength = 1 #  Dictates the strength of the field
            self.potential_fields.append(PotentialField(location, obstacle[2], spread, strength, type='tangent'))

    def potential_field_sum(self, location):
        dx = 0
        dy = 0
        for field in self.potential_fields:
            delta = field.effect(location)
            dx += delta[0]
            dy += delta[1]
        return [0, 0]
        #return [dx, dy]

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
                    "repulsors" : list(map(lambda r: r.toJson(), self.repulsors )), #self.repulsors,
                    "agents"    : self.agents_to_json()
                }
            })
        )

    def agents_to_json(self):
        agents = []
        for agent_id in self.agents:
            agent_dict = {}
            agent_dict["x"] = self.agents[agent_id].location[0]
            agent_dict["y"] = self.agents[agent_id].location[1]
            agent_dict["id"] = self.agents[agent_id].id
            agent_dict["state"] = self.agents[agent_id].state.name
            agent_dict["direction"] = self.agents[agent_id].direction
            agent_dict["potential_site"] = self.agents[agent_id].potential_site
            agent_dict["live"] = self.agents[agent_id].live
            agents.append(agent_dict)
        return agents

file = "updated_environment.txt"
world = Environment(os.path.join(ROOT_DIR, file))
world.run()
