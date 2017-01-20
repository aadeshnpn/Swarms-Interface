import copy

class StateMachine:
    def __init__(self, initialState, tranTable, id):
        self.state = initialState
        self.transitionTable = tranTable
        self.id = id

    def nextState(self, input, environment):
        if input is None:
            return
        currState = self.transitionTable[(self.state.__class__, input)]
        environment.sort_by_state(self.id, self.state.__class__, currState[1].__class__)
        self.state = copy.copy(currState[1])

        if currState[0] is not None:
            currState[0](environment)
        return
        RuntimeError("Input not supported for current state")




                # use a dictionary of lists and iterate through that

# get current state:
#map(key,map(key,--)) possibly use map of keys and lists of lists
# if ( input==(table input)
# we don't need a transition...
# so table: currentState, Input (type accepted..) :
# condition that is accepted, nextState

