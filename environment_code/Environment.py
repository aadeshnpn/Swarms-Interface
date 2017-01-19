from agent.agent import *
import flowController
import numpy as np
import json
import os
import socket
import sys
import time

import geomUtil

__author__ = "Nathan Anderson"

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

class Environment:

    def __init__(self, file_name):
        self.file_name = file_name
        self.x_limit = 0
        self.y_limit = 0
        self.hub = [0, 0, 1]
        self.sites = []
        self.obstacles = []
        self.traps = []
        self.rough = []
        self.agents = {}
        self.build_environment()  # Calls the function to read in the initialization data from a file and stores it in a list
        for x in range(59):
            self.add_agent(str(x))
        for y in range(1):
            agent = Agent(str(y), Assessing())
            agent.potential_site = [-50, -50]
            self.agents[str(y)] = agent
        self.attractors = []#[flowController.Attractor((0, 100)), flowController.Attractor((-100, 0))]
        self.repulsors = [flowController.Repulsor((60, -60)), flowController.Repulsor((-40,-40))]

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
        if(len(self.attractors) > 0 and self.attractors[0].time_ticks > 0):
            self.attractors[0].time_ticks -= 1
        else:
            self.attractors = []

        if(len(self.repulsors) > 0 and self.repulsors[0].time_ticks > 0):
            self.repulsors[0].time_ticks -= 1
        else:
            self.repulsors = []



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

                    assert abs(trap[0]) + trap[2] < self.x_limit and abs(
                        trap[1]) + trap[2] < self.y_limit, "Not all traps are inside Environment boundaries"

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

    # Method to add an agent to the hub
    def add_agent(self, agent_id):
        agent = Agent(agent_id, Exploring())
        self.agents[agent_id] = agent

    # Function to return the Q-value for given coordinates. Returns 0 if nothing is there, -1 if it hits an obstacle,
    # -2 if it gets caught in a trap, -3 if it's moving through rough terrain, and a value between 0 and 1 if it finds
    # a site.
    def get_q(self, x, y):

        # Calculate the distance between the coordinates and the center of each site, then compare that distance with
        # the radius of the obstacles, traps, rough spots, and sites

        for obstacle in self.obstacles:
            x_dif = x - obstacle[0]
            y_dif = y - obstacle[1]
            if x_dif ** 2 + y_dif ** 2 <= obstacle[2] ** 2:
                return -1

        for trap in self.traps:
            x_dif = x - trap[0]
            y_dif = y - trap[1]
            if x_dif**2 + y_dif**2 <= trap[2]**2:
                return -2

        for spot in self.rough:
            x_dif = x - spot[0]
            y_dif = y - spot[1]
            if x_dif ** 2 + y_dif ** 2 <= spot[2] ** 2:
                return -3
        for site in self.sites:
            x_dif = x - site[0]
            y_dif = y - site[1]
            tot_dif = (x_dif ** 2 + y_dif ** 2) ** .5
            if tot_dif <= site[2]:
                return site[3]  # for testing purposes I'm just returning the q value.
                #return (site[3] / site[2] ** (tot_dif / site[2])) * site[4] # Uses an inverse-power function to compute
                                                                    # q_value based on distance from center of site,
                                                                    # multiplied by the site's ease of detection
        return 0

    def get_nearby_agents(self, agent_id):
        nearby = []
        for other_id in self.agents:
            if other_id != agent_id:
                if ((self.agents[other_id].location[0] - self.agents[agent_id].location[0])**2 + (self.agents[other_id].location[1] - self.agents[agent_id].location[1])**2)**.5 <= 30:
                    #nearby.append([self.agents[other_id].site_location, self.agents[other_id].q_found])
                    nearby.append(self.agents[other_id])
        return nearby

    def get_nearby_attracted_agents(self, agent_id):
        attracted = []
        nearby = self.get_nearby_agents(agent_id)
        for agent in nearby:
            if(agent.attracted is True):
                attracted.append(agent)
        return attracted

    # Move a single agent. I THINK THIS MAY BE unnecessary now...
    def smooth_move(self, agent, velocity, bounce):
        if bounce is True:
            agent.direction -= np.pi  # Rotate the direction by 180 degrees if the object encountered an obstacle
        else:
            delta_d = np.random.normal(0, .3)
            agent.direction = (agent.direction + delta_d) % (2 * np.pi)

        agent.location[0] += np.cos(agent.direction) * velocity
        agent.location[1] += np.sin(agent.direction) * velocity

            # If the agent goes outside of the limits, it re-enters on the opposite side.
        if agent.location[0] > self.x_limit:
            agent.location[0] -= 2 * self.x_limit
        elif agent.location[0] < self.x_limit * -1:
            agent.location[0] += 2 * self.x_limit
        if agent.location[1] > self.y_limit:
            agent.location[1] -= 2 * self.y_limit
        elif agent.location[1] < self.y_limit * -1:
            agent.location[1] += 2 * self.y_limit

    # agent asks to go in a direction at a certain velocity, use vector addition, updates location
    #unnecessary function???
    def suggest_new_direction(self, agentId):
        agent = self.agents[agentId]
        #add collision checking for other bees
        agent.location[0] += np.cos(agent.direction) * agent.velocity
        agent.location[1] += np.sin(agent.direction) * agent.velocity
        for agent_id in self.agents:
            if (self.agents[agent_id].location[:] == agent.location[:]) and (agentId != agent_id):
                agent.location[0] -= np.cos(agent.direction) * agent.velocity
                agent.location[1] -= np.sin(agent.direction) * agent.velocity
                break

        if agent.location[0] > self.x_limit:
            agent.location[0] -= 2 * self.x_limit
        elif agent.location[0] < self.x_limit * -1:
            agent.location[0] += 2 * self.x_limit
        if agent.location[1] > self.y_limit:
            agent.location[1] -= 2 * self.y_limit
        elif agent.location[1] < self.y_limit * -1:
            agent.location[1] += 2 * self.y_limit

    # Move all of the agents
    def run(self):
        dead_count = 0
        high_q = 0
        while True:
            world.to_json()
            for agent_id in self.agents:
                agent = self.agents[agent_id]
                if agent.live is True:
                    #q = self.get_q(self.agents[agent_id].location[0], self.agents[agent_id].location[1])
                    """if q > agent.q_found:
                        agent.q_found = q
                        agent.site_location = [agent.location[0], agent.location[1]]
                    if q > high_q:
                        high_q = q
                    elif q == -1:
                        self.smooth_move(agent, 1, True)
                    elif q == -2:
                        agent.live = False
                        dead_count += 1
                    elif q == -3:
                        self.smooth_move(agent, .5, False)
                    else:
                        self.smooth_move(agent, 1, False)"""
                    agent.sense(self)
                    agent.act()
                    self.suggest_new_direction(agent.id)
                    agent.update()
            self.updateFlowControllers()
            t_end = time.time() + 1/300
            while time.time() < t_end: # always resolves to true -> 1/300 in python equals 0
                pass

        eprint("[Engine] COUNT DEAD:", dead_count)
        eprint("[Engine] High Q score:", high_q)

    def change_state(self, agent_id, new_state):
        self.agents[agent_id].state = new_state

    def to_json(self):
        print(json.dumps({"type": "update", "data": {"x_limit": self.x_limit, "y_limit": self.y_limit, "hub": self.hub, "sites":
            self.sites, "obstacles": self.obstacles, "traps": self.traps, "rough": self.rough, "agents":
            self.agents_to_json()}}))

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


world = Environment(os.path.join(ROOT_DIR, "data.txt"))
world.run()
