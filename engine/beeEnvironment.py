from Environment import *

class BeeEnvironment(Environment):
    def __init__(self, file_name):
        self.info_stations = []
        super().__init__(file_name)

    def initialize_agents(self):
        rest_num = int(.1 * np.sqrt(self.number_of_agents))
        for x in range(self.number_of_agents - rest_num):
            self.create_explorer(x)

        for y in range(rest_num):
            self.create_rester(x + 1 + y)

    #agent_id could use improvement
    def create_explorer(self, agentId):
        agent_id = str(agentId)
        agent = Bee(self, agent_id, Exploring(None), self.hub, self.parameters,
          count = int(self.parameters["ExploreTime"]))
        self.agents[agent_id] = agent

    def create_rester(self, agentId):
        agent_id = str(agentId)
        #eprint("rest_num = " + str(agent_id))
        agent = Bee(self, agent_id, Resting(None), self.hub, self.parameters, count=int(self.parameters["RestTime"]))
        self.agents[agent_id] = agent

    def clear_for_reset(self):
        super().clear_for_reset()
        self.info_stations.clear()
        self.create_infoStations()

    def create_infoStations(self):
        for x in range(len(self.sites)):
            self.info_stations.append(InfoStation(self.parameters))

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
                    #TODO: move this to agents, which would be faster
                    info.check_for_changes(agent,agent.parameters, agent.param_time_stamp)
                    agent.infoStation = info
                # return the q_value as a linear gradient. The center of the site will return 100% of the q_value,
                # the edge will return 75% of the q_value
                return {
                    "radius": site["radius"],
                    "q": site["q_value"] - (tot_dif / site["radius"] * .25 * site["q_value"]) #gradient!
                }

        return {"radius": -1, "q": 0}
    def to_json(self):
        print(
            json.dumps(
                {
                    "type": "update",
                    "data":
                        {
                            "x_limit": self.x_limit,
                            "y_limit": self.y_limit,
                            "hub": self.hub,
                            "sites": self.sites,
                            "obstacles": self.obstacles,
                            "traps": self.traps,
                            "rough": self.rough,
                            "attractors": list(map(lambda a: a.toJson(), self.attractors)),
                            "repulsors": list(map(lambda r: r.toJson(), self.repulsors)),
                            "agents": self.agents_to_json(),
                            "dead_agents": self.dead_agents_to_json(),
                            "pheromones": ""
                        }
                })
        )


    def dead_agents_to_json(self):
        dead_agents = []
        for agent in self.dead_agents:
            agent_id = agent.id
            agent_dict = {}
            agent_dict["x"] = agent.location[0]
            agent_dict["y"] = agent.location[1]
            agent_dict["id"] = agent.id
            agent_dict["state"] = agent.state.name
            agent_dict["direction"] = agent.direction
            agent_dict["live"] = agent.live

            if(agent.__class__.__name__ =="Bee"):
                agent_dict["potential_site"] = agent.potential_site
                agent_dict["qVal"] = agent.q_value
            dead_agents.append(agent_dict)
        return dead_agents

    def agents_to_json(self):
        agents = []
        for agent_id in self.agents:
            # would it not be better to initialize this dictionary all at once? - idkmybffjill
            # dict = {"x":loc[0], "y":loc[1], "id":id, ..., "qVal":q_value}
            agent_dict = {}
            agent_dict["x"] = self.agents[agent_id].location[0]
            agent_dict["y"] = self.agents[agent_id].location[1]
            agent_dict["id"] = self.agents[agent_id].id
            agent_dict["state"] = self.agents[agent_id].state.name
            agent_dict["direction"] = self.agents[agent_id].direction
            agent_dict["live"] = self.agents[agent_id].live

            if(self.agents[agent_id].__class__.__name__ =="Bee"):
                agent_dict["potential_site"] = self.agents[agent_id].potential_site
                agent_dict["qVal"] = self.agents[agent_id].q_value
            agents.append(agent_dict)
        return agents

    def build_json_environment(self):
        if self.args.randomize:
            generator = worldGenerator()
            js = generator.to_json()
            data = json.loads(js)
        else:
            json_data = open(self.file_name).read()
            data = json.loads(json_data)

        self.stats["world"] = data

        self.x_limit = data["dimensions"]["x_length"] / 2
        self.y_limit = data["dimensions"]["y_length"] / 2
        self.hub = data["hub"]
        self.sites = data["sites"]
        self.obstacles = data["obstacles"]
        self.traps = data["traps"]
        self.rough = data["rough terrain"]
        self.create_potential_fields()

        self.create_infoStations()



if __name__ == "__main__":
    file = "world.json"
    world = BeeEnvironment(os.path.join(ROOT_DIR, file))
    world.run()

    if args.stats:
        world.printStats()
