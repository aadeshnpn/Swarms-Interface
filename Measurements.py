import numpy as np
from scipy.sparse import dok_matrix
import networkx as nx
import matplotlib.pyplot as plt
import os


def distance(a, b):
    return np.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2)


class Measurements:
    """
    Class containing data structures and methods needed to compute connectedness and dispersion metrics for
    the honey bee colony nest selection task.
    :param proximity_constant: (float), how close agents have to be in order to be connected in the dispersion
            graph
    """

    def __init__(self, proximity_constant, nme):
        self.close_dist = proximity_constant
        self.swarm_sizes = []
        self.connections_measure = []  # = (num connections in graph)/(total possible connections in graph)
        self.avg_clustering_measure = []  # uses networkx.average_clustering()
        self.influence = []

        #keep self.measurments at 4 or less for graphing purposes
        self.measurements = {"swarm_sizes": self.swarm_sizes, "connections_measure": self.connections_measure,
                             "avg_clustering_measure": self.avg_clustering_measure, "influence": self.influence}
        #Use another one instead

        self.measurements2 = {}
        self.name = nme
        self.xPos = None
        self.yPos = None
        self.states = None
        self.ticks = None
        self.influenceMean = 0
        self.connectionMean = 0
        self.clusteringMean = 0



    def update(self,name,close_dist,xPos,yPos,states,tickTotal, influence):
        self.xPos = xPos
        self.yPos = yPos
        self.name = name
        self.close_dist = close_dist
        self.states = states
        self.ticks = tickTotal
        self.influence =influence
        self.measurements["influence"]= self.influence
    def reset(self):
        self.swarm_sizes = []
        self.connections_measure = []  # = (num connections in graph)/(total possible connections in graph)
        self.avg_clustering_measure = []  # uses networkx.average_clustering()
        self.influence = []
        self.measurements["influence"] = self.influence
        self.influenceMean = 0
        self.connectionMean = 0
        self.clusteringMean = 0

    def f1(self, matrix):
        return matrix*self.swarm_sizes

    def f2(self, matrix):
        return np.power(matrix,self.swarm_sizes)



    def compute_measurements(self, xlist, ylist, stateList):
        """
        Compute the connectedness and average clustering measurements for the agent by constructing the connectedness
        graph and performing necessary computations.

        Computes upper half of matrix by testing if agents are in the same state and close 'enough' together, since
        the graph is undirected, the graph is symmetric, and the lower half is filled in automatically.

        :param agents: (dictionary of agents)
        :return: (NoneType)
        """

        num_agents = len(xlist)
        G = dok_matrix((num_agents, num_agents), dtype=int)
        G2 = dok_matrix((num_agents, num_agents), dtype=int)
        for i in range(num_agents):
            for j in range(i + 1, num_agents):
                if stateList[i] == stateList[j] and (
                np.sqrt((xlist[i] - xlist[j]) ** 2 + (ylist[i] - ylist[j]) ** 2)) < self.close_dist:
                    G[i, j] = 1
                    G[j, i] = 1
                # if (stateList[i] != stateList[j] or np.sqrt((xlist[i] - xlist[j]) ** 2 + (ylist[i] - ylist[j]) ** 2) > self.close_dist):
                #     G2[i,j] = 1
                #     G2[i,j] = 1
        self.swarm_sizes.append(num_agents)
        self.connections_measure.append(G.sum() / num_agents ** 2)
        self.avg_clustering_measure.append(nx.average_clustering(nx.from_scipy_sparse_matrix(G)))

    def GraphComputeAllMeasurements(self):
        # TODO check to make sure that they match up.
        for i in range(self.ticks):
            self.compute_measurements(self.xPos[i], self.yPos[i], self.states[i])
        print('completed measurements, graphing now')
        self.connections_measure = self.f1(np.array(self.connections_measure))
        self.avg_clustering_measure = self.f1(np.array(self.avg_clustering_measure))

        self.connectionMean = np.mean(self.connections_measure)
        self.clusteringMean = np.mean(self.avg_clustering_measure)
        self.influenceMean = np.mean(self.influence)

        #TODO somehow figure out how to run these functions on the numpy arrays
        #TODO calculate the averages of each simulation.


        # if not os.path.exists(self.name):
        #     os.makedirs(self.name)
        x = np.linspace(1, self.ticks, self.ticks)
        self.plot(x, self.measurements, self.name)
        if len(self.measurements2) > 0:
            print('doing measurements 2')
            self.plot(x, self.measurements2, self.name)
        print("clustering mean: ", self.clusteringMean)
        print("influence mean: ", self.influenceMean)
        print("connection mean: ", self.connectionMean)

        self.reset()

        # up to 4 plots, x represents ticks, y is a dictionary, key is label, value is list of y values
    def plot(self, x, data, name):
        i = 1
        plt.figure(1)
        for label, y in data.items():
            # print(label)
            # print(len(x))
            # print(len(y))
            plt.subplot(220 + i)
            plt.plot(x, y)
            plt.ylabel(label)
            i += 1

        plt.suptitle(name)
        plt.savefig('data/' + self.name)

        plt.show()
        plt.cla()  # which clears data but not axes
        plt.clf()  # which clears data and axes
