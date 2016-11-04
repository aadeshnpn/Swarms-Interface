from stateMachine.Condition import Condition


class StateMachine:
    def __init__(self, initialState, tranTable):
        self.state = initialState
        self.transitionTable = tranTable

    def nextState(self, input):
        if input is None:
            return
        currState = self.transitionTable[(self.state.__class__, input)]
#currState: input, condition,  nextState
        #for k, v in currState.items():
         #   if ((input == k) | (input.getClass() == k)):
        if currState[0] is not None:
            c = Condition(currState[0])  # not sure if this is correct... typecsting
            if c.condition(input) == False:
                return #exits because condituion not true
                        #some way to break out of loop
        self.state = currState[1]
        return
        RuntimeError("Input not supported for current state")




                # use a dictionary of lists and iterate through that

# get current state:
#map(key,map(key,--)) possibly use map of keys and lists of lists
# if ( input==(table input)
# we don't need a transition...
# so table: currentState, Input (type accepted..) :
# condition that is accepted, nextState

