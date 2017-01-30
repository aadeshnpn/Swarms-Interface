class State:
    def __init__(self, agent = None):
        pass

    def sense(self, agent, environment):
        pass

    def act(self, agent):
        pass

    def update(self, agent):
        pass

    def __str__(self):
        return self.name

    def update(self):
        return False
