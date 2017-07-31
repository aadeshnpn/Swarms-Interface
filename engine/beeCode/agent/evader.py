from .stateMachine.StateMachine import StateMachine
from .stateMachine.state import State
from .agent import *
import numpy as np

class Evader(Agent):
    def getUiRepresentation(self):
        return {
            # these names should match the state.name property for each state
            "states": ["Evading"],
            "transitions": {"Evading" : []}
        }

    def to_json(self):
        return super().to_json()

    def __init__(self, environment, agentId, initialstate, params, count=1000):
        super().__init__(environment, agentId, initialstate, params)
        self.velocity = self.parameters["Velocity"] * .95
        self.location = [np.random.random()*800 - 400, 4000*np.random.random() + 2000 ]
        #UAV_Patrolling
        self.transitionTable = {
        }

    def caught(self):
        self.velocity = 0.0

class Evading(State):
    def __init__(self, agent=None):
        self.name = "Evading"

    def sense(self, agent, environment):
        pass

    def act(self, agent):
        agent.direction = 1.5*3.141592

    def update(self, agent):
        return None

'''
class Caught(State):
    def __init__(self, agent=None):
        self.name = "Caught"

    def sense(self, agent, environment):
        pass

    def act(self, agent):
        agent.velocity = 0.0

    def update(self, agent):
        return None
'''
