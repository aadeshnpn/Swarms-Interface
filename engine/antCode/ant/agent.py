from enum import Enum

from .StateMachine import StateMachine
from .state import State
import numpy as np
from ..debug import *

input = Enum('input', 'startFollowing getLost1 getLost2 startSearching stopSearching discover join retire arrive stopRecruiting startRecruiting startAssess finAssess')

#safe_angle returns the angle needed to be added to a to get b
def safe_angle(a, b):
    angle = np.arctan2(b[1], b[0]) - np.arctan2(a[1], a[0])
    while angle > np.pi:
        angle -= 2 * np.pi
    while angle < -np.pi:
        angle += 2 * np.pi
    return angle

def distance(a,b):
	return np.sqrt((b[0]-a[0])**2 + (b[1]-a[1])**2)

class Agent(StateMachine):
        
    def __init__(self, environment, agentId, initialstate, hub, params, count=1000):
        self.id = agentId
        #self.state = initialstate
        self.location = [hub["x"],hub["y"]]
        self.direction = 2*np.pi*np.random.random()
        self.velocity = 2
        self.default_velocity = 2
        self.hub = [hub["x"],hub["y"]]
        self.potential_site = None
        self.q_value = 0
        self.hubRadius = hub["radius"]
        self.state = initialstate
        self.live = True
        self.assessment = 1
        self.inHub = True
        self.atSite = False
        self.atPheromone = False
        self.found_dead_agents = False
        self.p_value = 0
        self.siteIndex = None
        self.goingToSite = True
        self.carrying_capacity = 1
        self.attractor = None
        self.attracted = None
        self.repulsor = None
        self.ignore_repulsor = None
        self.parameters = params
        self.environment = environment
        exp = np.random.normal(1, .5, 1)
        while exp < 0:
            exp = np.random.normal(1, .5, 1)
        self.counter = int(count*exp)
        exp = np.random.normal(1, .05, 1)
        while exp < 0:
            exp = np.random.normal(1, .05, 1)
        self.exp =exp
        dict = {(Waiting(self).__class__, input.startSearching): [None, Searching(self)],
                (Waiting(self).__class__, input.join): [None, Exploiting(self)],
                (Waiting(self).__class__, input.startFollowing): [None, Following1(self)],
                (Following1(self).__class__, input.arrive): [None, Exploiting(self)],
                (Following1(self).__class__, input.getLost2): [None, Searching(self)],                
                #(Searching(self).__class__, input.discover): [None, Exploiting(self)],
                (Searching(self).__class__, input.stopSearching): [None, Waiting(self)],
                (Searching(self).__class__, input.startFollowing): [None, Following(self)],                
                (Exploiting(self).__class__, input.retire): [None, Waiting(self)],
                (Exploiting(self).__class__, input.startRecruiting): [None, Recruiting(self)],
                (Exploiting(self).__class__, input.getLost1): [None, Searching(self)],
                (Searching(self).__class__, input.discover): [None, SiteAssess(self)],
                (SiteAssess(self).__class__, input.finAssess): [None, Exploiting(self)],
                (Recruiting(self).__class__, input.stopRecruiting): [None, Exploiting(self)],
                (Following(self).__class__, input.arrive): [None, Exploiting(self)],
                (Following(self).__class__, input.getLost1): [None, Waiting(self)],
                (Following(self).__class__, input.getLost2): [None, Searching(self)],
                }   
        self.transitionTable = dict

    #def sense(self, environment):
    #    self.state.sense(self, environment)

    #def act(self):
    #    self.state.act(self)

    #def update(self, environment):
    #    self.nextState(self.state.update(self,environment), environment)
    
    def getUiRepresentation(self):
        return { #TODO: this should represent swarm states not individual states
            # these names should match the state.name property for each state
            "states": ["waiting", "searching", "following", "exploiting"],
            "transitions": {
                "searching": ["exploiting"],
                "following": ["exploiting"]
            }
        }

    def updateParams(self, params,timeStamp):
        self.parameters = params
        self.velocity = self.parameters["Velocity"]
        self.param_time_stamp = timeStamp
    
    def sense(self, environment):
        self.state.sense(self, environment)

    def act(self):
        self.state.act(self)

    def update(self,environment):
        self.nextState(self.state.update(self,environment))

    def move(self, destination):
        dx = destination[0] - self.location[0]
        dy = destination[1] - self.location[1]
        self.direction = np.arctan2(dy, dx)

    def wander(self, place, radius):
        if ((place[0] - self.location[0]) ** 2 + (place[1] - self.location[1]) ** 2)**.5 >= radius:
            dx = place[0] - self.location[0]
            dy = place[1] - self.location[1]
            self.direction = np.arctan2(dy, dx)
        else:
            delta_d = np.random.normal(0, .3)
            self.direction = (self.direction + delta_d) % (2 * np.pi)

    def checkAgentLeave(self):
        if (((self.hub[0] - self.location[0]) ** 2 + (self.hub[1] - self.location[1]) ** 2) ** .5 > self.hubRadius) \
                        and self.inHub is True:
                if self.environment.hubController.beeCheckOut(self) == 0:
                    self.inHub = False
                    return True
        return False

    def checkAgentReturn(self):
        if (((self.hub[0] - self.location[0]) ** 2 + (self.hub[1] - self.location[1])** 2)** .5 < self.hubRadius):
            if not self.inHub: #if probs check if not agent.goingToSite
                self.environment.hubController.beeCheckIn(self)
                self.inHub = True
                return True
        return False

class Exploiting(State):  # like site assess
    def __init__(self, agent=None, time=None):
        self.name = 'exploiting'
        self.atsite = False
        self.stopSite = False

    def sense(self, agent, environment):
        if (((agent.hub[0] - agent.location[0]) ** 2 + (
            agent.hub[1] - agent.location[1]) ** 2) ** .5 > agent.hubRadius):
            if agent.goingToSite and agent.inHub:
                if environment.hubController.beeCheckOut(agent) == 0:
                    agent.inHub = False
                    # self.atsite = False
                    return
        if (((agent.hub[0] - agent.location[0]) ** 2 + (
            agent.hub[1] - agent.location[1]) ** 2) ** .5 < agent.hubRadius - 3.251858563765788):
            if not agent.goingToSite and not agent.inHub:
                environment.hubController.beeCheckIn(agent)
                agent.inHub = True
                if agent.siteIndex is not None and agent.siteIndex >= 0:
                    if environment.sites[agent.siteIndex]['radius'] > .25:
                        # environment.sites[agent.siteIndex]['food_unit'] -= 1
                        environment.sites[agent.siteIndex]['radius'] -= 0.25
                        # environment.sites[agent.siteIndex]['q_value']/30.0
                    else:
                        self.stopSite = True
                        ##TODO TODO fix the radius so that it never goes negative, in addition add checking in the other states to never go to negative sites..
                        ##TODO!!!!! Followers need to still exploit as they are not doing that right now.

        new_q = environment.get_q(agent)["q"]
        if round(new_q) == round(agent.q_value):
            self.atsite = True

    def update(self, agent, environment):
        if self.stopSite is True:
            agent.potential_site = None
            agent.q_value = 0
            return input.retire
        if (((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 < (
            agent.hubRadius * (2 / 3))) and (agent.goingToSite is False):
            environment.food_deposite += 1
            agent.goingToSite = True
            return input.startRecruiting
        elif ((agent.potential_site[0] - agent.location[0]) ** 2 + (
            agent.potential_site[1] - agent.location[1]) ** 2) < 1 and (agent.goingToSite is True):
            agent.goingToSite = False
        #if agent.goingToSite is True and agent.inHub is False:
        if agent.goingToSite is True and agent.inHub is False:
            # x = int(int(agent.location[0] + environment.x_limit)/3)
            x, y = environment.worldToPher(agent.location[0], agent.location[1])
            #range = 1
            #eprint ("Deployting pheromones",agent.id)
            #environment.pheromoneList[x - range:x + range + 1, y - range:y + range + 1] += 6 * np.sqrt(agent.q_value)
            environment.pheromoneList[x, y] += agent.parameters["PheromoneStrength"] * np.sqrt(agent.q_value)
            ##Need diffusion logic as well
            ##Difussed to neared 3 cells
            environment.pheromoneList[x-3:x+3,y-3:y+3] += 2 * np.sqrt(agent.q_value)
            if np.random.random() < .2:
                environment.pheromoneView[x, y] += agent.parameters["PheromoneStrength"] * np.sqrt(agent.q_value)
                #environment.pheromoneView[x-3:x+3,y-3:y+3] += 2 * np.sqrt(agent.q_value)                
                # environment.pheromoneList[x, y] += 3

    def act(self, agent):
        # if self.atsite:
        #    pass
        ##For every state reset velocity to default
        agent.velocity = agent.default_velocity
        if agent.goingToSite:
            dx = agent.potential_site[0] - agent.location[0]
            dy = agent.potential_site[1] - agent.location[1]
            agent.direction = np.arctan2(dy, dx)
        else:
            dx = agent.hub[0] - agent.location[0]
            dy = agent.hub[1] - agent.location[1]
            agent.direction = np.arctan2(dy, dx)

class Following(State):
    def __init__(self,agent=None,time=None):
        self.name = 'following'
        self.next = [0,0]
        self.following_lost_time = agent.parameters["FollowingTime"]
        #self.next = [np.random.choice([-1,1])]

    def sense(self,agent,environment):
        #x,y = environment.worldToPher(agent.location[0],agent.location[1])
        #environment.pheromoneList[x, y] -=  np.sqrt(agent.q_value)                
        agent.p_value = environment.get_pheromone(agent)
        lowX, lowY = environment.smellNearby(agent.location)
        if lowX < 0 or lowY < 0:
            #self.next = [agent.location[0]+np.random.choice([-1,1]), agent.location[1]+np.random.choice([-1,1])]
            agent.atPheromone = False
        else:
            x,y=environment.pherToWorld(lowX, lowY)
            self.next = [x, y]
            #agent.location = self.next

    def update(self,agent,environment):
        #agent.location = self.next
                
        if not agent.atPheromone and self.following_lost_time > 0:
            self.following_lost_time -= 1
        elif not agent.atPheromone and self.following_lost_time <= 0:
            return input.getLost2
        elif environment.get_q(agent)["q"] > 0:
            agent.potential_site = [agent.location[0], agent.location[1]]
            #eprint(agent.potential_site, "following")
            return input.arrive
        """else:
            x, y = environment.worldToPher(agent.location[0], agent.location[1])
            #range = 1
            #environment.pheromoneList[x - range:x + range + 1, y - range:y + range + 1] += 6 * np.sqrt(agent.q_value)
            environment.pheromoneList[x, y] += 6 * np.sqrt(agent.q_value)
            ##Need diffusion logic as well
            ##Difussed to neared 3 cells
            #environment.pheromoneList[x-3:x+3,y-3:y+3] += 2 * np.sqrt(agent.q_value)
            if np.random.random() < .2:
                environment.pheromoneView[x, y] += 6 * np.sqrt(agent.q_value)            
        """

    def act(self,agent):
        agent.velocity = 1.5 #agent.default_velocity        
        dx = self.next[0] - agent.location[0]
        dy = self.next[1] - agent.location[1]
        #agent.direction = np.arctan2(dy, dx)
        calc_direction = np.arctan2(dy, dx)
        hub_dx = agent.hub[0] - agent.location[0]
        hub_dy = agent.hub[1] - agent.location[1]        
        ##Reversing the angle towards hub to get angel towards site
        hub_direction = np.pi + np.arctan2(hub_dy,hub_dx)
        #eprint (calc_direction,hub_direction)
        if calc_direction - hub_direction > np.pi/2:
            agent.direction = hub_direction
        else:
            agent.direction = calc_direction
        #agent.direction = calc_direction
        return

class Following1(State):
    def __init__(self,agent=None,time=None):
        self.name = 'following1'
        #self.following = None
        self.following_lost_time = agent.parameters["FollowingTime"]
        self.following1_confusion_time = 3000
        #self.next = [np.random.choice([-1,1])]

    def sense(self,agent,environment):
        new_q = environment.get_q(agent)["q"]  
        agent.q_value = new_q      
        #pass

    def update(self,agent,environment):
        self.following1_confusion_time -= 1
        if agent.q_value > 0 :
            agent.potential_site = [agent.location[0], agent.location[1]]
            #eprint(agent.potential_site, "searching")
            return input.arrive        
        #elif int(agent.potential_site[0]) == int(agent.location[0]) and int(agent.potential_site[1]) == int(agent.location[1]):
        #    return input.arrive
        elif self.following1_confusion_time <= 0:
            return input.getLost2
        else:
            pass

    def act(self,agent):
        dx = agent.potential_site[0] - agent.location[0]
        dy = agent.potential_site[1] - agent.location[1]
        ##The problem with following1 is that the site decrease and it can no longer 
        # find q value as pointed out by the agent it was following.
        #if np.abs(dx) <= 5 or np.abs(dy) <= 5:
        if np.sqrt(dx**2 + dy**2) < 5:
            #eprint (dx,dy)
            agent.direction = np.random.choice(np.arange(0,2*np.pi))
            agent.velocity = 0.4 
            self.following1_confusion_time -= 100           
        else: 
            agent.direction = np.arctan2(dy, dx)
            agent.velocity = 1.5
        return        

class Searching(State): #basically the same as explorer..
    def __init__(self,agent=None,time=None):
        self.name = 'searching'
        self.next = (0,0)
        exp = np.random.normal(1, .3, 1)
        while exp < 0:
            exp = np.random.normal(1, .3, 1)
        if agent is not None:
            self.searchingtime = exp*agent.parameters["SearchTime"]
        else:
            self.searchingtime = exp*3000


    def sense(self,agent,environment):
        if (((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 > agent.hubRadius) \
                and agent.inHub is True:
                if environment.hubController.beeCheckOut(agent) == 0:
                    agent.inHub = False
                    return

        new_q = environment.get_q(agent)["q"]
        agent.q_value = new_q
        agent.p_value = environment.get_pheromone(agent)
        x,y = environment.smell_dead_agents(agent.location)
        if x < 0 or y < 0 :
            agent.found_dead_agents = False
        else:
            agent.found_dead_agents = True
            self.next = x,y
        agent.attractor = environment.getAttractor(agent.location)
        if(agent.attractor is not None and agent.attracted is None):
            if(np.random.random () > .2):
                agent.attracted = True
            else:
                agent.attracted = False


        agent.repulsor = environment.getRepulsor(agent.location)
        if(agent.repulsor is not None and agent.ignore_repulsor is None):
            if(np.random.random() >.9):
                 agent.ignore_repulsor = True
            else:
                 agent.ignore_repulsor = False

    def update(self,agent,environment):
        self.searchingtime -= 1
        if agent.q_value > 0 :
            agent.potential_site = [agent.location[0], agent.location[1]]
            #eprint(agent.potential_site, "searching")
            return input.discover
        elif agent.p_value > 0 :
            return input.startFollowing
        elif self.searchingtime < 1 :
            return input.stopSearching
        else:
            x, y = environment.worldToPher(agent.location[0], agent.location[1])
            environment.exploring_pheromoneList[x, y] += 6 * np.sqrt(5)            
            environment.exploring_pheromoneList[x-5:x+5,y-5:y+5] += 2 * np.sqrt(5)

    def act(self,agent):
        agent.velocity = agent.default_velocity        
        if(agent.attractor is not None and distance(agent.attractor, agent.location) < 40 and agent.attracted is True):
            angle = safe_angle((np.cos(agent.direction),np.sin(agent.direction)), (agent.attractor[0]-agent.location[0],agent.attractor[1]-agent.location[1]))
            angle = np.clip(angle, -np.pi/16, np.pi/16)
            error = np.random.normal(0, .3)
            agent.direction += angle + error
            agent.direction = agent.direction % (2 *np.pi)

        elif(agent.repulsor is not None and distance(agent.repulsor, agent.location) < 40 and agent.ignore_repulsor is False):
             angle = - safe_angle((np.cos(agent.direction),np.sin(agent.direction)), (agent.repulsor[0]-agent.location[0],agent.repulsor[1]-agent.location[1]))
             angle = np.clip(angle, -np.pi/16, np.pi/16)
             if(angle >= 0):
                      agent.direction += .3
             else:
                      agent.direction -= .3

             agent.direction %= 2 * np.pi
        elif agent.found_dead_agents:
            dx = self.next[0] - agent.location[0]
            dy = self.next[1] - agent.location[1]
            agent.direction = np.arctan2(dy, dx)            
        else:
            delta_d = np.random.normal(0, .1)
            agent.direction = (agent.direction + delta_d) % (2 * np.pi)

        return

class SiteAssess(State):
    def __init__(self, agent=None):
        self.name = "site assess"

        self.counter = 150
        self.siteRadius = agent.parameters["SiteAssessRadius"]


    def sense(self, agent, environment):
        ## Code to help the bees find the center of the site
        siteInfo = environment.get_q(agent)
        if siteInfo["q"] > agent.q_value:
            agent.potential_site = [agent.location[0], agent.location[1]]
            agent.q_value = siteInfo["q"]

    def act(self, agent):
        agent.velocity = 1 #agent.default_velocity        
        self.move(agent)

    def update(self, agent, environment):
        if self.counter < 1:
            agent.atSite = False
            agent.goingToSite = False
            #eprint(agent.potential_site, "siteAssess")
            return input.finAssess
        else:
            self.counter -= 1

    def move(self, agent):
        if ((agent.potential_site[0] - agent.location[0]) ** 2
                + (agent.potential_site[1] - agent.location[1]) ** 2) ** .5 >= self.siteRadius:
            dx = agent.potential_site[0] - agent.location[0]
            dy = agent.potential_site[1] - agent.location[1]
            agent.direction = np.arctan2(dy, dx)
        else:
            delta_d = np.random.normal(0, .3)
            agent.direction = (agent.direction + delta_d) % (2 * np.pi)
        return


class Waiting(State):  # like observing
    def __init__(self, agent=None, time=None):
        self.name = 'waiting'
        exp = np.random.normal(1, .1, 1)
        self.atHub = True
        self.seesRecuriter = False
        self.pheromone = 0
        while exp < 0:
            exp = np.random.normal(1, .1, 1)
        if agent is not None:
            self.waitingtime = exp * agent.parameters["WaitingTime"]
        else:
            self.waitingtime = exp * 1000

    def sense(self, agent, environment):
        if self.atHub:
            ant = environment.hubController.observersCheck()
            if ant is not None and isinstance(ant.state, Recruiting().__class__):
                if environment.recuriting_agents_at_hub/len(environment.hubController.agentsInHub) > 2*np.random.random():
                    self.seesRecuriter = True
                    agent.potential_site = ant.potential_site
            #environment.hubController.newPiper()            
            #self.pheromone = environment.get_pheromone(agent)
            #environment.

        if (((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 < agent.hubRadius) \
                and agent.inHub is False:
            environment.hubController.beeCheckIn(agent)
            agent.inHub = True
            return

    def update(self, agent, environment):
        #if self.pheromone > 0:
        if self.seesRecuriter:
            return input.startFollowing

        if self.waitingtime < 1:
            if environment.max_hub_capacity > environment.food_deposite:
                return input.startSearching


    def act(self, agent):
        agent.velocity = 1#agent.default_velocity        
        if self.atHub:
            self.waitingtime -= 1
            self.wander(agent)
        else:  # if not at hub, more towards it
            self.movehome(agent)
            '''if ((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 <= 1.1:
                # 1.1 prevents moving back and forth around origin
                self.atHub = True
                agent.direction += -89 + 179 * np.random.random()'''

    def movehome(self, agent):
        dx = agent.hub[0] - agent.location[0]
        dy = agent.hub[1] - agent.location[1]
        agent.direction = np.arctan2(dy, dx)

    def wander(self, agent):
        if ((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 >= agent.hubRadius:
            dx = agent.hub[0] - agent.location[0]
            dy = agent.hub[1] - agent.location[1]
            agent.direction = np.arctan2(dy, dx)
        else:
            delta_d = np.random.normal(0, .3)
            agent.direction = (agent.direction + delta_d) % (2 * np.pi)

        return


class Recruiting(State): #like dancing
    def __init__(self,agent=None,time=None):
        self.name = 'recruiting'
        if agent:
            self.recruitmentTime = agent.parameters["RecuritingTime"]
        else:
            self.recruitmentTime = 60

    def sense(self,agent,environment):
        pass
    
    def update(self,agent,environment):
        #pass
        self.recruitmentTime -= 1        
        if self.recruitmentTime <= 1 :
            #agent.q_value = 0
            agent.goingToSite = True
            return input.stopRecruiting


    def act(self,agent):
        agent.velocity = agent.default_velocity        
        if ((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2)**.5 >= agent.hubRadius:
            dx = agent.hub[0] - agent.location[0]
            dy = agent.hub[1] - agent.location[1]
            agent.direction = np.arctan2(dy, dx)
        else:
            delta_d = np.random.normal(0, .3)
            agent.direction = (agent.direction + delta_d) % (2 * np.pi)
        return