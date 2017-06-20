from enum import Enum

from .StateMachine import StateMachine
from .state import State
import numpy as np
from ..debug import *
from .pheromone import Pheromone

input = Enum('input', 'startFollowing getLost1 getLost2 startSearching stopSearching discover join retire arrive stopRecruiting startRecruiting startAssess finAssess')

class Agent(StateMachine):
    def __init__(self,id,hub,initial_state):
        self.id = id
        #self.state = initialstate
        self.location = [hub["x"],hub["y"]]
        self.direction = 2*np.pi*np.random.random()
        self.velocity = 2
        self.hub = [hub["x"],hub["y"]]
        self.potential_site = None
        self.q_value = 0
        self.hubRadius = hub["radius"]
        self.state = initial_state
        self.live = True
        self.assessment = 1
        self.inHub = True
        self.atSite = False
        self.atPheromone = 0
        self.siteIndex = None
        self.goingToSite = True
        self.carrying_capacity = 1
        self.attractor = None
        self.attracted = None
        self.repulsor = None
        self.ignore_repulsor = None
        self.parameters =  {"WaitingTime": 1000,
                            "SearchTime": 2000}  

        dict = {(Waiting(self).__class__, input.startSearching): [None, Searching(self)],
                (Waiting(self).__class__, input.join): [None, Exploiting(self)],
                (Waiting(self).__class__, input.startFollowing): [None, Following(self)],
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

    def sense(self, environment):
        self.state.sense(self, environment)

    def act(self):
        self.state.act(self)

    def update(self, environment):
        self.nextState(self.state.update(self,environment), environment)
    
    def getUiRepresentation(self):
        return { #TODO: this should represent swarm states not individual states
            # these names should match the state.name property for each state
            "states": ["waiting", "searching", "following", "exploiting"],
            "transitions": {
                "searching": ["exploiting"],
                "following": ["exploiting"]
            }
        }


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
            agent.hub[1] - agent.location[1]) ** 2) ** .5 < agent.hubRadius + .251858563765788):
            if not agent.goingToSite and not agent.inHub:
                environment.hubController.beeCheckIn(agent)
                agent.inHub = True
                if agent.siteIndex is not None and agent.siteIndex >= 0:
                    if environment.sites[agent.siteIndex]['radius'] > .15:
                        # environment.sites[agent.siteIndex]['food_unit'] -= 1
                        environment.sites[agent.siteIndex]['radius'] -= 0.5
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
            agent.goingToSite = True
            return input.startRecruiting
        elif ((agent.potential_site[0] - agent.location[0]) ** 2 + (
            agent.potential_site[1] - agent.location[1]) ** 2) < 1 and (agent.goingToSite is True):
            agent.goingToSite = False
        if agent.goingToSite is False:
            # x = int(int(agent.location[0] + environment.x_limit)/3)
            x, y = environment.worldToPher(agent.location[0], agent.location[1])
            range = 1
            #environment.pheromoneList[x - range:x + range + 1, y - range:y + range + 1] += 6 * np.sqrt(agent.q_value)
            environment.pheromoneList[x, y] += 6 * np.sqrt(agent.q_value)
            if np.random.random() < .2:
                environment.pheromoneView[x, y] += 6 * np.sqrt(agent.q_value)
                # environment.pheromoneList[x, y] += 3

    def act(self, agent):
        # if self.atsite:
        #    pass
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

    def sense(self,agent,environment):
        agent.atPheromone = environment.get_pheromone(agent)
        lowX, lowY = environment.smellNearby(agent.location)
        if lowX < 0 or lowY < 0:
            agent.atPheromone = 0
        else:
            x,y=environment.pherToWorld(lowX, lowY)
            self.next = [x, y]
            agent.location = self.next

    def update(self,agent,environment):
        if not agent.atPheromone:
            return input.getLost2
        elif environment.get_q(agent)["q"] > 0:
            agent.potential_site = [agent.location[0], agent.location[1]]
            #eprint(agent.potential_site, "following")
            return input.arrive

    def act(self,agent):
        dx = self.next[0] - agent.location[0]
        dy = self.next[1] - agent.location[1]
        agent.direction = np.arctan2(dy, dx)
        return

class Searching(State): #basically the same as explorer..
    def __init__(self,agent=None,time=None):
        self.name = 'searching'
        exp = np.random.normal(1, .3, 1)
        while exp < 0:
            exp = np.random.normal(1, .3, 1)
        if agent is not None:
            self.searchingtime = exp*agent.parameters["WaitingTime"]
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
        agent.atPheromone = environment.get_pheromone(agent)
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
        elif agent.atPheromone > 0 :
            return input.startFollowing
        elif self.searchingtime < 1 :
            return input.stopSearching


    def act(self,agent):
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
        else:
            delta_d = np.random.normal(0, .1)
            agent.direction = (agent.direction + delta_d) % (2 * np.pi)

        return

class SiteAssess(State):
    def __init__(self, agent=None):
        self.name = "site assess"

        self.counter = 150
        self.siteRadius = 15


    def sense(self, agent, environment):
        ## Code to help the bees find the center of the site
        siteInfo = environment.get_q(agent)
        if siteInfo["q"] > agent.q_value:
            agent.potential_site = [agent.location[0], agent.location[1]]
            agent.q_value = siteInfo["q"]

    def act(self, agent):
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
            self.pheromone = environment.get_pheromone(agent)

        if (((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 < agent.hubRadius) \
                and agent.inHub is False:
            environment.hubController.beeCheckIn(agent)
            agent.inHub = True
            return

    def update(self, agent, environment):
        if self.pheromone > 0:
            return input.startFollowing
        if self.waitingtime < 1:
            return input.startSearching

            # pass

    def act(self, agent):
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
        self.recruitmentTime = 6

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
        if ((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2)**.5 >= agent.hubRadius:
            dx = agent.hub[0] - agent.location[0]
            dy = agent.hub[1] - agent.location[1]
            agent.direction = np.arctan2(dy, dx)
        else:
            delta_d = np.random.normal(0, .3)
            agent.direction = (agent.direction + delta_d) % (2 * np.pi)
        return