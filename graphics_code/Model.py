import SAgent
class Environment:

	def __init__(self):
		self.reInitTestAgents()

	def reInitTestAgents(self):
		self.agents = []
		
		for i in xrange(0, 1000):
			self.addAgent(.1,.1)
		
		#self.addAgent(.2,.2)
		#self.addAgent(.3,.3)
		#self.addAgent(.4,.4)
		self.addAgent(.5,.5)
		
	def getAgents(self):
		return self.agents
	
	def addAgent(self, x, y):
		self.agents.append(SAgent.Agent(x,y))

	'''
	def addAgent(self, agent):
		self.agents.append(agent)
	'''

def main():
	a = SAgent.Agent(0,0)
	print(a)

	e = Environment()
	e.addAgent(0,1)
	e.addAgent(2,3)
	#e.addAgent(SAgent.Agent(1,1))
	#e.addAgent(SAgent.Agent(2,2))
	print(e.getAgents()[0].getXY(), e.getAgents()[1].getXY())

main()
