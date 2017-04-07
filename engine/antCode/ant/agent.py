from enum import Enum

from .StateMachine import StateMachine
from .state import State

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
class waiting(State):
    pass
class searching(State):
    pass
class following(State):
    pass
class exploiting(State):
    pass
class recruiting(State):
    pass