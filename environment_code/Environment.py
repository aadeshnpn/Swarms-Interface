__author__ = "Nathan Anderson"


# Class with methods to read in data about the potential sites in an environment
# and return the Q-value of specific coordinates in that environment
class Environment:

    # Constructor--- the class contains a parameter which is the name of the file with site data
    def __init__(self, file_name, x_limit, y_limit):
        self.file_name = file_name
        self.x_limit = x_limit
        self.y_limit = y_limit
        self.hub = [0, 0, 1]
        self.sites = []
        self.obstacles = []
        self.build_environment  # Calls the read_sites function and stores the data from the file in a list

    # Function to return a list of lists, each containing data on a site in the environment
    @property
    def build_environment(self):

        new_hub = []
        new_sites = []
        new_obstacles = []

        with open(self.file_name, encoding='utf-8', errors='ignore') as file_in:
            lines = file_in.readlines()
            hub_flag = False
            site_flag = False
            obstacle_flag = False

            for line in lines:
                if line[0] == "X":
                    pass
                elif line == "\n":
                    hub_flag = False
                    site_flag = False
                elif obstacle_flag is True:
                    obstacle = []
                    for entry in line.split():
                        obstacle.append(float(entry))
                    new_obstacles.append(obstacle)

                    assert abs(obstacle[0] + obstacle[2]) < self.x_limit and abs(obstacle[1] + obstacle[2]) < self.y_limit, "Not all obstacles are inside Environment boundaries"

                elif site_flag is True:
                    site = []
                    for entry in line.split():
                        site.append(float(entry))
                    new_sites.append(site)

                    assert abs(site[0] + site[2]) <= self.x_limit and abs(site[1] + site[2]) <= self.y_limit, "Not all sites are inside Environment boundaries"

                elif hub_flag is True:
                    for entry in line.split():
                        new_hub.append(float(entry))
                    hub_flag = False

                if line == "Hub\n":
                    hub_flag = True
                elif line == "Sites\n":
                    site_flag = True
                elif line == "Obstacles\n":
                    obstacle_flag = True

            self.hub = new_hub
            self.sites = new_sites
            self.obstacles = new_obstacles

    # Function to return the Q-value for given coordinates
    def get_q(self, x, y):

        if x > self.x_limit or y > self.y_limit:
            return "Invalid coordinates"
        # Calculate the distance between the coordinates and the center of each site, then compare that distance with
        # the radius of the site
        for site in self.sites:
            x_dif = x - site[0]
            y_dif = y - site[1]
            if x_dif**2 + y_dif**2 <= site[2]**2:
                return site[3]

        for obstacle in self.obstacles:
            x_dif = x - obstacle[0]
            y_dif = y - obstacle[1]
            if x_dif**2 + y_dif**2 <= obstacle[2]**2:
                return -1
