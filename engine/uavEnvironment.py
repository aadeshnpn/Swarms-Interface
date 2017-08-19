from Environment import *
from beeCode.agent.uav import *
from beeCode.agent.evader import *
from beeCode.uavHubController import UavHubController
import logging
class BeeEnvironment(Environment):
    def __init__(self, file_name):
        eprint("file_name = " + str(file_name))
        logging.basicConfig(filename='uavSim.log',level=logging.DEBUG)
        eprint("LOGGING")
        self.info_stations = []
        self.number_of_agents = 100
        self.sites = []
        if args.agentNum:
            self.number_of_agents = args.agentNum

        super().__init__(file_name)

    def init_hubController(self):
        self.hubController = UavHubController([self.hub["x"], self.hub["y"], self.hub["radius"]], self.agents, self,
                                            self.parameters["ExploreTime"])

    def isFinished(self):
        return (args.commit_stop and "commit" in self.stats["stateCounts"] and
                self.stats["stateCounts"]["commit"] + len(self.dead_agents) >=
                self.number_of_agents * .95)

    def init_parameters(self):
        self.stats = {}
        self.stats["parameters"] = {"environment": {}, "agent": {}}
        self.stats["parameters"]["environment"]["numberOfAgents"] = self.number_of_agents

        #  bee parameters
        self.parameters = {"PipingThreshold": int(self.number_of_agents * .15),
                               "Velocity": 1.25,
                               "ExploreTime": 2000,
                               "RestTime": 1000,
                               "DanceTime": 1150,
                               "ObserveTime": 2000,
                               "SiteAssessTime": 250,
                               "PipingTime": 1200
                               }

    def initialize_agents(self):
        #for z in range(-2,0):
        #    self.create_t_uav(z)
        for x in range(0, 5):
            self.create_uav(x)
        for y in range(5, 31):
            self.create_evader(y)
        #self.agents[str(-1)].counter = -100000
        #self.agents[str(-2)].counter = 100000
        #self.agents[str(-2)].velocity *= 1

        #for y in range(5, 10):
        #    self.create_explorer(y)
    def create_t_uav(self, agentId):
        agent_id = str(agentId)
        uav = UAV(self, agent_id, UAV_Patrolling_Rect(None), self.hub, self.parameters)
        self.agents[agent_id] = uav
    def create_evader(self, agentId):
        agent_id = str(agentId)
        evader = Evader(self, agent_id, Evading(None), self.parameters)
        self.agents[agent_id] = evader

    #could use one more layer of abstraction, create_agent which accepts reference to newly created object
    def create_uav(self, agentId):
        agent_id = str(agentId)
        agent = UAV(self, agent_id,  UAV_PheromonePatrol(None), self.hub, self.parameters,  count = int(self.parameters["ExploreTime"]))
        agent.location = [10.0,30.0]
        self.agents[agent_id] = agent

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
        return(
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
                            "attractors": list(map(lambda a: a.toJson(), self.flowController.attractors)),
                            "repulsors": list(map(lambda r: r.toJson(), self.flowController.repulsors)),
                            "agents": self.agents_to_json(),
                            "dead_agents": self.dead_agents_to_json(),
                            "pheromones": ""
                        }
                })
        )
    def build_patrolRoutes(self, data):
        self.patrol_routes = data['patrol_routes']

    def build_json_environment(self):
        data = super().build_json_environment()
        self.create_infoStations()
        self.build_patrolRoutes(data)

if __name__ == "__main__":
    file = "world.json"
    world = BeeEnvironment(os.path.join(ROOT_DIR, file))
    world.run()
    if args.stats:
        world.printStats()
