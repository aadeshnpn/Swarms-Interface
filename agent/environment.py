from agent import *

class environment:
    def __init__(self):
        self.bees = []
        self.bees.append(Agent(0, Exploring()))
        self.bees.append(Agent(1, Resting()))
        self.bees.append(Agent(2, Exploring()))
        self.bees.append(Agent(3, Resting()))
    def run(self):
        for i in range(len(self.bees)):

            bee = self.bees[i]
            print(str(i) + " " + str(bee.state) + " " + str(bee.location))
            bee.sense(self)
            bee.act(self)
            self.newlocation(i, bee.direction, bee.velocity)
            bee.update(self)

        print("\n")

    def get_q(self, xloc, yloc):
        return 0 #np.random.randint(0,2);
    def newlocation(self, id, direction, velocity):
        bee = self.bees[id]
        bee.location[0]  = bee.location[0] + (bee.velocity * np.cos(bee.direction))
        bee.location[1] = bee.location[1] + (bee.velocity * np.sin(bee.direction))
        return
    def get_nearby_agents(self, id):
        bee = self.bees[id]
        return []