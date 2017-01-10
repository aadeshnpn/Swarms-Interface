import copy

class StateMachine:
    def __init__(self, initialState, tranTable):
        self.state = initialState
        self.transitionTable = tranTable

    def nextState(self, input):
        if input is None:
            return
        currState = self.transitionTable[(self.state.__class__, input)]

        self.state = copy.copy(currState[1])
        if currState[0] is not None:
            currState[0]()
        return
        RuntimeError("Input not supported for current state")




                # use a dictionary of lists and iterate through that

# get current state:
#map(key,map(key,--)) possibly use map of keys and lists of lists
# if ( input==(table input)
# we don't need a transition...
# so table: currentState, Input (type accepted..) :
# condition that is accepted, nextState

