from stateMachine.StateMachine import StateMachine
from stateMachine.state import State
from enum import Enum

input = Enum('input', 'nestFound exploreTime observeTime dancerFound siteFound tiredDance notTiredDance restingTime')
class Agent(StateMachine):

    def __init__(self, initialstate):
        self.state = initialstate
        #create table here.
        dict ={(Exploring().__class__, input.nestFound) : [None, Assessing()],
               (Exploring().__class__, input.exploreTime) : [None, Observing()],
               (Observing().__class__, input.observeTime) : [None, Exploring()],
               (Observing().__class__, input.dancerFound) : [None, Assessing()],
               (Assessing().__class__, input.siteFound) : [None, Dancing()],
               (Dancing().__class__,   input.tiredDance) : [None, Resting()],
               (Dancing().__class__,   input.notTiredDance) : [None, Assessing()],
               (Resting().__class__,   input.restingTime)  : [None, Observing()]
               }
        self.transitionTable = dict
    def update(self):
        self.nextState(self.state.update())


#so, the exploring part needs to give the input..
class Exploring(State):
    def __init__(self):
        self.name = "exploring"
        self.nest = 0
        self.exploretime=2

    def update(self):
        self.exploretime = self.exploretime-1
        if ((self.nest > 0)):
            return input.nestFound
        elif (self.exploretime < 1):
            return input.exploreTime
        else:
            return None


class Assessing(State):
    def __init__(self):
        self.name = "assessing"

    def update(self):
        return input.siteFound


class Resting(State):
    def __init__(self):
        self.name = "resting"
        self.restCountdown = 2
    def update(self):
        if self.restCountdown < 1:
            return input.restingTime

class Dancing(State):
    def __init__(self):
        self.name = "dancing"
    def update(self):
        return input.tiredDance


class Observing(State):
    def __init__(self):
        self.name = "observing"
        self.explorerTimer = 2
        self.seesDancer = False
    def update(self):
        if(self.explorerTimer < 1):
            return input.observeTime
        elif self.seesDancer is True:
            return input.dancerFound
