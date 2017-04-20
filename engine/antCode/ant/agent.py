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
        dict = {(Waiting(self).__class__, input.startSearching): [None, Searching(self)],
                (Waiting(self).__class__, input.join): [None, Exploiting(self)],
                (Waiting(self).__class__, input.startFollowing): [None, Following(self)],
                (Searching(self).__class__, input.discover): [None, Exploiting(self)],
                (Searching(self).__class__, input.stopSearching): [None, Waiting(self)],
                (Exploiting(self).__class__, input.retire): [None, Waiting(self)],
                (Exploiting(self).__class__, input.startRecruiting): [None, Recruiting(self)],
                (Exploiting(self).__class__, input.getLost1): [None, Searching(self)],
                (Recruiting(self).__class__, input.stopRecruiting): [None, Exploiting(self)],
                (Following(self).__class__, input.arrive): [None, Exploiting(self)],
                (Following(self).__class__, input.getLost1): [None, Waiting(self)],
                (Following(self).__class__, input.getLost2): [None, Searching(self)],
                }        
    def sense(self, environment):
        self.state.sense(self, environment)

    def act(self):
        self.state.act(self)

    def update(self, environment):
        self.nextState(self.state.update(self), environment)
    


    def getUiRepresentation(self):
        return {
            # these names should match the state.name property for each state
            "states": ["waiting", "searching", "recruiting"],
            "transitions": {
                "searching": ["exploring"],
                "following": ["exploiting"]
                #"commit": []
            }
        }

class Waiting(State):
    def __init__(self,agent=None,time=None):
        self.name = 'waiting'        

    def sense(self,agent,environment):
        pass
    def update(self,agent):
        pass
    def act(self,agent):
        agent.direction = np.arctan2(agent.location[0]+np.random.random(),agent.location[1]+np.random.random())
        agent.location = [agent.location[0]+np.random.randint(1,10),agent.location[1]+np.random.randint(1,10)]


class Searching(State):
    def __init__(self,agent=None,time=None):
        self.name = 'searching'        

    def sense(self,agent,environment):
        pass
    def update(self,agent):
        pass

    def act(self,agent):
        agent.direction = np.arctan2(agent.location[0]+np.random.random(),agent.location[1]+np.random.random())
        agent.location = [np.random.randint(1,10),np.random.randint(1,10)]    

class Following(State):
    def __init__(self,agent=None,time=None):
        self.name = 'following'        
    
    def sense(self,agent,environment):
        pass
    def update(self,agent):
        pass

    def act(self,agent):
        agent.direction = np.arctan2(agent.location[0]+np.random.random(),agent.location[1]+np.random.random())
        agent.location = [np.random.randint(1,10),np.random.randint(1,10)]    

class Exploiting(State):
    def __init__(self,agent=None,time=None):
        self.name = 'exploiting'        

    def sense(self,agent,environment):
        pass
    def update(self,agent):
        pass

    def act(self,agent):
        agent.direction = np.arctan2(agent.location[0]+np.random.random(),agent.location[1]+np.random.random())
        agent.location = [np.random.randint(1,10),np.random.randint(1,10)]    

class Recruiting(State):
    def __init__(self,agent=None,time=None):
        self.name = 'recruiting'        
    def sense(self,agent,environment):
        pass
    def update(self,agent):
        pass

    def act(self,agent):
        agent.direction = np.arctan2(agent.location[0]+np.random.random(),agent.location[1]+np.random.random())
        agent.location = [np.random.randint(1,10),np.random.randint(1,10)]    