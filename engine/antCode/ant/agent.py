from enum import Enum

from .StateMachine import StateMachine
from .state import State
import numpy as np

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
        self.siteIndex = None
        self.goingToSite = True
        self.quadrant = []
        self.carrying_food = False
        self.carrying_capacity = 1
        self.attractor = None
        self.attracted = None
        self.repulsor = None
        self.ignore_repulsor = None
        #This holds the identity of following ants
        self.following = None
        # These parameters may be modified at run-time
        self.parameters =  {"WaitingTime": 3000,
                            "SearchTime": 2000}  

        dict = {(Waiting(self).__class__, input.startSearching): [None, Searching(self)],
                (Waiting(self).__class__, input.join): [None, Exploiting(self)],
                (Waiting(self).__class__, input.startFollowing): [None, Following(self)],
                (Searching(self).__class__, input.discover): [None, Exploiting(self)],
                (Searching(self).__class__, input.stopSearching): [None, Waiting(self)],
                (Exploiting(self).__class__, input.retire): [None, Waiting(self)],
                (Exploiting(self).__class__, input.startRecruiting): [None, Recruiting(self,3000)],
                (Exploiting(self).__class__, input.getLost1): [None, Searching(self)],
                (Recruiting(self).__class__, input.stopRecruiting): [None, Exploiting(self)],
                #(Recruiting(self).__class__, input.stopRecruiting): [None, Following(self)],                
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
        return {
            # these names should match the state.name property for each state
            "states": ["waiting", "searching", "recruiting","following", "exploiting"],
            "transitions": {
                "searching": ["exploiting"],
                "following": ["exploiting"]
                #"commit": []
            }
        }

class Waiting(State):
    def __init__(self,agent=None,time=None):
        self.name = 'waiting'
        exp = np.random.normal(1, .3, 1)
        while exp < 0:
            exp = np.random.normal(1, .3, 1)
        if agent is not None:
            self.waitingtime = exp*agent.parameters["WaitingTime"]
        else:
            self.waitingtime = exp*3000               

    def sense(self,agent,environment):
        #if self.atHub:
        pass
                   

    def update(self,agent,environment):
        self.waitingtime -= 1
        #Read that the change follows poission distribution. First implementing simple model. Latter need to switch to poission
        #If rate of ants contacts many exploiting ants (log(n)) successively then start following them
        #if round(np.log(environment.number_of_agents))
        exploiters_at_hub,total_at_hub,recruiters_dict = environment.agents_at_hub('exploiting')
        #print (exploiters_at_hub,total_at_hub)
        #Condition for transition from waiting to following
        if exploiters_at_hub > round(np.log(environment.number_of_agents)) and exploiters_at_hub/(total_at_hub+1) > np.random.random():
            #self.
            #print (recruiters_dict)
            #exit(0)
            return input.startFollowing
        elif self.waitingtime < 1:
            return input.startSearching
        #pass

    def act(self,agent):
        agent.direction = np.arctan2(agent.location[0]+np.random.random(),agent.location[1]+np.random.random())
        agent.location = [np.random.randint(1,10),np.random.randint(1,10)]          
        #pass



class Searching(State):
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
    
    def sense(self,agent,environment):
        pass
    def update(self,agent,environment):
        pass

    def act(self,agent):
        agent.direction = np.arctan2(agent.location[0]+np.random.random(),agent.location[1]+np.random.random())
        agent.location = [np.random.randint(1,10),np.random.randint(1,10)]    

class Exploiting(State):
    def __init__(self,agent=None,time=None):
        self.name = 'exploiting'        
        self.atsite = False
    def sense(self,agent,environment):
        if (((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 > agent.hubRadius):
            if agent.goingToSite and agent.inHub:
                if environment.hubController.beeCheckOut(agent)==0:
                    agent.inHub = False
                    #self.atsite = False
                    return
        if (((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 < agent.hubRadius+1.251858563765788):
            if not agent.goingToSite and not agent.inHub:
                environment.hubController.beeCheckIn(agent)
                agent.inHub = True
                environment.sites[agent.siteIndex]['food_unit'] -= 1
                environment.sites[agent.siteIndex]['radius'] -= 0.02
                environment.sites[agent.siteIndex]['q_value']/30.0                

        new_q = environment.get_q(agent)["q"]
        if round(new_q) == round(agent.q_value):
            self.atsite = True
                #self.atsite = False
        #if (((agent.potential_site[0] - agent.location[0]) ** 2 + (agent.potential_site[1] - agent.location[1]) ** 2) ** .5 < 1):
        #    self.atsite = True
                    
    def update(self,agent,environment):
        #if agent.inHub and :
        #    return input.startRecruiting
        if (((agent.hub[0] - agent.location[0]) ** 2 + (
                agent.hub[1] - agent.location[1]) ** 2) ** .5 < agent.hubRadius) and (agent.goingToSite is False):
            agent.goingToSite = True
            return input.startRecruiting
        elif ((agent.potential_site[0] - agent.location[0]) ** 2 + (
                agent.potential_site[1] - agent.location[1]) ** 2) < 1 and (agent.goingToSite is True):
            agent.goingToSite = False
        #if agent.inHub:

            #if(np.random.uniform(0,1) < 1 - agent.q_value): # (1-q)% chance of going to observer state instead of dancing
            #    return input.quit
            #return input.siteAssess        
        #pass

    def act(self,agent):
        #if self.atsite:
        #    pass
        if agent.goingToSite:
            dx = agent.potential_site[0] - agent.location[0]
            dy = agent.potential_site[1] - agent.location[1]
            agent.direction = np.arctan2(dy, dx)
        else:
            dx = agent.hub[0] - agent.location[0]
            dy = agent.hub[1] - agent.location[1]
            agent.direction = np.arctan2(dy, dx)        
        #agent.direction = np.arctan2(agent.location[0]+np.random.random(),agent.location[1]+np.random.random())
        #agent.location = [np.random.randint(1,10),np.random.randint(1,10)]    

class Recruiting(State):
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