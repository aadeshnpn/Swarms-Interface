from .stateMachine.StateMachine import StateMachine
from .stateMachine.state import State
from .abstractAgent import *
from copy import deepcopy
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
        self.velocity = self.parameters["Velocity"] * .1
        self.location = [100,100]#[np.random.random()*800 - 400, 00*np.random.random() + 800 ]
        #UAV_Patrolling
        self.transitionTable = {
        }

    def caught(self):
        self.velocity = 0.0

class Evading(State):
    def __init__(self, agent=None):
        self.name = "Evading"
        self.clueTimer = 100
    def sense(self, agent, environment):
        pass

    def act(self, agent):
        agent.direction = np.random.normal(agent.direction, .01)
        if(self.clueTimer < 0):
            self.clueTimer = 100
            agent.environment.addClue(Clue(deepcopy(agent.location), agent.direction))
        self.clueTimer -= 1
    def update(self, agent):
        return None


class Clue:
    def __init__(self, location, direction):
        self.location = location
        self.probOfDetection = 1.0
        self.direction = direction
        #TODO: varying rates of detection (dogs can really easily find somethings, whereas helicopters can't see things like a broken branch at eye level)
        #TODO: (possible) (varying) decay over time
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
