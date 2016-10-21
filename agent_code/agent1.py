import numpy as np
import random

class Point:
    def __init__(self,x,y):
        self.x = 0
        self.y = 0
        

class Rand_mover:
    def __init__(self,x,y):
        self.Point = Point(x,y)
        self.velocity = 1
        self.direction = random.uniform(0,2*np.pi)
        self.dir_cnt = 5
        
    def move(self):
        newx = random.uniform(-.5,.5)
        newy = random.uniform(-.5,.5)
        self.Point.x += newx
        self.Point.y += newy
        
    def smooth_move(self):
        #delta_d = random.uniform(-.5,.5)
        '''
        if (self.dir_cnt > 0):
            self.dir_cnt -= 1
        else:
            delta_d = np.random.normal(0,.01)
            #print delta_d
            print self.direction,delta_d
            self.direction = (self.direction + delta_d) % (2*np.pi)
            print self.direction
            self.dir_cnt = 1
        '''
        delta_d = np.random.normal(0,.3)
        self.direction = (self.direction + delta_d) % (2*np.pi)
        if (abs(self.Point.x) >= 100 or abs(self.Point.y) >= 100):
             self.direction -= np.pi
        self.Point.x += np.cos(self.direction)
        self.Point.y += np.sin(self.direction)
        
    