import random
import time
#TODO: blocked attribute for node?
class Node:
    def __init__(self, x, y):
        self.position = (x,y)
        self.neighbors = []

class PheromoneNode(Node):
    def __init__(self, x, y):
        super().__init__(x,y)
        #self.cleared = True #False
        self.lastVisited = 0

    #def incrementIdleTime(self):
    #    self.idleTime += 1

    def markAsVisited(self):
        self.idleTime = time.time()

class GridMap:
    def __init__(self, center, halved_radius, manhattan_distance_between_nodes,
        NodeType = Node):
        self.grid = []
        self.xmin = center[0] - halved_radius
        self.ymin = center[1] - halved_radius
        self.xmax = center[0] + halved_radius
        self.ymax = center[1] + halved_radius

        number_col_nodes = (int)((self.xmax - self.xmin)/manhattan_distance_between_nodes)
        number_row_nodes = (int)((self.ymax - self.ymin)/manhattan_distance_between_nodes)

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
