import numpy as np
from .abstractAgent import Agent
from .stateMachine.state import State

class HumanAgent(Agent):
	def __init__(self, environment, agentId, initialstate, params):
		super().__init__(environment, agentId, Human_Searching(None), params)
		self.direction = np.pi/4
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
		self.velocity = self.parameters['Velocity'] * .5
		self.view = 2;

class HumanFoot(HumanAgent):
	def __init__(self, environment, agentId, initialstate, params):
		super().__init__(environment, agentId, initialstate, params)
		self.velocity = self.parameters['Velocity'] * 1.0
		self.view = 2;

class HumanHelicopter(HumanAgent):
	def __init__(self, environment, agentId, initialstate, params):
		super().__init__(environment, agentId, initialstate, params)
		self.velocity = self.parameters['Velocity'] * 7
		self.view = 2;

class HumanDogs(HumanAgent):
	def __init__(self, environment, agentId, initialstate, params):
		super().__init__(environment, agentId, initialstate, params)
		self.velocity = self.parameters['Velocity'] * .8
		self.view = 2;

class Human_Searching(State):
	def __init__(self, agent=None):
		self.name = "Human_Searching"
		self.clueCooldownTimer = 0
		self.visitedClues = set()
		self.targetClue = None
		self.view = 2;
	def sense(self, agent, environment):
		pass

	def act(self, agent):
		agent.direction = np.random.normal(agent.direction, .01)

		if(self.targetClue is not None):
			agent.move(self.targetClue.location)
			if(np.linalg.norm(np.array(agent.location) - np.array(self.targetClue.location)) < 5):
				agent.direction = self.targetClue.direction
				self.visitedClues.add(self.targetClue)
				self.targetClue = None
		else:
			for clue in agent.environment.clues:
				if(np.linalg.norm(np.array(agent.location) - np.array(clue.location)) < 50 and clue not in self.visitedClues):
					self.targetClue = clue
					break
		'''
		if(self.clueCooldownTimer > 0):
			self.clueCooldownTimer -= 1
			return

		for clue in agent.environment.clues:
			if(np.linalg.norm(np.array(agent.location) - np.array(clue.location)) < 100): #need something better
				#agent.direction = clue.direction
				agent.move(clue.location)
				self.clueCooldownTimer = 50
				#eprint("Human found a clue")
				break
		'''

	def update(self, agent):
		return None
