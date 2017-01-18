from agent.stateMachine.StateMachine import StateMachine
from agent.stateMachine.state import State
from enum import Enum
import numpy as np

# reset velocity of agent at begining of each state transition?

input = Enum('input', 'nestFound exploreTime observeTime dancerFound siteFound tiredDance notTiredDance restingTime siteAssess finAssess startPipe quorum')


class Agent(StateMachine):

    def sense(self, environment):
        self.state.sense(self, environment)

    def act(self):
        self.state.act(self)

    def update(self):
        self.nextState(self.state.update(self))
    def danceTransition(self):
        dance = int(self.q_value*1000-(200*self.assessments))
        if dance < 15 :
            self.assessments = 1
            self.potential_site = None
            self.nextState(input.tiredDance)
        else:
            self.state.dance_counter = dance

    def __init__(self, agentId, initialstate):
        self.state = initialstate

        # bee agent variables
        self.live = True
        self.id = agentId  # for communication with environment
        self.location = [0, 0]  # should be initialized?
        self.direction = 2*np.pi*np.random.random()  # should be initilaized? potentially random?
        # self.direction = np.pi/2
        self.velocity = .5*np.random.random() + .75  # should be initilaized?
        self.hub = [0, 0]  # should be initialized?
        self.potential_site = None  # array [x,y]
        self.q_value = 0
        self.assessments = 1
        self.hubRadius = 20
        self.goingToSite = True
        self.pipingThreshold = 10

        # create table here.
        dict = {(Exploring().__class__, input.nestFound): [None, Assessing()],
                (Exploring().__class__, input.exploreTime): [None, Observing()],
                (Observing().__class__, input.observeTime): [None, Exploring()],
                (Observing().__class__, input.dancerFound): [None, Assessing()],
                (Observing().__class__, input.startPipe): [None, Piping()],
                (Assessing().__class__, input.siteFound): [self.danceTransition, Dancing()], # self.danceTransition()
                (Assessing().__class__, input.siteAssess): [None, SiteAssess()],
                (SiteAssess().__class__, input.finAssess): [None, Assessing()],
                (SiteAssess().__class__, input.startPipe): [None, Piping()],
                (Dancing().__class__, input.tiredDance): [None, Resting()],
                (Dancing().__class__, input.notTiredDance): [None, Assessing()],
                (Resting().__class__, input.restingTime): [None, Observing()],
                (Piping().__class__, input.quorum): [None, Commit()]
                }
        self.transitionTable = dict

# so, the exploring part needs to give the input..
class Exploring(State):
    def __init__(self):
        self.name = "exploring"
        self.inputExplore = False
        exp = np.random.normal(1, .3, 1)
        while exp  < 0:
            exp = np.random.normal(1, .3, 1)
        self.exploretime = exp*3600

    def sense(self, agent, environment):
        new_q = environment.get_q(agent.location[0], agent.location[1])
        agent.q_value = new_q
        #

    def act(self, agent):
        self.move(agent)

    def update(self, agent):
        self.exploretime = self.exploretime - 1
        if agent.q_value > 0:
            agent.potential_site = [agent.location[0], agent.location[1]]
            return input.nestFound
        elif self.exploretime < 1:
            return input.exploreTime
        else:
            return None

    def move(self,agent):
        if self.inputExplore: #this is for when the user has requested more bees
            delta_d = np.random.normal(0, .013) # this will assure that the bee moves less erratically, it can be decreased a little as well
        else:
            delta_d = np.random.normal(0, .22)
        agent.direction = (agent.direction + delta_d) % (2 * np.pi)

        return


class Assessing(State):
    def __init__(self):
        self.name = "assessing"

    def sense(self, agent, environment):
        pass

    def act(self, agent):
        self.move(agent)

    def update(self, agent):
        if (((agent.hub[0] - agent.location[0]) ** 2 + (
                agent.hub[1] - agent.location[1]) ** 2) ** .5 < agent.hubRadius) and (agent.goingToSite is False):
            agent.goingToSite = True
            return input.siteFound
        elif ((agent.potential_site[0] - agent.location[0]) ** 2 + (
                agent.potential_site[1] - agent.location[1]) ** 2) < 1 and (agent.goingToSite is True):
            agent.goingToSite = False
            return input.siteAssess

    def move(self, agent):
        if agent.goingToSite:
            dx = agent.potential_site[0] - agent.location[0]
            dy = agent.potential_site[1] - agent.location[1]
            agent.direction = np.arctan2(dy, dx)
        else:
            dx = agent.hub[0] - agent.location[0]
            dy = agent.hub[1] - agent.location[1]
            agent.direction = np.arctan2(dy, dx)
        return


class Resting(State):
    def __init__(self):
        self.name = "resting"
        self.atHub = True  #we may not need this code at all... to turn it on make it default false.
        self.restCountdown = 210

    def sense(self, agent, environment):
        pass

    def act(self, agent):
        if self.atHub:
            agent.velocity = 0
            self.restCountdown -= 1
        else:
            # if not at hub, more towards it
            self.move(agent)
            if ((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2)**.5 <= 1:
                agent.velocity = 0
                self.atHub = True

    def update(self, agent):
        if self.restCountdown < 1:
            agent.velocity = 1
            return input.restingTime

    def move(self, agent):
        dx = agent.location[0] - agent.hub[0]
        dy = agent.location[1] - agent.hub[1]
        agent.direction = np.arctan2(dy, dx)
        return


class Dancing(State):
    def __init__(self):
        self.name = "dancing"
        self.dance_counter = 700 #this dance counter should be determined by the q value and the distance,
                                #we can consider implementing that in the transition.

    def sense(self, agent, environment):
        pass

    def act(self, agent):
        self.move(agent)

    def update(self, agent):
        # info from environment
        if self.dance_counter < 1:
            agent.assessments += 1
            return input.notTiredDance

        else:
            self.dance_counter -= 1

    def move(self, agent):
        if ((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2)**.5 >= agent.hubRadius:
            dx = agent.hub[0] - agent.location[0]
            dy = agent.hub[1] - agent.location[1]
            agent.direction = np.arctan2(dy, dx)
        else:
            delta_d = np.random.normal(0, .3)
            agent.direction = (agent.direction + delta_d) % (2 * np.pi)
        return


class Observing(State):
    def __init__(self):
        self.name = "observing"
        self.observerTimer = 2000
        self.seesDancer = False
        self.atHub = False
        self.seesPiper = False

    def sense(self, agent, environment):
        # get nearby bees from environment and check for dancers
        if self.atHub:
            bees = environment.get_nearby_agents(agent.id, 2)  # we may need to reformat this so the agent knows what is
            for bee in bees:
                if isinstance(bee.state, Piping().__class__):
                    self.seesPiper = True
                    agent.velocity = 0.5 + 0.5 * np.random.random()
                    agent.potential_site = bee.potential_site
                    break
                if isinstance(bee.state, Dancing().__class__):
                    self.seesDancer = True
                    agent.velocity = 0.5 + 0.5 * np.random.random()
                    agent.potential_site = bee.potential_site
                    break

    def act(self, agent):
        if self.atHub:
            self.observerTimer -= 1
            if self.observerTimer == 0:
                agent.velocity = 0.5 + 0.5 * np.random.random()
            self.wander(agent)
        else:
            # if not at hub, more towards it
            self.movehome(agent)
            if ((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 <= 1.1:
                # 1.1 prevents moving back and forth around origin
                self.atHub = True
                agent.direction += -89 + 179 * np.random.random()
                agent.velocity = agent.hubRadius / 20.0

    def update(self, agent):
        if self.seesPiper is True:
            return input.startPipe
        if self.seesDancer is True:
            return input.dancerFound
        elif self.observerTimer < 1:
            return input.observeTime

    def movehome(self, agent):
        dx = agent.hub[0] - agent.location[0]
        dy = agent.hub[1] - agent.location[1]
        agent.direction = np.arctan2(dy, dx)

    def wander(self, agent):
        if ((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 >= agent.hubRadius:
            dx = agent.hub[0] - agent.location[0]
            dy = agent.hub[1] - agent.location[1]
            agent.direction = np.arctan2(dy, dx)
        else:
            delta_d = np.random.normal(0, .3)
            agent.direction = (agent.direction + delta_d) % (2 * np.pi)

        return


#thoughts: we could implement transitions that when each state is implemented the state is passed in the needed values for it's
#operation.  advantage:no need to pass in agent, states hold the values. con: copying values every state transition

# Code for site convergence (Chace A.) VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

class SiteAssess(State):
    def __init__(self):
        self.name = "site assess"
        self.counter = 300
        self.siteRadius = 10  # set arbitrarily for now
        self.thresholdPassed = False

    def check_num_close_assessors(self, agent, environment):
        """Check if number of local bees assessing current site exceeds threshold for piping"""
        bees = environment.get_nearby_agents(agent.id, self.siteRadius)  # we may need to reformat this
        if len(bees) >= agent.pipingThreshold:
            return True
        else:
            return False

    def sense(self, agent, environment):
        if self.check_num_close_assessors(agent, environment):
            self.thresholdPassed = True

    def act(self, agent):
        self.move(agent)

    def update(self, agent):
        # check for piping threshold passed
        if self.thresholdPassed:
            pass
            return input.startPipe
        # counter functions
        if self.counter < 1:
            return input.finAssess
        else:
            self.counter -= 1

    def move(self, agent):
        if ((agent.potential_site[0] - agent.location[0]) ** 2
                + (agent.potential_site[1] - agent.location[1]) ** 2) ** .5 >= self.siteRadius:
            dx = agent.potential_site[0] - agent.location[0]
            dy = agent.potential_site[1] - agent.location[1]
            agent.direction = np.arctan2(dy, dx)
        else:
            delta_d = np.random.normal(0, .3)
            agent.direction = (agent.direction + delta_d) % (2 * np.pi)
        return

class Piping(State):
    def __init__(self):
        self.name = "piping"
        self.pipe_counter = 1000  # should be sufficiently long to get as much of the nest as possible
        self.quorum = False

    def neighbors_piping(self, agent, environment):
        """Check if all neighboring bees are piping

            Could need to be modified to address corner cases - like when no bees are the hub due to
            exploration or quoruming
        """
        if ((agent.hub[0] - agent.location[0]) ** 2 + (
            agent.hub[1] - agent.location[1]) ** 2) ** .5 <= agent.hubRadius:
            bees = environment.get_nearby_agents(agent.id, 10)  # we may need to reformat this
            for bee in bees:
                if not isinstance(bee.state, Piping.__class__):
                    return
            self.quorum = True

        return

    def sense(self, agent, environment):
        self.neighbors_piping(agent, environment)

    def act(self, agent):
        self.move(agent)

    def update(self, agent):
        # info from environment
        if self.pipe_counter > 1:
            self.pipe_counter -= 1
        else:
            if self.quorum is True:
                agent.hub = agent.potential_site
                return input.quorum

    def move(self, agent):
        if ((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2)**.5 \
                >= agent.hubRadius:
            dx = agent.hub[0] - agent.location[0]
            dy = agent.hub[1] - agent.location[1]
            agent.direction = np.arctan2(dy, dx)
        else:
            delta_d = np.random.normal(0, .3)
            agent.direction = (agent.direction + delta_d) % (2 * np.pi)
        return


class Commit(State):
    def __init__(self):
        self.name = "commit"
        self.atHub = False  # we may not need this code at all... to turn it on make it default false.

    def sense(self, agent, environment):  # probably not needed for now, but can be considered a place holder
        pass

    def act(self, agent):
        if self.atHub:
            pass
        else:
            # if not at hub, more towards it
            self.move(agent)
            if ((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 <= 1:
                agent.velocity = 0
                self.atHub = True

    def update(self, agent):
        pass

    def move(self, agent):
        dx = -agent.location[0] + agent.hub[0]
        dy = -agent.location[1] + agent.hub[1]
        agent.direction = np.arctan2(dy, dx)
        return


# End site convergence states ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^