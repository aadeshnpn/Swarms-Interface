import threading
import math
import random
INTERVAL = .025
WIN_X = 1.0
WIN_Y = 1.0

class Controller:	

	def __init__(self, environment):
		self.environment = environment
		self.updating    = False
	def keyPressed(self, args):
		if(args == '\162'):
			self.redistributeAgentState(0)
		elif(args == '\147'):
			self.redistributeAgentState(1)
		elif(args == '\142'):
			self.redistributeAgentState(2)
		print(args)

	def isWithinWindow(self, agent):
		if(math.fabs(agent.x) < WIN_X and math.fabs(agent.y) < WIN_Y):
			return True
		return False

	def startClock(self):
		#print("startClock reached")
		self.updating = True
		threading.Timer(INTERVAL, self.updateAgents).start()

	def updateAgents(self):
		#print("updateAgents called")
		for agent in self.environment.getAgents():
			#if agent is on boundary, prevent from moving off
			if(self.isWithinWindow(agent) is False):
				agent.orientation = 180 + agent.orientation				
				if(math.fabs(agent.x) >= WIN_X):
					agent.x = math.copysign(WIN_X, agent.x)
				if(math.fabs(agent.y) >= WIN_Y):
					agent.y = math.copysign(WIN_Y, agent.y)

			agent.moveSelf()
		if(self.updating is True):	
			threading.Timer(INTERVAL, self.updateAgents).start()
		
	def stopClock(self):
		self.updating = False

	def redistributeAgentState(self, state):
		for agent in self.environment.getAgents():
			if(agent.state == state):
				if(random.random() > 0.5):
					agent.incrementState()
				else:
					agent.decrementState()
				return	
