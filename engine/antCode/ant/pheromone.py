class Pheromone:
    def __init__(self,location,evaporation_rate=2,diffusion_rate=2,strength=1,scope=10,types='recuriting'):
        self.location = location
        self.evaporation_rate = evaporation_rate
        self.diffusion_rate = diffusion_rate
        self.strength = strength
        self.types = types
        self.scope = scope
        self.radius = self.diffusion_rate * self.strength

    def reduce_scope(self):
        self.scope -= (1 * self.evaporation_rate)

    def get_radius(self,diffusion_rate,strength):
        self.radius = diffusion_rate * strength
        return self.radius




    
