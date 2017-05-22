import json
import random
import numpy as np

class worldGenerator:

    def __init__(self):
        self.min_length = 700
        self.max_length = 1500
        x = random.randint(self.min_length, self.max_length)
        y = int(x*np.random.normal(1,.2))
        if y<600:
            y=600
        self.dimensions = {"x_length": x, "y_length": y}
        hub_radius = 20
        '''self.hub = {"x": random.randint(hub_radius/2, self.dimensions["x_length"] - hub_radius/2) - self.dimensions["x_length"]/2,
                    "y": random.randint(hub_radius/2, self.dimensions["y_length"] - hub_radius/2) - self.dimensions["y_length"]/2,
                    "radius": hub_radius}'''
        self.hub = {"x": 0, "y": 0, "radius": hub_radius}
        self.sites = []
        self.obstacles = []
        self.traps = []
        self.rough = []
        self.create()

    def create(self):
        self.create_sites()
        self.create_obstacles()
        self.create_traps()
        self.create_rough_terrain()

    def create_sites(self):
        max_sites = int(self.dimensions["x_length"]*self.dimensions["y_length"] * (13/self.max_length**2)) + 2
        sitesNum = random.randint(2, max_sites)
        for proposed_site in range(sitesNum):
            site = {"radius": random.randint(1, 20), "q_value": random.random()}

            ready = False

            while not ready:
                site["x"] = random.randint(round(site["radius"]/2), self.dimensions["x_length"] - round(site["radius"]/2)) - self.dimensions["x_length"]/2
                site["y"] = random.randint(round(site["radius"]/2), self.dimensions["y_length"] - round(site["radius"]/2)) - self.dimensions["y_length"]/2

                if ((site["x"]-self.hub["x"])**2 + (site["y"]-self.hub["y"])**2)**.5 > site["radius"] + self.hub["radius"]:
                    ready = True
                else:
                    ready = False

                for existing in self.sites:
                    if ((site["x"]-existing["x"])**2 + (site["y"]-existing["y"])**2)**.5 < site["radius"] + existing["radius"]:
                        ready = False
                        break

            self.sites.append(site)

    def create_obstacles(self):
        max_obstacles = int(self.dimensions["x_length"] * self.dimensions["y_length"] * (8 / self.max_length ** 2)) + 2
        obstaclesNum = random.randint(0, max_obstacles)
        for proposed_obstacle in range(obstaclesNum):
            obstacle = {"radius": random.randint(5, 50)}

            ready = False

            while not ready:
                obstacle["x"] = random.randint(round(obstacle["radius"]/2), self.dimensions["x_length"] - round(obstacle["radius"]/2)) - self.dimensions["x_length"]/2
                obstacle["y"] = random.randint(round(obstacle["radius"]/2), self.dimensions["y_length"] - round(obstacle["radius"]/2)) - self.dimensions["y_length"]/2

                if ((obstacle["x"] - self.hub["x"]) ** 2 + (obstacle["y"] - self.hub["y"]) ** 2) ** .5 > obstacle["radius"] + \
                        self.hub["radius"]:
                    ready = True
                else:
                    ready = False

                for site in self.sites:
                    if ((obstacle["x"] - site["x"]) ** 2 + (obstacle["y"] - site["y"]) ** 2) ** .5 < obstacle["radius"] + \
                            site["radius"]:
                        ready = False
                        break

            self.obstacles.append(obstacle)

    def create_traps(self):
        max_traps = int(self.dimensions["x_length"] * self.dimensions["y_length"] * (8 / self.max_length ** 2)) + 2
        trapsNum = random.randint(0, max_traps)
        for proposed_trap in range(trapsNum):
            trap = {"radius": random.randint(1, 20)}

            ready = False

            while not ready:
                trap["x"] = random.randint(0, self.dimensions["x_length"]) - self.dimensions["x_length"] / 2
                trap["y"] = random.randint(0, self.dimensions["y_length"]) - self.dimensions["y_length"] / 2

                if ((trap["x"] - self.hub["x"]) ** 2 + (trap["y"] - self.hub["y"]) ** 2) ** .5 > trap["radius"] + \
                        self.hub["radius"]:
                    ready = True
                else:
                    ready = False

                for site in self.sites:
                    if ((trap["x"] - site["x"]) ** 2 + (trap["y"] - site["y"]) ** 2) ** .5 < trap["radius"] + \
                            site["radius"]:
                        ready = False
                        break

            self.traps.append(trap)

    def create_rough_terrain(self):
        max_rough = int(self.dimensions["x_length"] * self.dimensions["y_length"] * (8 / self.max_length ** 2)) + 2
        roughNum = random.randint(0, max_rough)
        for proposed_rough_spot in range(roughNum):
            trap = {"radius": random.randint(10, 150), "x": random.randint(0, self.dimensions["x_length"]) -
                                                    self.dimensions["x_length"] / 2, "y": random.randint(0,
                                                    self.dimensions["y_length"]) - self.dimensions["y_length"] / 2}

            self.rough.append(trap)

    def to_json(self):
        return(
            json.dumps(
                {
                    "dimensions": self.dimensions,
                    "hub": self.hub,
                    "sites": self.sites,
                    "obstacles": self.obstacles,
                    "traps": self.traps,
                    "rough terrain": self.rough
                })
        )

newWorld = worldGenerator()
