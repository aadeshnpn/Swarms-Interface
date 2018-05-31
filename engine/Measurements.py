import numpy as np
from scipy.sparse import dok_matrix
import networkx as nx

def distance(a,b):
	return np.sqrt((b[0]-a[0])**2 + (b[1]-a[1])**2)

class Measurements:
    """
    Class containing data structures and methods needed to compute connectedness and dispersion metrics for
    the honey bee colony nest selection task.
    """

    def __init__(self, proximity_constant):
        """
        :param proximity_constant: (float), how close agents have to be in order to be connected in the dispersion
                graph
        """
        self.close_dist = proximity_constant

        self.swarm_sizes = []
        self.connections_measure = [] # = (num connections in graph)/(total possible connections in graph)
        self.avg_clustering_measure = [] # uses networkx.average_clustering()

    def compute_measurements(self, agents):
        """
        Compute the connectedness and average clustering measurements for the agent by constructing the connectedness
        graph and performing necessary computations.

        Computes upper half of matrix by testing if agents are in the same state and close 'enough' together, since
        the graph is undirected, the graph is symmetric, and the lower half is filled in automatically.

        :param agents: (dictionary of agents)
        :return: (NoneType)
        """

        agents_list = list(agents)
        num_agents = len(agents_list)
        G = dok_matrix((num_agents, num_agents), dtype=int)
        for i in range(num_agents):
            for j in range(i+1, num_agents):
                if (agents_list[i].state.__class__ == agents_list[j].state.__class__
                        and distance(agents_list[i].location, agents_list[j].location) < self.close_dist):
                    # if (agents_list[i].state.__class__ != agents_list[j].state.__class__
                    #     or np.sqrt((agents_list[i].location[0] - agents_list[j].location[0]) ** 2 + (
                    #         agents_list[i].location[1] - agents_list[j].location[1]) ** 2) > self.close_dist):
                    G[i, j] = 1
                    G[j, i] = 1

        self.swarm_sizes.append(num_agents)
        self.connections_measure.append(G.sum()/num_agents**2)
        self.avg_clustering_measure.append(nx.average_clustering(nx.from_scipy_sparse_matrix(G)))