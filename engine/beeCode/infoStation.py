import copy

class InfoStation:

    def __init__(self, parameters):
        self.bee_count = 0

        self.parameters = parameters

        # last_update starts with negative value, so that the first bee at the station sets the initial parameter values
        self.last_update = -1
        self.agents = {}

    # An agent passes in its current parameters and the timestamp when it received these
    # parameters from the hub. If the timestamp is more recent, update the params in the infostation and return
    # False, otherwise return True so the bee knows it needs to update its params.
    def check_for_changes(self, bee, new_parameters, time_stamp):
        self.agents[bee.id] = bee
        if time_stamp < self.last_update:
            return True
        elif time_stamp == self.last_update:
            return False
        self.parameters = new_parameters
        self.last_update = time_stamp
        self.emitChanges()
        return False
    def beeLeave(self,bee):
        del self.agents[bee.id]
    def emitChanges(self):
        for id, bee in self.agents:
            bee.updateParams(copy.copy(self.parameters),self.last_update)
