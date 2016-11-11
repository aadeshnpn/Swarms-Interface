import agent1
import numpy as np

__author__ = "Nathan Anderson"


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
        for x in range(0, 100):
            self.add_agent(str(x))

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
        agent = agent1.Point(agent_id, "E")
        self.agents[agent_id] = [agent, self.hub[0],self.hub[1]]

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
                return site[3] / site[2] ** (tot_dif / site[2])  # Uses an inverse-power function to oompute q_value
                                                                 # based on distance from center of site

        return 0

    # Move a single agent.
    def smooth_move(self, agent, velocity, bounce):
        if bounce is True:
            agent.direction -= np.pi  # Rotate the direction by 180 degrees if the object encountered an obstacle
        else:
            delta_d = np.random.normal(0, .3)
            agent.direction = (agent.direction + delta_d) % (2 * np.pi)

        self.agents[agent.id][1] += np.cos(agent.direction) * velocity
        self.agents[agent.id][2] += np.sin(agent.direction) * velocity

        # If the agent goes outside of the limits, it re-enters on the opposite side.
        if self.agents[agent.id][1] > self.x_limit:
            self.agents[agent.id][1] -= 2*self.x_limit
        elif self.agents[agent.id][1] < self.x_limit * -1:
            self.agents[agent.id][1] += 2 * self.x_limit
        if self.agents[agent.id][2] > self.y_limit:
            self.agents[agent.id][2] -= 2 * self.y_limit
        elif self.agents[agent.id][2] < self.y_limit * -1:
            self.agents[agent.id][2] += 2 * self.y_limit

    # Move all of the agents
    def run(self):
        dead_count = 0
        high_q = 0
        for x in range(300):
            for agent_id in self.agents:
                agent = self.agents[agent_id][0]
                if agent.live is True:
                    q = self.get_q(self.agents[agent_id][1], self.agents[agent_id][2])
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
                        self.smooth_move(agent, 1, False)
        print("COUNT DEAD:", dead_count)
        print("High Q score:", high_q)

    def hub_to_string(self):
        return "Hub: " + "(" + str(self.hub[0]) + "," + str(self.hub[1]) + "," + str(self.hub[2]) + ")"

    def agents_to_string(self):
        ag_string = ""
        for agent_id in sorted(self.agents):
            agent = self.agents[agent_id][0]
            if agent.live is True:
                ag_string += "Agent: " + "(" + agent_id + "," + str(self.agents[agent_id][1]) + "," +\
                         str(self.agents[agent_id][2]) + "," + str(agent.state) + "," + str(agent.direction) + ")\n"
        return ag_string

    def sites_to_string(self):
        st_string = ""
        for site in self.sites:
            st_string += "Site: " + "(" + str(site[0]) + "," + str(site[1]) + "," + str(site[2]) + "," + str(site[3]) + ")\n"
        return st_string

    def obstacles_to_string(self):
        ob_string = ""
        for obstacle in self.obstacles:
            ob_string += "Obstacle: " + "(" + str(obstacle[0]) + "," + str(obstacle[1]) + "," + str(obstacle[2]) + ")\n"
        return ob_string

    def traps_to_string(self):
        tr_string = ""
        for trap in self.traps:
            tr_string += "Trap: " + "(" + str(trap[0]) + "," + str(trap[1]) + "," + str(trap[2]) + ")\n"
        return tr_string

    def rough_to_string(self):
        ro_string = ""
        for spot in self.rough:
            ro_string += "Rough Spot: " + "(" + str(spot[0]) + "," + str(spot[1]) + "," + str(spot[2]) + ")\n"
        return ro_string

    def change_state(self,agent_id,new_state):
        self.agents[agent_id][0].state = new_state

'''
world = Environment("data.txt")
world.run()
world.change_state("1","D")
print(world.hub_to_string() + "\n")
print(world.agents_to_string())
print(world.sites_to_string())
print(world.obstacles_to_string())
print(world.traps_to_string())
print(world.rough_to_string())
'''