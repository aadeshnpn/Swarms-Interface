import numpy as np
from .abstractAgent import Agent
from .stateMachine.state import State

class HumanAgent(Agent):
	def __init__(self, environment, agentId, initialstate, params):
		super().__init__(environment, agentId, Human_Searching(None), params)

	def to_json(self):
		return super().to_json()

	def getUiRepresentation(self):
		return {
			# these names should match the state.name property for each state
			"states": ["Human_Searching"],
			"transitions": {"Human_Searching" : []}
		}


class HumanTruck(HumanAgent):
	def __init__(self, environment, agentId, initialstate, params):
		super().__init__(environment, agentId, initialstate, params)
		self.velocity = self.parameters['Velocity'] * 3.5

class HumanFoot(HumanAgent):
	def __init__(self, environment, agentId, initialstate, params):
		super().__init__(environment, agentId, initialstate, params)
		self.velocity = self.parameters['Velocity'] * 1.0

class HumanHelicopter(HumanAgent):
	def __init__(self, environment, agentId, initialstate, params):
		super().__init__(environment, agentId, initialstate, params)
		self.velocity = self.parameters['Velocity'] * 7

class HumanDogs(HumanAgent):
	def __init__(self, environment, agentId, initialstate, params):
		super().__init__(environment, agentId, initialstate, params)
		self.velocity = self.parameters['Velocity'] * .8

class Human_Searching(State):
	def __init__(self, agent=None):
		self.name = "Human_Searching"

	def sense(self, agent, environment):
		pass

	def act(self, agent):
		agent.direction = np.random.normal(agent.direction, .01)

	def update(self, agent):
		return None