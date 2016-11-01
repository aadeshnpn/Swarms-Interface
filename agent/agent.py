from stateMachine.StateMachine import StateMachine
from stateMachine.state import State

State.exploring = State("Exploring")
State.assessing = State("Assessing")
State.dancing = State("Dancing")
State.resting = State("Resting")
State.observing = State("Observing")

class Agent(StateMachine):

    def __init__(self, initialstate):
        self.state = initialstate
        #create table here.
    def update(self):
        if self.state.update():
            self.nextState(State.giveInput())


#so, the exploring part needs to give the input..
class Exploring(State):
    def __init__(self,name):
        self.name = name
        self.hive = False
    def giveInput(self):
        return self.hive
    def update(self):
        return False
class Assessing(State):
