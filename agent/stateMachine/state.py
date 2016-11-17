class State:
    def __init__(self):
        pass
    def sense(self, agent, environment):
        pass
    def act(self, agent, environment):
        pass
    def update(self, agent, environment):
        pass
    def __str__(self):
        return self.name
    def update(self):
        return False