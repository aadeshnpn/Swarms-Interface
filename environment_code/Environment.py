# Class with methods to read in data about the potential sites in an environment
# and return the Q-value of specific coordinates in that environment
class Environment:

    # Constructor--- contains a parameter for the name of the file with site data
    def __init__(self, file_name):
        self.file_name = file_name
        self.sites = self.read_sites()  # Calls the read_sites function and stores the data from the file in a list

    # Function to return a list of lists, each containing data on a site in the environment
    def read_sites(self):

        sites = []

        with open(self.file_name) as file_in:
            lines = file_in.readlines()

            for x, line in enumerate(lines):
                if x != 0:  # Skip first line (header)
                    site = []
                    for entry in line.split():
                        site.append(float(entry))
                    sites.append(site)

        return sites

    # Function to return the Q-value for given coordinates
    def get_q(self, x, y):

        # Calculate the distance between the coordinates and the center of each site, then compare that distance with
        # the radius of the site
        for site in self.sites:
            x_dif = x - site[0]
            y_dif = y - site[1]
            if x_dif**2 + y_dif**2 <= site[2]**2:
                return site[3]