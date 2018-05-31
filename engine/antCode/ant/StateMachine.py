import copy

class StateMachine:
    def __init__(self, initialState, tranTable, id):
        self.state = initialState
        self.transitionTable = tranTable
        self.id = id

    def nextState(self, input):
        if input is None:
            return
        currState = self.transitionTable[(self.state.__class__, input)]
        self.state = copy.deepcopy(currState[1])        # environment.sort_by_state(self.id, self.state.__class__, currState[1].__class__)


        if currState[0] is not None:
            currState[0]()
        return
        RuntimeError("Input not supported for current state")

    # return a dictionary representing states that should be shown to the user
    # and transitions between them
    # all state machines should override this





                # use a dictionary of lists and iterate through that

# get current state:
#map(key,map(key,--)) possibly use map of keys and lists of lists
# if ( input==(table input)
# we don't need a transition...
# so table: currentState, Input (type accepted..) :
# condition that is accepted, nextState
