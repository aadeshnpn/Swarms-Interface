import matplotlib.pyplot as plt 
import numpy as np
import agent1
from Environment import Environment

mover = agent1.Rand_mover(0,0)
environment = Environment("environment.txt")

fig, ax = plt.subplots()
cur_color = 'r'
found = False


for t in range(300):
    if t == 0:
        points, = ax.plot(mover.Point.x, mover.Point.y, marker='o', color = cur_color,
                        linestyle='None')
        '''plt.axis([-30,30,-30,30])'''
        ax.set_xlim(-100, 100) 
        ax.set_ylim(-100, 100) 
    else:
        #mover.move()
        mover.smooth_move()
        if(not found):
            q = environment.get_q(mover.Point.x,mover.Point.y)
            if(q > 0):
                print q
                points, = ax.plot(mover.Point.x, mover.Point.y, marker='o', color = 'r',
                        linestyle='None')
                found = True
        points.set_data(mover.Point.x, mover.Point.y)
    plt.pause(0.01)