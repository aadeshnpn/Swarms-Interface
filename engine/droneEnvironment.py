from Environment import *
from droneCode.droneHubController import DroneHubController
from Measurements import *
from droneCode.agent.droneAgent import *
from Pheromone import *
import time


measurer = Measurements(5) # Agents are connected if they are in the same state and distance 5 away from each other
class DroneEnvironment(Environment):
    def __init__(self, file_name):
        eprint("\n \n \n \n \nStarting Drone Simulation \n \n \n \n")
        #eprint("file_name = " + str(file_name))
        self.info_stations = []
        self.number_of_agents = 100

        self.sites = []
        self.x_limit=0;
        self.y_limit=0;
        self.actions = {"turns": 0, "stateChanges": 0}
        self.influenceActions = {"turns": 0, "stateChanges": 0}
        self.totalInfluence = []
        # self.patrolLocations={};
        self.states = {"exploring": {},"reportToHub":{},"follow_site": {},"returnToSite":{}, "observing":{},"resting":{},'dancing':{},'assessing':{},'siteSearch':{},'site assess':{},'piping':{},'commit':{}}
        self.pheromoneList =[]
        self.xPos = []
        self.yPos = []
        self.dataStates = []
        if args.agentNum:
            self.number_of_agents = args.agentNum

        super().__init__(file_name)

    def init_hubController(self):
        self.hubController = DroneHubController([self.hub["x"], self.hub["y"], self.hub["radius"]], self.agents, self,
                                            self.parameters["ExploreTime"])


    def isFinished(self):
        #self.args.commit_stop and
        return (len(self.states["commit"]) + len(self.dead_agents) >= self.number_of_agents * .95 and len(self.states["piping"]) < 1)

    def finished(self):
        # finalStats = {
        #             "type": "stats",
        #             "data":
        #                 {
        #                     "world": 0,
        #                     "date": time.strftime("%c"),
        #                     "totalTicks": self.stats["ticks"],
        #                     "influence": self.totalInfluence,
        #                     "connectionsMeasure": measurer.connections_measure,
        #                     "clusteringMeasure": measurer.avg_clustering_measure,
        #                     "score": 0
        #                 }
        #         }
        finalStats = {
            "type": "stats",
            "data":
                {
                    "date": time.strftime("%c"),
                    "totalTicks": self.stats["ticks"],
                    "influence":self.totalInfluence,
                    "xPos": self.xPos,
                    "yPos": self.yPos,
                    "states": self.dataStates,
                    "world": 0,
                    "connectionsMeasure":[],
                    "clusteringMeasure":[],
                    "score": 0
                }
        }
        print(json.dumps(finalStats))


        # name: String, TODO
        # world: String, TODO
        # date: Date, TODO
        # totalTicks: Number,
        # influence: [Number],
        # connectionsMeasure: [Number],
        # clusteringMeasure: [Number],
        # score: Number TODO
        #send out data for the connections, average clustering, influence,
        #total ticks, world number or whatever,
        #then some way to measure the success of the simulation

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
                               "PipingTime": 1200,
                               "PheromoneStrength":25
                               }

    #compute measurements is ran every loop in the run function by environment.py
    def compute_measurements(self):
        xPos = []
        yPos = []
        states= []
        for id, agent in self.agents.items():
            xPos.append(agent.location[0])
            yPos.append(agent.location[1])
            states.append(agent.state.name)
        self.xPos.append(xPos)
        self.yPos.append(yPos)
        self.dataStates.append(states)

        # measurer.compute_measurements(self.agents.values())
        actions = (self.actions["turns"] + self.actions["stateChanges"])
        influence = 0
        if actions > 0:
            influence = (self.influenceActions["turns"] + self.influenceActions["stateChanges"])/actions
        self.influenceActions =dict.fromkeys(self.influenceActions,0)
        self.actions = dict.fromkeys(self.actions,0)
        self.totalInfluence.append(influence)

        # self.actions = {"turns": 0, "stateChanges": 0}
        # self.influenceActions = {"turns": 0, "stateChanges": 0}
        # self.totalInfluence = []

    def initialize_agents(self):
        rest_num = int(.1 * np.sqrt(self.number_of_agents))
        for x in range(self.number_of_agents - rest_num):
            self.create_explorer(x)

        for y in range(rest_num):
            self.create_rester(x + 1 + y)

    #agent_id could use improvement
    def create_explorer(self, agentId):
        agent_id = str(agentId)
        agent = Drone(self, agent_id, Exploring(None), self.hub, self.parameters,
          count = int(self.parameters["ExploreTime"]))
        self.agents[agent_id] = agent


    def create_rester(self, agentId):
        agent_id = str(agentId)
        #eprint("rest_num = " + str(agent_id))
        agent = Drone(self, agent_id, Resting(None), self.hub, self.parameters, count=int(self.parameters["RestTime"]))
        self.agents[agent_id] = agent

    def clear_for_reset(self):
        super().clear_for_reset()
        self.info_stations.clear()
        self.create_infoStations()

    def create_infoStations(self):
        for x in range(len(self.sites)):
            self.info_stations.append(InfoStation(self.parameters))
    def get_id(self,agent):
        for i, site in enumerate(self.sites):
            x_dif = agent.location[0] - site.x
            y_dif = agent.location[1] - site.y
            tot_dif = (x_dif ** 2 + y_dif ** 2) ** .5
            if tot_dif <= site.radius:
                return site.id
    def get_pheromone(self,agent):
        #x=int(int(agent.location[0]+self.x_limit)/3)
        #y=int(int(agent.location[1]+self.y_limit)/3)
        x,y = self.worldToPher(agent.location[0],agent.location[1])
        return self.pheromoneList[x,y]
    def create_pheromone_dict(indices,i,x_limit,y_limit):
        pheromone_dict = {}
        x,y = pherToWorld(indicies[0][i],indicies[1][i],x_limit,y_limit)
        pheromone_dict["x"] = x
        pheromone_dict["y"] = y
        return pheromone_dict
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
    def get_numberOfAgentsInState(self,site_id):
        num=0;
        for ID in self.agents:

            if self.agents[ID].potential_site != None and self.agents[ID].potential_site[2] == site_id:
                num+=1
        return num
    def get_siteIDs(self,agent):

        ids=[]
        for i, site in enumerate(self.sites):
            x_dif = agent.location[0] - site.x
            y_dif = agent.location[1] - site.y
            tot_dif = (x_dif ** 2 + y_dif ** 2) ** .5

            if tot_dif -agent.view <= site.radius:
                ids.append(site.id)
        # eprint(ids)
        return ids
    def get_q(self, agent):
        # Calculate the distance between the coordinates and the center of each site, then compare that distance with
        # the radius of the obstacles, traps, rough spots, and sites
        for info in self.info_stations:
            info.radius+=.1
        for i, site in enumerate(self.sites):
            x_dif = agent.location[0] - site.x
            y_dif = agent.location[1] - site.y
            tot_dif = (x_dif ** 2 + y_dif ** 2) ** .5

            if tot_dif -agent.view <= site.radius:
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
                # eprint(site.id)
                return {
                    "radius": site.radius,
                    "q": site.q_value - (tot_dif / site.radius * .25 * site.q_value),     #gradient!
                    "id": site.id,
                    "site_q": site.q_value
                }

        return {"radius": -1, "q": 0, "site_q": 0}

    def to_json(self):
        # eprint(len(self.hubController.agentsInHub))
        self.hub["agentsIn"]=len(self.hubController.agentsInHub)
        return(
            json.dumps(
                {
                    "type": "update",
                    "data":
                        {
                            "x_limit": self.x_limit,
                            "y_limit": self.y_limit,
                            "hub": self.hub,
                            "sites": self.sites.to_json(),
                            "obstacles": self.obstacles,
                            "traps": self.traps,
                            "rough": self.rough,
                            "attractors": list(map(lambda a: a.toJson(), self.flowController.attractors)),
                            "repulsors": list(map(lambda r: r.toJson(), self.flowController.repulsors)),
                            "agents": self.agents_to_json(),
                            "dead_agents": self.dead_agents_to_json(),
                            "pheromones": self.pheromones_to_json(),
                            "patrolUpdate": len(self.patrolList)
                        }
                })
        )

    def build_json_environment(self):
        super().build_json_environment()
        self.create_infoStations()

if __name__ == "__main__":
    file = "world.json"

    world = DroneEnvironment(os.path.join(ROOT_DIR, file))

    world.run()


    if args.stats:
        world.printStats()
