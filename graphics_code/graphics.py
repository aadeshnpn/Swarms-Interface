
from OpenGL.GL import *
from OpenGL.GLUT import *
from OpenGL.GLU import *

import Model
import Control
import sys
import math

# Some api in the chain is translating the keystrokes to this octal string
# so instead of saying: ESCAPE = 27, we use the following.
ESCAPE = '\033'
SPACE =  '\040'

colors = {
	0 : 'RED',
	1 : 'GREEN',
	2 : 'BLUE'
}


# Number of the glut window.
window = 0

delta = 0.0
environment = Model.Environment()
controller =  Control.Controller(environment)
controller.startClock()

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

def DrawGLTriangle():
	global delta
        glBegin(GL_POLYGON)                 # Start drawing a polygon
        glColor3d(.5, .5, 0.0)
        glVertex3f(0.0, .5+delta, 0.0)           # Top
        glVertex3f(.5+delta, -.5+delta, 0.0)          # Bottom Right
        glVertex3f(-.5+delta, -.5+delta, 0.0)         # Bottom Left
        glEnd()


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
	#print(angle)
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
	for agent in environment.getAgents():
		DrawAgent(agent)

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


# The function called whenever a key is pressed. Note the use of Python tuples to pass in: (key, x, y)
def keyPressed(*args):
	# If escape is pressed, kill everything.
	if args[0] == ESCAPE:
		controller.stopClock()
		sys.exit()
	if args[0] == SPACE:
		environment.getAgents()[0].x += .01
	controller.keyPressed(args)

def main():
	global window
	glutInit(sys.argv)
	glutInitDisplayMode(GLUT_RGBA | GLUT_DOUBLE | GLUT_DEPTH)
	glutInitWindowSize(640, 480)
	glutInitWindowPosition(0, 0)
	window = glutCreateWindow("Jeff Molofee's GL Code Tutorial ... NeHe '99")
	glutDisplayFunc(DrawGLScene)
	#glutFullScreen()
	glutIdleFunc(DrawGLScene)
	glutReshapeFunc(ReSizeGLScene)
	glutKeyboardFunc(keyPressed)
	InitGL(640, 480)
	glutMainLoop()
# Print message to console, and kick off the main to get it rolling.
print "Hit ESC key to quit."
main()
