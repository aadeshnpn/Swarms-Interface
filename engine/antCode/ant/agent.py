from .stateMachine import state
from .stateMachine import StateMachine
from enum import Enum

input = Enum('input', 'startFollowing getLost1 getLost2 startSearching stopSearching discover join retire arrive stopRecruiting startRecruiting')

class agent(StateMachine):
    def __init__(self):
        dict = {(waiting(self).__class__, input.startSearching): [None, searching(self)],
                (waiting(self).__class__, input.join): [None, exploiting(self)],
                (waiting(self).__class__, input.startFollowing): [None, following(self)],
                (searching(self).__class__, input.discover): [None, exploiting(self)],
                (searching(self).__class__, input.stopSearching): [None, waiting(self)],
                (exploiting(self).__class__, input.retire): [None, waiting(self)],
                (exploiting(self).__class__, input.startRecruiting): [None, recruiting(self)],
                (exploiting(self).__class__, input.getLost1): [None, searching(self)],
                (recruiting(self).__class__, input.stopRecruiting): [None, exploiting(self)],
                (following(self).__class__, input.arrive): [None, exploiting(self)],
                (following(self).__class__, input.getLost1): [None, waiting(self)],
                (following(self).__class__, input.getLost2): [None, searching(self)],
                }
class waiting(state):
    pass
class searching(state):
    pass
class following(state):
    pass
class exploiting(state):
    pass
class recruiting(state):
    pass