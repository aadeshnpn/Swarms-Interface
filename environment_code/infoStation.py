

class InfoStation:

    def __init__(self):
        self.bee_count = 0

        self.parameters = {"PipingThreshold":       12,
                           "Velocity":              2,
                           "ExploreTime":           3625,
                           "RestTime":              450,
                           "DanceTime":             1150,
                           "ObserveTime":           2000,
                           "SiteAssessTime":        235,
                           "SiteAssessRadius":      15,
                           "PipingTime":            1200}

        # last_update starts with negative value, so that the first bee at the station sets the initial parameter values
        self.last_update = -1

    # An agent passes in its current parameters and the timestamp when it received these
    # parameters from the hub. If the timestamp is more recent, update the params in the infostation and return
    # False, otherwise return True so the bee knows it needs to update its params.
    def check_for_changes(self, new_parameters, time_stamp):
        if time_stamp < self.last_update:
            return True
        elif time_stamp == self.last_update:
            return False
        self.parameters = new_parameters
        self.last_update = time_stamp
        return False
