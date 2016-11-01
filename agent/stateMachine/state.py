class State:

    def __init__(self,name):
        self.name = name

    def __str__(self):
        return self.name
    def update(self):
        return False