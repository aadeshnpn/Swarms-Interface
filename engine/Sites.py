from Site import *
from utils.debug import *



class Sites(list):


    def __init__(self, num_of_sites, goal_x, goal_y, scenario):


        if scenario == Scenario.flank or scenario == Scenario.delayed_flank:
            flankers = 5
            for i in range(num_of_sites):
                if i > flankers: #create main attackers
                    super().append(Site(i, False,  goal_x, goal_y, scenario, False))
                else: #create flankers
                    super().append(Site(i, True, goal_x, goal_y, scenario, False))
                eprint(i)
        else:
            for i in range(num_of_sites):
                super().append(Site(i, False, goal_x, goal_y, scenario, False))

        neutral_site_count = 4

        for i in range(num_of_sites, num_of_sites + neutral_site_count):
            eprint(i)
            super().append(Site(i, False, goal_x, goal_y, scenario, True))

    def to_json(self):
        site_dicts = list()
        for site in self:
            site_dicts.append(site.to_json())
        # eprint(site_dicts)
        return site_dicts
