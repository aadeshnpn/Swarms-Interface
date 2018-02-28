from Site import Site
from utils.debug import *



class Sites(list):

    def __init__(self, num_of_sites, goal_x, goal_y):
        flankers = 15
        for i in range(num_of_sites):
            if i > flankers: #create main attackers
                super().append(Site(i, False,  goal_x, goal_y))
            else: #create flankers
                super().append(Site(i, True, goal_x, goal_y))

            # super().append(Site(i, False, goal_x, goal_y))



    def to_json(self):
        site_dicts = list()
        for site in self:
            site_dicts.append(site.to_json())
        # eprint(site_dicts)
        return site_dicts
