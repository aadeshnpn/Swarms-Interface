import numpy as np
import math
PI = math.pi
STEP_SIZE = .01
class Agent:
	def __init__(self, x, y):
		self.x = x
		self.y = y
		self.orientation = 0.0
		self.i = 0
		self.state = 0
	def getXY(self):
		return self.x, self.y

	def move(self):
		self.x += math.cos(PI*(self.orientation)/180)*STEP_SIZE
		self.y += math.sin(PI*(self.orientation)/180)*STEP_SIZE
		'''
		if direction == UP:
			self.y += STEP_SIZE
		elif direction == RIGHT:
			self.x += STEP_SIZE
		elif direction == DOWN:
			self.y -= STEP_SIZE
		elif direction == LEFT:
			self.y -= STEP_SIZE
		else:
			raise ValueError("Invalid value for direction: must be 0,1,2, or 3")
		'''
	def moveSelf(self):
		self.orientation = np.random.normal(loc = self.orientation, scale = 3.0)
		#self.orientation += .01
		self.move()
		#self.move(np.random.randint(0,4))

		if(self.i % 10 == 0):
			if np.random.uniform(0, 1.0, 1) > .999:
				self.state = (self.state + 1) % 3
			#print(self.x, self.y, self.orientation)
		self.i += 1
