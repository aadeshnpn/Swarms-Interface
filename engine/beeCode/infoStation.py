import copy

class InfoStation:

    def __init__(self, parameters):
        self.bee_count = 0

        self.parameters = parameters
        self.radius = 2
        # last_update starts with negative value, so that the first bee at the station sets the initial parameter values
        self.last_update = -1
        self.agents = {}

    # An agent passes in its current parameters and the timestamp when it received these
    # parameters from the hub. If the timestamp is more recent, update the params in the infostation and return
    # False, otherwise return True so the bee knows it needs to update its params.
    def check_for_changes(self, bee, new_parameters, time_stamp):
        self.agents[bee.id] = bee
        if len(self.agents) < 2: #only update if there are other agents in the site (communication)
            return False

        if time_stamp < self.last_update:
            bee.updateParams(copy.copy(self.parameters),self.last_update)
        elif time_stamp == self.last_update:
            return False
        self.parameters = new_parameters
        self.last_update = time_stamp
        self.emitChanges()
        return False
    def beeLeave(self,bee):
        self.bee_count-=1
        del self.agents[bee.id]
    def emitChanges(self):
        for id, bee in self.agents.items():
            bee.updateParams(copy.copy(self.parameters),self.last_update)
