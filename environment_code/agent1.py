import numpy as np
import random


class Point:

    def __init__(self, coordinates, agent_id, state):
        self.location = coordinates
        self.id = agent_id
        self.state = state
        self.direction = random.uniform(0, 2 * np.pi)
        self.q_found = 0
        self.site_location = []
        self.live = True
