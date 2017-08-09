import random

#TODO: blocked attribute for node?
class Node:
    def __init__(self, x, y):
        self.position = (x,y)
        self.neighbors = []
        self.cleared = False

class ContaminationMap:
    def __init__(self, center, halved_radius, manhattan_distance_between_nodes):
        self.grid = []
        xmin = center[0] - halved_radius
        ymin = center[1] - halved_radius
        xmax = center[0] + halved_radius
        ymax = center[1] + halved_radius

        number_col_nodes = (int)((xmax - xmin)/manhattan_distance_between_nodes)
        number_row_nodes = (int)((ymax - ymin)/manhattan_distance_between_nodes)

        #Initialize nodes
        for row_index in range(0, number_row_nodes):
            new_row = []
            for col_index in range(0, number_col_nodes):
                new_x = col_index * manhattan_distance_between_nodes + xmin
                new_y = row_index * manhattan_distance_between_nodes + ymin
                new_row.append(Node(new_x, new_y))
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

        self.frontier = set()
        self.frontier.add(self.grid[5][5])

        self.xmin = center[0] - halved_radius
        self.ymin = center[1] - halved_radius
        self.xmax = center[0] + halved_radius
        self.ymax = center[1] + halved_radius

    #Without replacement
    def getRandomNodeFromFrontier(self):
        if(len(self.frontier) == 0):
            return None
        node = random.sample(self.frontier, 1)[0]
        self.frontier.remove(node)
        return node

    def clearNode(self, node):
        node.cleared = True
        for neighbor in node.neighbors:
            if(neighbor.cleared is False):
                self.frontier.add(neighbor)
