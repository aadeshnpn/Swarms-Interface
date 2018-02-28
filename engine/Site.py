import random
from utils.debug import *
import numpy as np


class Site:

    def __init__(self, id, is_flank, goal_x, goal_y):
        self.id = id

        if is_flank:
            northwest = random.randint(0, 1)
            if northwest == 0:
                self.x = random.randint(-585, -580)
                self.y = random.randint(250, 255)
            else:
                self.x = random.randint(580, 585)
                self.y = random.randint(-380, -377)
        else:
            self.x = random.randint(400, 590)
            self.y = random.randint(250, 380)


        #Surrounding Scenario

        # theta = random.uniform(0, 2 * np.pi)
        # r = random.randint(400,600)
        # self.x = goal_x + (r * np.cos(theta))
        # self.y = goal_y + (r * np.sin(theta))


        self.radius = 4
        self.q_value = 0.7          #how do we want to determine this?
        self.acc = 2
        self.velX = self.acc * .008
        self.velY = self.acc * .008
        self.goal_x = goal_x
        self.goal_y = goal_y
        self.velocity = random.uniform(0.03, 0.1)

    def move(self):
        move_to_goal = random.randint(0, 3)
        xdif = self.goal_x - self.x
        ydif = self.goal_y - self.y

        if abs(xdif) < 30 and abs(ydif) < 30:
            return

        distance = np.sqrt(xdif**2 + ydif**2)
        direction = np.arctan2(self.y - self.goal_y, self.x - self.goal_x)
        self.x = self.goal_x + (distance - self.velocity) * np.cos(direction)
        self.y = self.goal_y + (distance - self.velocity) * np.sin(direction)

        if move_to_goal == 0:
            xdif = self.goal_x - self.x
            ydif = self.goal_y - self.y
            distance = np.sqrt(xdif ** 2 + ydif ** 2)
            direction = np.arctan2(self.y - self.goal_y, self.x - self.goal_x)
            self.x = self.goal_x + (distance - self.velocity) * np.cos(direction)
            self.y = self.goal_y + (distance - self.velocity) * np.sin(direction)

        else:
            random_direction = random.randint(0, 3)
            if random_direction == 0:
                self.x += self.velocity
                self.y += self.velocity
            elif random_direction == 1:
                self.x -= self.velocity
                self.y += self.velocity
            elif random_direction == 2:
                self.x += self.velocity
                self.y -= self.velocity
            elif random_direction == 3:
                self.x -= self.velocity
                self.y -= self.velocity


    def to_json(self):
        temp = {"id": self.id, "x": self.x, "y": self.y, "radius": self.radius, "q_value": self.q_value,
                "acc": self.acc, "velX": self.velX, "velY": self.velY}

        return temp