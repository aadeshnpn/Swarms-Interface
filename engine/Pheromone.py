class Pheromone():
    def __init__(self,location):
        self.x=location[0]
        self.y=location[1]
        self.r=5
        self.strength=1
    def enlarge(self):
        self.r+=1
        self.strength-=.1
