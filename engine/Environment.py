import json
import os
import time
import math
import random
from datetime import datetime
import numpy as np
from abc import ABC, abstractmethod
# Json doesn't work with numpy type 64
# import numpy as np

from utils.debug import *
from InputEventManager import InputEventManager
#from beeCode.agent.agent import *
#from beeCode.hubController import hubController
from beeCode.infoStation import InfoStation

from beeCode.worldGenerator import *
import utils.flowController as flowController
import utils.geomUtil as geomUtil
from utils.potentialField import PotentialField
from Sites import *

import argparse
import time
starttime=time.time()


parser = argparse.ArgumentParser()
parser.add_argument("-m", "--model", choices=["Ant", "Bee", "Uav" , "Drone"], help="Run an 'ant', 'bee', 'uav', or 'drone' simulation")
parser.add_argument("-n", "--no-viewer", action="store_true", help="Don't output viewer world info")
parser.add_argument("-s", "--stats", action="store_true", help="Output json stats after simulation")
parser.add_argument("-c", "--commit-stop", action="store_true", help="Stop simulation after all agents have committed")
parser.add_argument("-t", "--tick-limit", type=int, help="Stop simulation after TICK_LIMIT ticks")
parser.add_argument("-r", "--randomize", action="store_true", help="randomizes the environment")
parser.add_argument("-l", "--log_file", type=str, help="Log input events to LOG_FILE")
parser.add_argument("-e", "--seed", type=int, help="Run the simulation with the specified random seed")
parser.add_argument("-p", "--pipe", type=str, help="Connect to the specified named pipe")
parser.add_argument("-a", "--agentNum", type=int, help="specifies number of agents")
parser.add_argument("-x", "--siteNum", type=int, help="specifies number of sites")
parser.add_argument("-z", "--attackType", type=int, help="specifies enemy attack scenario")
parser.add_argument("-q", "--patrolLocations1",type=tuple, help="specifies locations for agents to start exploring")
parser.add_argument("-u", "--createWorldSize",type=str, help="specifies locations for agents to start exploring")


args = parser.parse_args()

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

class Environment(ABC):
    def __init__(self, file_name):

        if (not args.seed):

            self.seed = np.random.randint(np.iinfo(np.uint32).max, dtype=np.int64)

        else:
            self.seed = args.seed

        np.random.seed(self.seed)
        self.logfile = None
        if (args.log_file):
            base_fname = args.log_file
            fname = base_fname
            fname_id = 1
            while (os.path.exists(fname)):
                fname_id += 1
                fname = base_fname + "-" + str(fname_id)
            self.logfile = open(fname, "w+")
            self.logfile.write("%s\n" % json.dumps({"seed":self.seed}))

        # self.patrolLocations;
        # eprint (args.patrolLocations1)

        # eprint(self.patrolList)
        # eprint(self.avoidList)
        # eprint((self.updatedPatrol))
        self.timings=[]
        self.args = args
        self.wait=0;
        self.file_name = file_name
        self.x_limit = 0
        self.y_limit = 0
        self.hub = {}
        self.sitesToIgnore=set()
        self.hubController = None
        self.obstacles = []
        self.potential_fields = []
        self.traps = []
        self.rough = []
        self.agents = {}
        self.dead_agents = []
        self.frames_per_sec = 100
        self.numberOfSwarms = 1
        self.agentsFollowSite={};
        self.init_parameters()
        self.build_json_environment()  # Calls the function to read in the initialization data from a file



        self.stats["parameters"]["agent"] = self.parameters
        self.stats["type"] = "stats"
        self.stats["measurements"] = {}
        self.restart_simulation = False
        self.initialize_agents()
        self.inputEventManager = InputEventManager()
        self.init_hubController()
        '''
        self.hubController = hubController([self.hub["x"], self.hub["y"], self.hub["radius"]], self.agents, self,
                                           self.parameters["ExploreTime"])
        '''
        self.flowController = flowController.FlowController()
        self.isPaused = False

        self.patrolLocations=args.patrolLocations1
        self.createWorldSize=[int(i) for i in args.createWorldSize.split(",")]
        # self.windowSizeRatio=[]
        self.windowSizeRatio=[(self.createWorldSize[0]/(self.x_limit*2)),(self.createWorldSize[1]/(self.y_limit*2))]


        self.patrolList=[]
        self.avoidList=[]
        # eprint(self.patrolLocations)

        self.updatedPatrol=[]
        self.parseLocation(self.patrolLocations,self.updatedPatrol)
        self.patrolToDict()
        self.agentsPatrolling=0;

        self.livePatrolList=[];
        self.liveAvoidList=[];
        self.liveUpdatedPatrol=[];
        self.liveAgentsPatrolling=0;
        #self.attractors = []
        #self.repulsors = []

        # json aux
        self.previousMetaJson = None

        self.chat_history = ""

    def patrolToDict(self):
        patrol={"x":None,"y":None,"mode":None}
        for x in range(0,len(self.updatedPatrol),3):

            if int(self.updatedPatrol[x+2])==0:
                self.patrolList.append({"x":int(self.updatedPatrol[x])/self.windowSizeRatio[0]-self.x_limit,
                                        "y":-int(self.updatedPatrol[x+1])/self.windowSizeRatio[1]+self.y_limit,
                                        "mode":int(self.updatedPatrol[x+2])})
            # patrol["x"]=None
            # patrol["y"]=None
            # patrol["mode"]=None
            elif int(self.updatedPatrol[x+2])==1:
                self.avoidList.append({"x":int(self.updatedPatrol[x])/self.windowSizeRatio[0]-self.x_limit,
                                        "y":-int(self.updatedPatrol[x+1])/self.windowSizeRatio[1]+self.y_limit,
                                        "mode":int(self.updatedPatrol[x+2])})
                self.flowController.newRepulsor({"x":int(self.updatedPatrol[x])/self.windowSizeRatio[0]-self.x_limit,
                                        "y":-int(self.updatedPatrol[x+1])/self.windowSizeRatio[1]+self.y_limit,
                                        "radius":20})

    def parseLocation(self,toParse,insertInto):
        i=0;
        digit={"iChange":1,"digit":""}
        # eprint(toParse)
        for pos in toParse:
            # eprint("index " + str(i))
            if pos.isdigit():
                # eprint(str(pos)+" at index " + str(i))
                # eprint(pos)

                digit["digit"]=self.getNumber(i)["digit"]
                digit["iChange"]=self.getNumber(i)["iChange"]

                # eprint(digit)
                i+=digit["iChange"]
                # eprint()
                if digit["digit"] != "":
                    insertInto.append(digit["digit"])


                        ##
                        # eprint("COMMA"
            else:
                i+=1;
        # eprint (self.patrolLocations)

    def getNumber(self,i):
        digit={"iChange":0,"digit":""};
        # eprint("Should be the same as first")
        # eprint(self.patrolLocations[i])
        # eprint(self.patrolLocations)
        for x in range(i,len(self.patrolLocations)):
            # eprint(self.patrolLocations[x])
            if self.patrolLocations[x].isdigit():
                # eprint(self.patrolLocations[x])
                digit["digit"]+=self.patrolLocations[x]
            else:
                break;
            digit["iChange"]+=1
        # eprint("")
        return digit

    @abstractmethod
    def init_hubController(self):
        pass

    @abstractmethod
    def init_parameters(self):
        pass

    def countUpdate(self, state1, state2):
        pass

    # Function to initialize data on the environment from a json file
    @abstractmethod
    def build_json_environment(self):
        if self.args.randomize:
            generator = worldGenerator()
            js = generator.to_json()
            data = json.loads(js)
        else:
            eprint(self.file_name)
            json_data = open(self.file_name).read()
            data = json.loads(json_data)

        self.stats["world"] = data

        self.x_limit = data["dimensions"]["x_length"] / 2
        self.y_limit = data["dimensions"]["y_length"] / 2

        self.hub = data["hub"]

        # eprint('ScenarioType: ', args.scenarioType)
        # eprint(args.attackType)
        if(args.model =="Drone"):
            self.sites = Sites(args.siteNum, self.hub["x"], self.hub["y"], args.attackType)
            for site in self.sites:
                self.agentsFollowSite[site.id]={"number":0,"agentIds":[],"reporting":False,"agentDropPheromone":0,"returnTime":1500}
        else:
            self.sites = data["sites"]
        self.obstacles = data["obstacles"]
        self.traps = data["traps"]
        self.rough = data["rough terrain"]
        self.create_potential_fields()
        return data

    # Returns 0 if terrain is clear, -1 if it is rough (slows velocity of agent to half-speed), -2 if there is an
    # obstacle, and -3 if there is a trap
    def check_terrain(self, x, y,view):
        #eprint(self.agents)
        for trap in self.traps:
            x_dif = x - trap["x"]
            y_dif = y - trap["y"]
            if x_dif ** 2 + y_dif ** 2 <= (trap["radius"]) ** 2:
                return -3

        for obstacle in self.obstacles:
            x_dif = x+view - obstacle["x"]
            y_dif = y+view - obstacle["y"]
            if (x_dif/view) ** 2 + (y_dif/view) ** 2 <= (obstacle["radius"]) ** 2:
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
        '''potential_field_effect = self.potential_field_sum(agent.location)
        potential_field_v = np.sqrt(potential_field_effect[0] ** 2 + potential_field_effect[1] ** 2)
        potential_field_d = np.arctan2(potential_field_effect[1], potential_field_effect[0])'''

        # eprint(agent.GlobalVelocity)
        proposed_x = agent.location[0] + np.cos(
            agent.direction) * agent.velocity  # + np.cos(potential_field_d) * potential_field_v
        proposed_y = agent.location[1] + np.sin(
            agent.direction) * agent.velocity  # + np.sin(potential_field_d) * potential_field_v

        terrain_value = self.check_terrain(proposed_x, proposed_y,agent.view)
        self.wait+=1
        if terrain_value == 0:
            agent.location[0] = proposed_x
            agent.location[1] = proposed_y


            #agent.append({"X":agent.location[0],"Y":agent.location[1]})
            #eprint(agent.locationsVisited)
        elif terrain_value == -3:
            agent.location[0] = proposed_x
            agent.location[1] = proposed_y
            agent.live = False
            self.dead_agents.append(agent)
            self.stats["deadAgents"] += 1
            #eprint("dead: ", self.stats["deadAgents"])
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
            agent.location[0] += np.cos(
                agent.direction) * agent.velocity * slow_down  # + np.cos(potential_field_d) * potential_field_v
            agent.location[1] += np.sin(
                agent.direction) * agent.velocity * slow_down  # + np.sin(potential_field_d) * potential_field_v

        # Postion Vector is in Radians. To reverse the agent's direction, we add PI to its direction.
        # eprint(self.x_limit)
        if agent.location[0] >= self.x_limit:

            #agent.location[0] -= 2 * self.x_limit
            agent.direction += np.pi
            #agent.location[0]=self.x_limit -20

        elif agent.location[0] < self.x_limit * -1:
            #agent.location[0] += 2 * self.x_limit
            agent.direction += np.pi
        if agent.location[1] >= self.y_limit:
            #agent.location[1] -= 2 * self.y_limit
            agent.direction += np.pi
        elif agent.location[1] < self.y_limit * -1:
            #agent.location[1] += 2 * self.y_limit
            agent.direction += np.pi

    def pause(self, json):
        self.isPaused = True

    def play(self, json):
        self.isPaused = False

    def updateUIParameters(self, json):
        params = json['params']

        self.frames_per_sec = int(params['uiFps'])

        # echo the change out for any other connected clients
        print(self.UIParametersToJson())

    def restart_sim(self, json):
        eprint("\n\n\nRESTARTING\n\n\n")
        self.restart_simulation = True

    def getUiStates(self, data):
        #eprint("getting ui states")
        print(json.dumps({
            "type": "setStates",
            "data": list(self.agents.values())[0].getUiRepresentation()
        }))

    def getParams(self, data):
        print(self.parametersToJson())

    def processMessage(self, data):
        self.chat_history += data['message'] + '\n'
        #eprint(self.chat_history)
        print(json.dumps({
            "type" : "updateChat",
            "data" : self.chat_history
        }))

    @abstractmethod
    def isFinished(self):
        pass

    def finished(self):
        pass

    # Move all of the agents
    def moveSites(self):
        if args.model == "Drone":
            for site in self.sites:
                site.move()

    def pheromones(self):
        for pheromone in self.pheromoneList:
            # if pheromone["agent"]==agent.id:

            if not pheromone["pheromone"].fresh:
                pheromone["pheromone"].enlarge()
            else:
                pheromone["pheromone"].fresh = False;
        i=0
        for pheromone in self.pheromoneList:
            if(pheromone["pheromone"].strength<=0):
                del self.pheromoneList[i]
                self.pheromoneList.pop(i)
            i+=1

    def updateSiteInfo(self):
        # eprint(len(self.agentsFollowSite))
        # eprint("Here")

        for i in range(0,len(self.agentsFollowSite)-1):
            # eprint("Site " +str(i)+" Return Timer:"+str(self.agentsFollowSite[i]["returnTime"])+" Agents: " + str(self.agentsFollowSite[i]["number"]));
            # eprint("Site "+ str(i) +" has "+str(self.agentsFollowSite[i]["number"]) +" agents")

            if self.agentsFollowSite[i]["returnTime"]<=0:
                self.agentsFollowSite[i]["returnTime"]=1500
                self.agentsFollowSite[i]["reporting"]=False
            if self.agentsFollowSite[i]["reporting"]:
                self.agentsFollowSite[i]["returnTime"]-=1

    def processDeleted(self, deletePatrol):
        # eprint(deletePatrol["info"]["deleted"]["mode"])
        if deletePatrol["info"]["deleted"]["mode"] == 0:
            # eprint(self.patrolList)
            i=0;
            for patrol in self.patrolList:
                # eprint(deletePatrol["info"]["deleted"]["x"])
                if deletePatrol["info"]["deleted"]["x"] == patrol["x"] and -deletePatrol["info"]["deleted"]["y"] == patrol["y"]:
                    # eprint("DELETING FROM PATROL")
                    del self.patrolList[i]
                i+=1;
        if deletePatrol["info"]["deleted"]["mode"] == 1:
            # eprint(self.patrolList)
            i=0;
            for avoid in self.avoidList:
                # eprint(deletePatrol["info"]["deleted"]["x"])
                if deletePatrol["info"]["deleted"]["x"] == avoid["x"] and -deletePatrol["info"]["deleted"]["y"] == avoid["y"]:
                    # eprint("DELETING FROM AVOID")
                    del self.avoidList[i]
                i+=1;
            i=0;
            for repulsor in self.flowController.repulsors:
                if deletePatrol["info"]["deleted"]["x"] == repulsor.x and -deletePatrol["info"]["deleted"]["y"] == repulsor.y:
                    # eprint("DELETING FROM REPULSORS")
                    del self.flowController.repulsors[i]
                i+=1
            # eprint(self.flowController.repulsors)



    def processNew(self, newPatrol):
        # eprint(newPatrol["info"]["mode"])
        if newPatrol["info"]["mode"] == 0:
            check=False;
            for patrol in self.patrolList:
                if (patrol["x"] == newPatrol["info"]["x"] and
                patrol["y"] == -newPatrol["info"]["y"]):
                    check=True;
                    break


            if not check:
                # eprint()
                self.patrolList.append({"x":newPatrol["info"]["x"],
                                            "y":-newPatrol["info"]["y"],
                                            "mode":newPatrol["info"]["mode"]})
                # eprint((self.patrolList))
        elif newPatrol["info"]["mode"] == 1:
            check=False;
            for avoid in self.avoidList:
                if (avoid["x"] == newPatrol["info"]["x"] and
                avoid["y"] == -newPatrol["info"]["y"]):
                    check=True;
                    break
            # eprint("Adding new Avoid")

            if not check:
                # eprint()
                # eprint("Adding to Avoid")
                self.avoidList.append({"x":newPatrol["info"]["x"],
                                            "y":-newPatrol["info"]["y"],
                                            "mode":newPatrol["info"]["mode"]})
                self.flowController.newRepulsor({"x":newPatrol["info"]["x"],
                                        "y":-newPatrol["info"]["y"],
                                        "radius":20})
                # eprint((self.patrolList))
            # eprint(self.flowController.repulsors)

        # self.parseLocation(newPatrol,self.liveUpdatedPatrol)
        # eprint(self.liveUpdatedPatrol)

    def run(self):

        if (not args.no_viewer):
            self.inputEventManager.start()
            self.inputEventManager.subscribe('pause', self.pause)
            self.inputEventManager.subscribe('play', self.play)
            self.inputEventManager.subscribe('attractor', self.flowController.newAttractor)
            self.inputEventManager.subscribe('repulsor', self.flowController.newRepulsor)
            self.inputEventManager.subscribe('parameterUpdate', self.updateParameters)
            self.inputEventManager.subscribe('UIParameterUpdate', self.updateUIParameters)
            self.inputEventManager.subscribe('restart', self.restart_sim)
            self.inputEventManager.subscribe('radialControl', self.hubController.handleRadialControl)
            self.inputEventManager.subscribe('requestStates', self.getUiStates)
            self.inputEventManager.subscribe('denySite', self.denySite)
            self.inputEventManager.subscribe('patrolLocations', self.processNew)
            self.inputEventManager.subscribe('patrolLocationsCheck', self.processDeleted)

            # self.inputEventManager.subscribe('patrolLocations', self.patrolLocationsAdd)
            # eprint(self.patrolLocations)
            #self.inputEventManager.subscribe('requestParams', self.getParams)

            self.inputEventManager.subscribe('message', self.processMessage)

            # print(self.to_json())
            self.getParams(None)  # this is a shortcut for letting the client know what the initial parameters are.

        self.stats["ticks"] = 0
        self.stats["tickData"] = []
        self.stats["deadAgents"] = 0

        while True:

            self.moveSites()
            self.pheromones()
            self.updateSiteInfo()
            try:

                if args.tick_limit != None and self.stats["ticks"] >= args.tick_limit:
                    self.stats["didNotFinish"] = True
                    break
                self.stats["ticks"] = self.stats["ticks"] + 1

                if args.stats and self.stats["ticks"] % 100 == 0:
                    pass
                    #print(json.dumps(self.stats))
                    #TODO  save to stats.frameData[]

                if not self.isPaused:
                    if not args.no_viewer:
                        print(self.to_json())

                    self.stats["stateCounts"] = {}

                    keys = list(self.agents.keys())  # deleting a key mid-iteration (suggest_new_direction())
                    # makes python mad...
                    #AGENT RUN LOOP
                    for agent_id in keys:
                        # if self.agents[agent_id].state.name not in self.stats["stateCounts"]:
                        #     self.stats["stateCounts"][self.agents[agent_id].state.name] = 0
                        # self.stats["stateCounts"][self.agents[agent_id].state.name] += 1
                        # is this faster?
                        self.agents[agent_id].act()
                        self.agents[agent_id].sense(self)
                        self.agents[agent_id].update(self)
                        self.suggest_new_direction(agent_id)

                    # if self.agentsPatrolling <= 0 and len(self.patrolList) > 0:
                        # eprint("Clearing Patrol List")
                        # self.patrolList.clear()
                    # eprint(len(self.patrolList))
                    self.hubController.hiveAdjust(self.agents)
                    self.compute_measurements()

                    if not args.no_viewer:
                        print(json.dumps({
                            "type": "stateCounts",
                            "data": self.stats["stateCounts"]
                        }))


                    #if (args.commit_stop and "commit" in self.stats["stateCounts"] and self.stats["stateCounts"][
                    #    "commit"] + len(self.dead_agents) >= self.number_of_agents * .95):
                    if(self.isFinished()):
                        eprint("Simulation terminated")
                        self.finished()
                        #TODO Save simulation data to database
                        time.sleep(10)
                        break

                    self.flowController.updateFlowControllers()


                    #measurer.compute_measurements(self.agents.values())

                for event in self.inputEventManager.eventQueue:
                    if (self.logfile):
                        self.logfile.write(("%s\n" % json.dumps({"tick":self.stats["ticks"],"event":event})))
                    self.inputEventManager.callbackEvent(event)

                del self.inputEventManager.eventQueue[:]

                if self.restart_simulation:
                    self.reset_sim()
                    self.restart_simulation = False

                if not args.no_viewer:
                    time.sleep(1 / self.frames_per_sec)

            except KeyboardInterrupt:
                eprint("KeyboardInterrupt--Exiting")
                if (self.logfile):
                    self.logfile.close()
                sys.exit()


        self.stats["committedSites"] = []

        for id in self.agents:
            if self.agents[id].potential_site != None:
                self.stats["committedSites"].append(
                    {"x": self.agents[id].potential_site[0], "y": self.agents[id].potential_site[1]})

        self.stats["committedSites"] = list(
            dict(y) for y in set(tuple(x.items()) for x in self.stats["committedSites"]))



    def compute_measurements(self):
        pass

    def clear_for_reset(self):
        self.agents.clear()
        self.flowController.clear()
        #self.attractors.clear()
        #self.repulsors.clear()
        self.dead_agents.clear()

    #could use create agent function
    @abstractmethod
    def initialize_agents(self):
        pass

        #Below code is to add "tracking" UAV. not for use in bee simulator
        '''
        agent_id = str(x + y + 2)
        #eprint("Agent id: " + agent_id)
        agent = UAV(self, agent_id, UAV_Searching(None), self.hub, self.parameters,  count = int(self.parameters["ExploreTime"]))
        #eprint("special agent is class: " + agent.__class__.__name__)
        self.agents[agent_id] = agent
        #eprint("UAV added to self.agents")
        '''

    def reset_sim(self):
        self.clear_for_reset()
        np.random.seed(self.seed)
        self.initialize_agents()
        self.hubController.reset([self.hub["x"], self.hub["y"], self.hub["radius"]], self.agents, self,
                                 self.parameters["ExploreTime"])
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
            spread = 20  # What should this be?
            strength = .5  # Dictates the strength of the field
            self.potential_fields.append(
                PotentialField(location, obstacle["radius"], spread, strength, type='repulsor'))

    def potential_field_sum(self, location):
        dx = 0
        dy = 0

        for field in self.potential_fields:
            delta = field.effect(location)
            dx += delta[0]
            dy += delta[1]
        # return [0, 0]
        return [dx, dy]

    def change_state(self, agent_id, new_state):
        eprint(new_state)
        self.agents[agent_id].state = new_state

    @abstractmethod
    def to_json(self):
        pass

    def dead_agents_to_json(self):
        dead_agents = []
        for agent in self.dead_agents:
            dead_agents.append(agent.to_json())
        return dead_agents

    def agents_to_json(self):
        agents = []
        for agent_id in self.agents:
            agents.append(self.agents[agent_id].to_json())
        return agents

    def pheromones_to_json(self):
        pheromones = []

        for pheromone in self.pheromoneList:
            p=pheromone["pheromone"]
            Id=pheromone["agent"]

            pheromones.append({"id":Id,"x":p.x,"y":p.y,"r":p.r,"strength":p.strength,"site":pheromone["site"]})

        return pheromones

    def parametersToJson(self):
        paramDict = {}
        for paramKey, paramVal in self.parameters.items():
            paramDict[paramKey] = paramVal
        parameterJson = {
            "type": "updateDebugParams",
            "data":
                {
                    "parameters": paramDict
                }
        }
        return json.dumps(parameterJson)

    def denySite(self,json):
        self.sitesToIgnore.add(json["id"])


    def updateParameters(self, json):
        eprint("updateParameters")
        params = json['params']
        for paramKey, paramVal in self.parameters.items():
            self.parameters[paramKey] = float(params[paramKey])

        eprint("New params =", self.parameters)
        self.hubController.emitUpdateParams(self.parameters, time.time())
        # echo the change out for any other connected clients
        print(self.parametersToJson())

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

    def printStats(self):
        print(json.dumps(self.stats))
