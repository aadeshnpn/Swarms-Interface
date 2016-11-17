
from OpenGL.GL import *
from OpenGL.GLUT import *
from OpenGL.GLU import *

import Model
import Control
import sys
import math

import numpy as np
# Some api in the chain is translating the keystrokes to this octal string
# so instead of saying: ESCAPE = 27, we use the following.
ESCAPE = '\033'
SPACE =  '\040'

colors = {
	0 : 'RED',
	1 : 'GREEN',
	2 : 'BLUE'
}

lastLeftClick = None

# Number of the glut window.
window = 0

delta = 0.0
environment = Model.Environment()
controller =  Control.Controller(environment)
controller.startClock()


quadric = None
# A general OpenGL initialization function.  Sets all of the initial parameters.
def InitGL(Width, Height):				# We call this right after our OpenGL window is created.
    glClearColor(0.0, 0.0, 0.0, 0.0)	# This Will Clear The Background Color To Black
    glClearDepth(1.0)					# Enables Clearing Of The Depth Buffer
    glDepthFunc(GL_LESS)				# The Type Of Depth Test To Do
    glEnable(GL_DEPTH_TEST)				# Enables Depth Testing
    glShadeModel(GL_SMOOTH)				# Enables Smooth Color Shading

    glMatrixMode(GL_PROJECTION)
    glLoadIdentity()					# Reset The Projection Matrix
										# Calculate The Aspect Ratio Of The Window
    #gluPerspective(45.0, float(Width)/float(Height), 0.1, 100.0)

    glMatrixMode(GL_MODELVIEW)

# The function called when our window is resized (which shouldn't happen if you enable fullscreen, below)
def ReSizeGLScene(Width, Height):
    if Height == 0:						# Prevent A Divide By Zero If The Window Is Too Small
	    Height = 1

    glViewport(0, 0, Width, Height)		# Reset The Current Viewport And Perspective Transformation
    glMatrixMode(GL_PROJECTION)
    glLoadIdentity()
    #gluPerspective(45.0, float(Width)/float(Height), 0.1, 100.0)
    glMatrixMode(GL_MODELVIEW)

def glSetColor(color):
	if(color == "RED"):
		glColor3d(1.0, 0.0, 0.0)
	elif(color == "GREEN"):
		glColor3d(0.0, 1.0, 0.0)
	elif(color == "BLUE"):
		glColor3d(0.0, 0.0, 1.0)
	else:
		glColor3d(.333, .333, 0.0)

'''
careful with glTranslate, Rotate and pop push operations. Thanks to DarthDarth Binks for help with rotation code.
'''
def DrawTriangle(x,y,b,h, angle, color):
	glPushMatrix()
	glTranslate(x,y,0)
	glRotatef( angle - 90, 0, 0, 1)
	glBegin(GL_POLYGON)
	glSetColor(color)
	glVertex3f(   0, h, 0.0)
	glVertex3f(   b, 0, 0.0)
	glVertex3f(-1*b, 0, 0.0)
	glEnd()
	glPopMatrix()

def DrawAgent(agent):
	DrawTriangle(agent.x, agent.y, .025,.05, agent.orientation, colors[agent.state])

def DrawAgents():
	global environment
	
	DrawStateHistogram()
	for agent in environment.getAgents():
		DrawAgent(agent)
	DrawMosquitoNet(environment.mosquitoNet)
	
	DrawHive(environment.Hive[0], environment.Hive[1])
	for site in environment.sites:
		DrawSite(site)	
def updateAgents():
	global environment
	for agent in environment.getAgents():
		agent.moveSelf()

# The main drawing function.
def DrawGLScene():
	global delta, environment
	# Clear The Screen And The Depth Buffer
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT)
	glLoadIdentity()					# Reset The View
	DrawAgents()
	glutSwapBuffers()

def DrawRectangle(x1, y1, x2, y2, x3, y3, x4, y4, color = ""):
	glBegin(GL_POLYGON)
	glSetColor(color)
	glVertex3f(   x1, y1, 0.0)
	glVertex3f(   x2, y2, 0.0)
	glVertex3f(   x4, y4, 0.0)
	glVertex3f(   x3, y3, 0.0)
	glEnd()

def DrawSquare(x, y, s_l, color = ""):
	DrawRectangle(x,y, x+s_l, y, x, y+s_l, x+s_l, y+s_l, color = color)

def DrawHive(x,y):

	'''
	global quadric
	#DrawCircle(x,y,.05, color = "")
	if(quadric is None):
		quadric = gluNewQuadric()
	glBegin(
	gluQuadricDrawStyle(quadric,GLU_SILHOUETTE)
	gluDisk(quadric, 0.01, .1, 1, 1)
	'''

	radius = 30

	glEnable(GL_POINT_SMOOTH)
	glHint(GL_POINT_SMOOTH_HINT, GL_NICEST)
	glPointSize(radius)
	glColor3d(1.0, 1.0, 0)
	glBegin(GL_POINTS)
	glVertex2d(0.0, 0.0)
	glEnd()

def DrawMosquitoNet(mosquitoNet):
	glLineWidth(2.5)
	glColor3f(1.0, .4, .6)
	glBegin(GL_LINES)
	glVertex2f(mosquitoNet[0][0], mosquitoNet[0][1])
	glVertex2f(mosquitoNet[1][0], mosquitoNet[1][1])
	glEnd()
def DrawCircle(x,y, radius, color = ""):
	glBegin(GL_LINE_LOOP)
	for i in xrange(0,360):
		degInRad = i*math.pi/180
		glVertex2f(math.cos(degInRad)*radius,math.sin(degInRad)*radius)
	glEnd()


def DrawSite(site):
	DrawSquare(site[0],site[1],.05, color = "RED")
	

def DrawStateHistogram(): #hackish
	states = [0,0,0]
	for agent in environment.getAgents():
		states[agent.state] += 1

	DrawRectangle(.97, -.99, .99, -.99, .97, -.99+.2*states[0]/np.sum(states), .99, -.99+.2*states[0]/np.sum(states), color = "RED")
	DrawRectangle(.94, -.99, .96, -.99, .94, -.99+.2*states[1]/np.sum(states), .96, -.99+.2*states[1]/np.sum(states), color = "GREEN")
	DrawRectangle(.91, -.99, .93, -.99, .91, -.99+.2*states[2]/np.sum(states), .93, -.99+.2*states[2]/np.sum(states), color = "BLUE")
	

def getRelativeCoordinates(x,y):
	#print(x,y)
	return 2*((float(x))/640.0-.5), -2*((float(y))/480.0-.5)

def isWithinRect(x, y, x1, y1, x2, y2):
	
	x1, y1 = getRelativeCoordinates(x1,y1)
	x2, y2 = getRelativeCoordinates(x2,y2)
	
	if(((x1 < x and x < x2) or (x1 > x and x >x2)) is not True):
		print("fail 1")
		return False  
	if(((y1 < y and y < y2) or (y1 > y and y >y2)) is not True):
		print("fail 2")
		return False
	return True

def mouseClicked(button, state, x, y):
	global lastLeftClick
	if(button == 0 and state == 0):
		lastLeftClick = [x, y]
		return
	for agent in environment.getAgents():
		if(isWithinRect(agent.x, agent.y, x, y, lastLeftClick[0], lastLeftClick[1])):
			agent.incrementState()
# The function called whenever a key is pressed. Note the use of Python tuples to pass in: (key, x, y)
def keyPressed(*args):
	# If escape is pressed, kill everything.
	if args[0] == ESCAPE:
		controller.stopClock()
		sys.exit()
	controller.keyPressed(args[0])

def main():
	global window
	glutInit(sys.argv)
	glutInitDisplayMode(GLUT_RGBA | GLUT_DOUBLE | GLUT_DEPTH)
	glutInitWindowSize(640, 480)
	glutInitWindowPosition(0, 0)
	window = glutCreateWindow("BYU Swarm Simulator")
	glutDisplayFunc(DrawGLScene)
	#glutFullScreen()
	glutIdleFunc(DrawGLScene)
	glutReshapeFunc(ReSizeGLScene)
	glutMouseFunc(mouseClicked)
	glutKeyboardFunc(keyPressed)
	InitGL(640, 480)
	glutMainLoop()
# Print message to console, and kick off the main to get it rolling.
print "Hit ESC key to quit."
main()
