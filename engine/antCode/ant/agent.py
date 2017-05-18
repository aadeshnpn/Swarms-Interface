from enum import Enum

from .StateMachine import StateMachine
from .state import State
import numpy as np
from ..debug import *
from .pheromone import Pheromone

input = Enum('input', 'startFollowing getLost1 getLost2 startSearching stopSearching discover join retire arrive stopRecruiting startRecruiting')

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
        self.quadrant = []
        self.carrying_food = False
        self.carrying_capacity = 1
        self.attractor = None
        self.attracted = None
        self.repulsor = None
        self.ignore_repulsor = None
        #self.currPheromone=0
        #This holds the identity of following ants
        self.following = None
        #self.pheromoneList = []
        # These parameters may be modified at run-time
        self.parameters =  {"WaitingTime": 1000,
                            "SearchTime": 2000}  

        dict = {(Waiting(self).__class__, input.startSearching): [None, Searching(self)],
                (Waiting(self).__class__, input.join): [None, Exploiting(self)],
                (Waiting(self).__class__, input.startFollowing): [None, Following(self)],
                (Searching(self).__class__, input.discover): [None, Exploiting(self)],
                (Searching(self).__class__, input.stopSearching): [None, Waiting(self)],
                (Searching(self).__class__, input.startFollowing): [None, Following(self)],                
                (Exploiting(self).__class__, input.retire): [None, Waiting(self)],
                (Exploiting(self).__class__, input.startRecruiting): [None, Recruiting(self,3000)],
                (Exploiting(self).__class__, input.getLost1): [None, Searching(self)],
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
            "states": ["waiting", "searching", "recruiting","following", "exploiting"],
            "transitions": {
                "searching": ["exploiting"],
                "following": ["exploiting"]
                #"commit": []
            }
        }

class Waiting(State): #like observing
    def __init__(self,agent=None,time=None):
        self.name = 'waiting'
        exp = np.random.normal(1, .3, 1)
        self.atHub = True
        self.seesRecuriter = False
        while exp < 0:
            exp = np.random.normal(1, .3, 1)
        if agent is not None:
            self.waitingtime = exp*agent.parameters["WaitingTime"]
        else:
            self.waitingtime = exp*1000

    def sense(self,agent,environment):
        if self.atHub:
            ant = environment.hubController.waitingCheck()
            if isinstance(ant.state, Recruiting().__class__):
                if np.random.random()<(ant.q_value*ant.q_value*.02):
                    self.seesRecuriter = True
                    agent.potential_site = ant.potential_site

        if (((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 < agent.hubRadius) \
                and agent.inHub is False:
                    environment.hubController.beeCheckIn(agent)
                    agent.inHub = True
                    return
                   

    def update(self,agent,environment):
        self.waitingtime -= 1
        #Read that the change follows poission distribution. First implementing simple model. Later need to switch to poission
        #If rate of ants contacts many exploiting ants (log(n)) successively then start following them
        #if round(np.log(environment.number_of_agents))

        #TODO the hubcontroller keeps track of who is in the hub (cheaper computationally)
        # shouldn't we be counting the recruiters and not the exploiters?? oh we are... it's just named differently..
        #if self.seesRecuriter is True:
        #    return input.startFollowing
        if self.waitingtime < 1:
            #if np.random.uniform(0, 1) < 0.1:  # 10% chance a bee goes back to rest after observing
            #    return input.startSearching
            return input.startSearching
        """
        recruiters_at_hub,total_at_hub,recruiters_dict = environment.agents_at_hub('recruiting')
        #print (exploiters_at_hub,total_at_hub)
        #Condition for transition from waiting to following
        if recruiters_at_hub > round(np.log(environment.number_of_agents)) and recruiters_at_hub/(total_at_hub+1) > np.random.random() and agent.inHub:
            #self.
            #print (recruiters_dict)
            #exit(0)
            major_list=[]
            for site in recruiters_dict:
                if len (recruiters_dict[site]) > len (major_list):
                    major_list = recruiters_dict[site]
            #follows the one with the most amount of dancers for that site...
            #self.following = environment.agents[np.random.choice(major_list)]
            self.following = np.random.choice(major_list)
            #print ('self following value',self.following)
            if self.following.recruitmentTime <=1:
                environment.following[agent.id] = self.following
                return input.startFollowing
        elif self.waitingtime < 1:
            return input.startSearching
        """
        #pass
    def act(self,agent):
        if self.atHub:
            self.waitingtime -= 1
            #if self.waitingtime == 0:
            #    agent.velocity = agent.parameters["Velocity"]
            self.wander(agent)
        else:
            # if not at hub, more towards it
            self.movehome(agent)
            if ((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 <= 1.1:
                # 1.1 prevents moving back and forth around origin
                self.atHub = True
                #agent.inHub = True
                agent.direction += -89 + 179 * np.random.random()
                #agent.velocity = agent.parameters["Velocity"]        
        """                
        if agent.inHub:
            if ((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 >= agent.hubRadius:
                dx = agent.hub[0] - agent.location[0]
                dy = agent.hub[1] - agent.location[1]
                agent.direction = np.arctan2(dy, dx)
            else:
                delta_d = np.random.normal(0, .3)
                agent.direction = (agent.direction + delta_d) % (2 * np.pi)
        else:
            dx = agent.hub[0] - agent.location[0]
            dy = agent.hub[1] - agent.location[1]
            agent.direction = np.arctan2(dy, dx)
            return
        #agent.direction = np.arctan2(agent.location[0]+np.random.random(),agent.location[1]+np.random.random())
        #agent.location = [np.random.randint(1,10),np.random.randint(1,10)]
        #pass
        """
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
            return input.discover
        elif agent.atPheromone > 0 :
            eprint("smells!: ",agent.location[0],", ",agent.location[1])
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

        #elif self.inputExplore: #this is for when the user has requested more bees
        #    delta_d = np.random.normal(0, .013) # this will assure that the bee moves less erratically, it can be decreased a little as well
        #    agent.direction = (agent.direction + delta_d) % (2 * np.pi)
        else:
            delta_d = np.random.normal(0, .1)
            agent.direction = (agent.direction + delta_d) % (2 * np.pi)

        return        
        #agent.direction = np.arctan2(agent.location[0]+np.random.random(),agent.location[1]+np.random.random())
        #agent.location = [agent.location[0]+np.random.randint(1,10),agent.location[1]+np.random.randint(1,10)]        
  

class Following(State):
    def __init__(self,agent=None,time=None):
        self.name = 'following'        
        self.following = None
        #self.currPheromone

    def sense(self,agent,environment):
        agent.atPheromone = environment.get_pheromone(agent)
        #agent.

    def update(self,agent,environment):
        if not agent.atPheromone:
            return input.getLost2
        #else:
        #    self.following = True

    def act(self,agent):
        #if agent.goingToSite:
        #    dx = agent.potential_site[0] - agent.location[0]
        #    dy = agent.potential_site[1] - agent.location[1]
        #    agent.direction = np.arctan2(dy, dx)
        #else:
        #if agent
        dx = agent.hub[0] - agent.location[0]
        dy = agent.hub[1] - agent.location[1]
        agent.direction = np.arctan2(dy, dx)
        return        
        #agent.direction = np.arctan2(agent.location[0]+np.random.random(),agent.location[1]+np.random.random())
        #agent.location = [np.random.randint(1,10),np.random.randint(1,10)]

class Following1(State): #similar to assessor.
    def __init__(self,agent=None,time=None):
        self.name = 'following'        
        self.following = None

    def sense(self,agent,environment):
        if (((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 > agent.hubRadius) \
                and agent.inHub is True:
                if environment.hubController.beeCheckOut(agent) == 0:
                    agent.inHub = False
                    return

        if (((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 < agent.hubRadius) \
                and agent.inHub is False:
                    environment.hubController.beeCheckIn(agent)
                    agent.inHub = True
                    return
            #TODO they are starting following while the agents are still in the hub, maybe they shouldn't follow them.
            # The problem is they leave the hub and then show a hub checkout.
        """
        new_q = environment.get_q(agent)["q"]
        agent.q_value = new_q

        agent.attractor = environment.getAttractor(agent.location)
        if(agent.attractor is not None and agent.attracted is None):
            if(np.random.random () > .2):
                agent.attracted = True
            else:
                agent.attracted = False

        agent.repulsor = environment.getRepulsor(agent.location)
        if(agent.repulsor is not None and agent.ignore_repulsor is None):
            if(np.random.random() >.5):
                 agent.ignore_repulsor = True
            else:
                 agent.ignore_repulsor = False 
        #self.following=environment.agents[environment.following[agent.id]]
        #print ('Update',environment.following[agent.id])
        """        

    def update(self,agent,environment):
        if (((agent.hub[0] - agent.location[0]) ** 2 + (
                agent.hub[1] - agent.location[1]) ** 2) ** .5 < agent.hubRadius) and (agent.goingToSite is False):
            agent.goingToSite = True
            return input.arrive
        elif ((agent.potential_site[0] - agent.location[0]) ** 2 + (
                agent.potential_site[1] - agent.location[1]) ** 2) < 1 and (agent.goingToSite is True):
            agent.goingToSite = False
            #if(np.random.uniform(0,1) < 1 - agent.q_value): # (1-q)% chance of going to observer state instead of dancing
            #    return input.quit
            #return input.startRecruiting
            return      
        """
        if self.following:
            if agent.q_value > 0 #or self.following.q_value > 0:
                agent.potential_site = [agent.location[0], agent.location[1]]
                return input.arrive
        """

    def act(self,agent):
        if agent.goingToSite:
            dx = agent.potential_site[0] - agent.location[0]
            dy = agent.potential_site[1] - agent.location[1]
            agent.direction = np.arctan2(dy, dx)
        else:
            dx = agent.hub[0] - agent.location[0]
            dy = agent.hub[1] - agent.location[1]
            agent.direction = np.arctan2(dy, dx)
        return        
        #agent.direction = np.arctan2(agent.location[0]+np.random.random(),agent.location[1]+np.random.random())
        #agent.location = [np.random.randint(1,10),np.random.randint(1,10)]
        """
        if self.following and agent.inHub is False:
            #print ('from flowing',self.following)
            agent.direction = self.following.direction
            agent.location[0] = self.following.location[0] - 0.2
            agent.location[1] = self.following.location[1] - 0.2
            #TODO better way to follow, this is preventing them from reaching the site.
        """

class Exploiting(State): #like site assess
    def __init__(self,agent=None,time=None):
        self.name = 'exploiting'        
        self.atsite = False
        self.stopSite = False

    def sense(self,agent,environment):
        if (((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 > agent.hubRadius):
            if agent.goingToSite and agent.inHub:
                if environment.hubController.beeCheckOut(agent)==0:
                    agent.inHub = False
                    #self.atsite = False
                    return
        if (((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 < agent.hubRadius+.251858563765788):
            if not agent.goingToSite and not agent.inHub:
                environment.hubController.beeCheckIn(agent)
                agent.inHub = True
                if agent.siteIndex:
                    if environment.sites[agent.siteIndex]['radius']>.02:
                        #environment.sites[agent.siteIndex]['food_unit'] -= 1
                        environment.sites[agent.siteIndex]['radius'] -= 0.02
                        environment.sites[agent.siteIndex]['q_value']/30.0
                    else:
                        self.stopSite = True
                ##TODO TODO fix the radius so that it never goes negative, in addition add checking in the other states to never go to negative sites..
                ##TODO!!!!! Followers need to still exploit as they are not doing that right now.

        new_q = environment.get_q(agent)["q"]
        if round(new_q) == round(agent.q_value):
            self.atsite = True
                #self.atsite = False
        #if (((agent.potential_site[0] - agent.location[0]) ** 2 + (agent.potential_site[1] - agent.location[1]) ** 2) ** .5 < 1):
        #    self.atsite = True
                    
    def update(self,agent,environment):
        #if agent.inHub and :
        #    return input.startRecruiting

        '''if agent.pheromoneList:
            for pheromone in agent.pheromoneList:
                if pheromone.scope <=0:
                    agent.pheromoneList.remove(pheromone)
                else:
                    pheromone.reduce_scope()'''


        if self.stopSite is True:
            return input.retire
        if (((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 < agent.hubRadius) and (agent.goingToSite is False):
            agent.goingToSite = True
            return input.startRecruiting
        elif ((agent.potential_site[0] - agent.location[0]) ** 2 + (agent.potential_site[1] - agent.location[1]) ** 2) < 1 and (agent.goingToSite is True):
            agent.goingToSite = False
        if agent.goingToSite is not True and np.random.random() < .7:
            eprint("dropped pheromones! x: ", agent.location[0], "y: ", agent.location[1])
            x = int(int(agent.location[0] + environment.x_limit)/3)
            y = int(int(agent.location[1] + environment.y_limit)/3)
            range = 0
            #environment.pheromoneList[x-range:x+range,y-range:y+range] += 3
            environment.pheromoneList[x, y] += 3



    def act(self,agent):
        #if self.atsite:
        #    pass
        if agent.goingToSite:
            dx = agent.potential_site[0] - agent.location[0]
            dy = agent.potential_site[1] - agent.location[1]
            agent.direction = np.arctan2(dy, dx)
        else:
            ##Need to spread pheremon while returning back to hub
            #if np.random.random() < .5: #so not too much pheromone is spread (60 times/second)

                #p1=Pheromone(agent.location)
                #agent.pheromoneList(p1)
            dx = agent.hub[0] - agent.location[0]
            dy = agent.hub[1] - agent.location[1]
            agent.direction = np.arctan2(dy, dx)        
        #agent.direction = np.arctan2(agent.location[0]+np.random.random(),agent.location[1]+np.random.random())
        #agent.location = [np.random.randint(1,10),np.random.randint(1,10)]    

class Recruiting(State): #like dancing
    def __init__(self,agent=None,time=None):
        self.name = 'recruiting'
        #self.recruitmentTime = time
        #if agent:
        #    print ('Recuriting:',agent.q_value)              
        #    self.recruitmentTime = agent.q_value * 300000
        #else:
        self.recruitmentTime = 300

    def sense(self,agent,environment):
        agent.carrying_food = False
    
    def update(self,agent,environment):
        #pass
        self.recruitmentTime -= 1        
        if self.recruitmentTime <= 1 :
            agent.q_value = 0
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
        #agent.direction = np.arctan2(agent.location[0]+np.random.random(),agent.location[1]+np.random.random())
        #agent.location = [np.random.randint(1,10),np.random.randint(1,10)]    