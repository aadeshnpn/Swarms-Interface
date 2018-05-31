import random
import time
import numpy as np
import sys
#TODO: blocked attribute for node?
class Node:
    def __init__(self, x, y):
        self.position = (x,y)
        self.neighbors = []

    def __str__(self):
        s = "Node: " + str(self.position) + " , " + "neighbors: "
        for n in self.neighbors:
            s += str(n.position) + ", "
        s = s[0 :len(s) - 1]
        return s

class PheromoneNode(Node):
    def __init__(self, x, y):
        super().__init__(x,y)
        #self.cleared = True #False
        self.lastVisited = 7

    #def incrementIdleTime(self):
    #    self.idleTime += 1

    def setLastVisitedTime(self, time):
        self.lastVisited = time
        
    def markAsVisited(self):
        self.lastVisited = time.time()

class GridMap:
    def __str__(self):
        s = "GridMap: \nDimensions : "
        s += (str(len(self.grid))) + (' , ') + (str(len(self.grid[0])))
        for i in range(len(self.grid)):
            s += ("row: " + str(i))
            for j in range(len(self.grid[i])):
                s += (str(self.grid[i][j].position))
                s += (' , ')
                s += (str(self.grid[i][j].lastVisited))
                s += (' ; ')
            s += (' ')
        return s

    def getNearestNode(self, location):
        d = self.distanceBetweenNodes
        location[0] = np.clip(location[0], self.xmin, self.xmax)
        location[1] = np.clip(location[1], self.ymin, self.ymax)

        n0 = self.grid[ (int)((location[1] - self.ymin) / d)][ (int)((location[0] - self.xmin) / d)]
        n1 = self.grid[ (int)((location[1] - self.ymin) / d + 1)][ (int)((location[0] - self.xmin) / d)]
        n2 = self.grid[ (int)((location[1] - self.ymin) / d)][ (int)((location[0] - self.xmin) / d + 1)]
        n3 = self.grid[ (int)((location[1] - self.ymin) / d + 1)][ (int)((location[0] - self.xmin) / d + 1)]

        nodes = [n0, n1, n2, n3]
        return min(nodes, key = lambda n : np.linalg.norm(np.array(n.position) - np.array(location)))
    def __init__(self, center, halved_radius, manhattan_distance_between_nodes,
        NodeType = Node):
        self.grid = []
        self.xmin = center[0] - halved_radius
        self.ymin = center[1] - halved_radius
        self.xmax = center[0] + halved_radius
        self.ymax = center[1] + halved_radius

        self.distanceBetweenNodes = manhattan_distance_between_nodes

        number_col_nodes = (int)((self.xmax - self.xmin)/manhattan_distance_between_nodes) + 1
        number_row_nodes = (int)((self.ymax - self.ymin)/manhattan_distance_between_nodes) + 1

        #Initialize nodes
        for row_index in range(0, number_row_nodes):
            new_row = []
            for col_index in range(0, number_col_nodes):
                new_x = col_index * manhattan_distance_between_nodes + self.xmin
                new_y = row_index * manhattan_distance_between_nodes + self.ymin
                new_row.append(NodeType(new_x, new_y))
            self.grid.append(new_row)

        #Form connections between neighboring cells
        for row_index in range(0, number_row_nodes):
            for col_index in range(0, number_col_nodes):
                current_node = self.grid[row_index][col_index]
                if(row_index < number_row_nodes - 1):
                    south_node = self.grid[row_index + 1][col_index]
                    current_node.neighbors.append(south_node)
                    south_node.neighbors.append(current_node)
                if(col_index < number_col_nodes - 1):
                    east_node = self.grid[row_index][col_index + 1]
                    current_node.neighbors.append(east_node)
                    east_node.neighbors.append(current_node)

class PheromoneMap(GridMap):
    def __init__(self, center, halved_radius, manhattan_distance_between_nodes):
        super().__init__(center, halved_radius,manhattan_distance_between_nodes,
        NodeType = PheromoneNode)

    #TODO:Sharing functions
    def __str__(self):
        return super().__str__()

    def merge(self, other_map):
        num_rows = len(self.grid)
        num_cols = len(self.grid[0])
        for i in range(0, num_rows):
            for j in range(0, num_cols):
                this_lastVisit = self.grid[i][j].lastVisited
                other_lastVisit = other_map.grid[i][j].lastVisited
                mostRecentVisit = max(this_lastVisit,other_lastVisit)
                self.grid[i][j].lastVisited= mostRecentVisit
                other_map.grid[i][j].lastVisited = mostRecentVisit


def main():
    gm = GridMap([0,0] , 1000, 100)
    for i in range(len(gm.grid)):
        print("row: " + str(i))
        for j in range(len(gm.grid[i])):
            sys.stdout.write(str(gm.grid[i][j].position))
            sys.stdout.write(' ')
            sys.stdout.flush()
        print(' ')

    print("getNearestNode test: ")
    n1 = gm.getNearestNode((-999,-999))
    print(n1.position)
    n1 = gm.getNearestNode((-901,-999))
    print(n1.position)
    n1 = gm.getNearestNode((-999,-901))
    print(n1.position)
    n1 = gm.getNearestNode((0,51))
    print(n1.position)

if __name__ == '__main__':
    main()
'''
    def incrementMapIdleTimes(self):
        for i in range(0, len(self.grid):
            for j in range(0, len(self.grid[i]):
                self.grid[i][j].incrementIdleTime()
'''
'''
        self.frontier = set()
        self.frontier.add(self.grid[5][5])



    #Without replacement
    def getRandomNodeFromFrontier(self):
        if(len(self.frontier) == 0):
            return None
        node = random.sample(self.frontier, 1)[0]
        self.frontier.remove(node)
        return node


    def markNodeVisited(self, node):
        node.idleTime = 0

    def clearNode(self, node):
        node.cleared = True
        for neighbor in node.neighbors:
            if(neighbor.cleared is False):
                self.frontier.add(neighbor)
'''
