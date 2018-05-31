import random
from utils.debug import *
import numpy as np
from enum import IntEnum


class Scenario(IntEnum):
    flank = 0
    delayed_flank = 1
    surround = 2
    split = 3
    penetration = 4
    penetration2 = 5
    decoy = 6


class Site:

    def __init__(self, id, is_flank, goal_x, goal_y, scenario, is_neutral):
        self.id = id
        delay = 2
        self.scenario = scenario
        self.split_right = False
        self.is_splitter = False
        self.goal_x = goal_x
        self.goal_y = goal_y
        if is_neutral:
            self.x = random.randint(-500,500)
            self.y = random.randint(-300,300)
            self.q_value = 0.1         #how do we want to determine this?

        #Flank Scenario (more realistic)
        elif scenario == Scenario.flank or scenario == Scenario.delayed_flank:
            if is_flank:
                self.q_value = 0.5
                northwest = random.randint(0, 1)
                if northwest == 0:
                    if scenario == Scenario.flank:
                        self.x = random.randint(-605, -600)
                        self.y = random.randint(400, 405)
                    else:
                        # self.x = random.randint(-1105, -1100)
                        # self.y = random.randint(600, 605)
                        self.x = random.randint(-605, -600) * delay
                        self.y = random.randint(400, 405) * delay
                else:
                    if scenario == Scenario.flank:
                        self.x = random.randint(600, 605)
                        self.y = random.randint(-405, -400)
                    else:
                        # self.x = random.randint(1100, 1105)
                        # self.y = random.randint(-655, -650)
                        self.x = random.randint(600, 605) * delay
                        self.y = random.randint(-405, -400) * delay

            else:
                self.q_value = 1
                self.x = random.randint(400, 590)
                self.y = random.randint(250, 380)


        #Surrounding Scenario
        elif scenario == Scenario.surround:
            self.q_value = random.uniform(0.5,0.9)
            theta = random.uniform(0, 2 * np.pi)
            r = random.randint(400,600)
            self.x = goal_x + (r * np.cos(theta))
            self.y = goal_y + (r * np.sin(theta))

        #Split Scenario
        elif scenario == Scenario.split:
            self.is_splitter = True
            self.q_value = 1
            self.x = random.randint(400, 590)
            self.y = random.randint(250, 380)
            split_direction = random.randint(0,1)
            if split_direction == 1:
                self.split_right = True

        #Penetration
        elif scenario == Scenario.penetration:
            self.q_value = random.uniform(0.5, 1)
            is_delayed = random.randint(0, 1)
            if is_delayed == 1:
                self.x = random.randint(700,950)
                self.y = self.x / 1.506

            else:
                self.is_splitter = True
                # self.x = random.uniform(590,595)
                # self.y = random.uniform(390,395)

                self.x = random.randint(400, 590)
                self.y = random.randint(250, 380)
                split_direction = random.randint(0, 1)
                if split_direction == 1:
                    self.split_right = True

        #Penetration2
        elif scenario == Scenario.penetration2:
            self.q_value = random.uniform(0.5, 1)
            is_delayed = random.randint(0, 4)
            if is_delayed == 1:
                self.x = random.randint(700, 900)
                self.y = self.x / 1.506

            else:
                # theta = random.uniform(-np.pi/4, 2 * np.pi / 3)
                theta = random.normalvariate(np.pi/6, 0.5)

                r = random.randint(450,600)
                self.x = goal_x + (r * np.cos(theta))
                self.y = goal_y + (r * np.sin(theta))

        #Decoy
        elif scenario == Scenario.decoy:
            self.q_value = random.uniform(0.5, 1)
            is_decoy = random.randint(0,2)
            self.x = random.randint(400, 590)
            self.y = random.randint(250, 380)
            if is_decoy == 1:
                self.goal_x = -595
                self.goal_y = 200
            elif is_decoy == 2:
                self.goal_x = 400
                self.goal_y = -300
            else:
                self.x = random.randint(800, 1050)
                self.y = self.x / 1.506




        self.is_splitting = False
        self.radius = 4
        self.is_neutral = is_neutral
        self.acc = 2
        self.velX = self.acc * .008
        self.velY = self.acc * .008
        self.velocity = random.uniform(0.21, 0.22)
        self.split_origin_x = 0
        self.split_origin_y = 0
        self.split_theta = 0

    def move(self):
        split_dist = 355
        move_to_goal = random.randint(0, 1)
        xdif = self.goal_x - self.x
        ydif = self.goal_y - self.y
        distance = np.sqrt(xdif ** 2 + ydif ** 2)
        direction = np.arctan2(self.y - self.goal_y, self.x - self.goal_x)

        if abs(xdif) < 60 and abs(ydif) < 60:
            return

        if self.scenario == Scenario.split or self.scenario == Scenario.penetration:
            if self.is_splitter and distance < split_dist and not self.is_splitting:
                self.is_splitting = True
                self.split_origin_x = self.goal_x + split_dist/2 * np.cos(direction)
                self.split_origin_y = self.goal_y + split_dist/2 * np.sin(direction)
                self.split_angle = direction

        if self.is_splitting:
            if self.split_right:
                self.split_angle += self.velocity * 0.007
            else:
                self.split_angle -= self.velocity * 0.007
            self.x = self.split_origin_x + split_dist/2 * np.cos(self.split_angle)
            self.y = self.split_origin_y + split_dist/2 * np.sin(self.split_angle)

        elif move_to_goal == 0 and not self.is_neutral:
            # xdif = self.goal_x - self.x
            # ydif = self.goal_y - self.y

            self.x = self.goal_x + (distance - self.velocity) * np.cos(direction)
            self.y = self.goal_y + (distance - self.velocity) * np.sin(direction)

        else:
            random_direction = random.randint(0, 3)
            if random_direction == 0:
                self.x += self.velocity/2
                self.y += self.velocity/2
            elif random_direction == 1:
                self.x -= self.velocity/2
                self.y += self.velocity/2
            elif random_direction == 2:
                self.x += self.velocity/2
                self.y -= self.velocity/2
            elif random_direction == 3:
                self.x -= self.velocity/2
                self.y -= self.velocity/2


    def to_json(self):
        temp = {"id": self.id, "x": self.x, "y": self.y, "radius": self.radius, "q_value": self.q_value,
                "acc": self.acc, "velX": self.velX, "velY": self.velY}

        return temp