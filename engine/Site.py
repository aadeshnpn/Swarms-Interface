import random
from utils.debug import *


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
            top = random.randint(0,1)
            if top:
                self.x = random.randint(400, 590)
                self.y = 390
            else:
                self.x = 585
                self.y = random.randint(250, 380)

        self.radius = 4
        self.q_value = 0.7          #how do we want to determine this?
        self.acc = 2
        self.velX = self.acc * .008
        self.velY = self.acc * .008
        self.goal_x = goal_x
        self.goal_y = goal_y

    def move(self):
        move_to_goal = random.randint(0, 3)
        xdif = abs(self.goal_x - self.x)
        ydif = abs(self.goal_y - self.y)
        self.velX = xdif / ydif
        self.velY = ydif / xdif

        velocity = .2

        if xdif < 2 and ydif < 2:
            return

        if move_to_goal == 0:
            if self.x < self.goal_x:
               self.x += self.velX * velocity
            else:
                self.x -= self.velX * velocity

            if self.y < self.goal_y:
                self.y += self.velY * velocity
            else:
                self.y -= self.velY * velocity

        else:
            random_direction = random.randint(0, 3)
            if random_direction == 0:
                self.x += velocity
                self.y += velocity
            elif random_direction == 1:
                self.x -= velocity
                self.y += velocity
            elif random_direction == 2:
                self.x += velocity
                self.y -= velocity
            elif random_direction == 3:
                self.x -= velocity
                self.y -= velocity


    def to_json(self):
        temp = {"id": self.id, "x": self.x, "y": self.y, "radius": self.radius, "q_value": self.q_value,
                "acc": self.acc, "velX": self.velX, "velY": self.velY}

        return temp