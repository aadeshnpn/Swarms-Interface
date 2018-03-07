class Pheromone():
    def __init__(self,location):
        self.x=location[0]
        self.y=location[1]
        self.r=5
        self.strength=1
        self.fresh=True
    def enlarge(self):
        self.r+=.03
        self.strength-=.001
