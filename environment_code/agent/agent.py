from agent.stateMachine.StateMachine import StateMachine
from agent.stateMachine.state import State
from enum import Enum
import numpy as np

# reset velocity of agent at begining of each state transition?

input = Enum('input', 'nestFound exploreTime observeTime dancerFound siteFound tiredDance notTiredDance restingTime')


class Agent(StateMachine):
    def __init__(self, agentId, initialstate):
        self.state = initialstate

        # bee agent variables
        self.live = True
        self.id = agentId  # for communication with environment
        self.location = [0, 0]  # should be initialized?
        self.direction = 2*np.pi*np.random.random()  # should be initilaized? potentially random?
        self.velocity = 1  # should be initilaized?
        self.hub = [0, 0]  # should be initialized?
        self.potential_site = None  # array [x,y]
        self.q_value = 0
        self.assessments = 0

        # create table here.
        dict = {(Exploring().__class__, input.nestFound): [None, Assessing()],
                (Exploring().__class__, input.exploreTime): [None, Observing()],
                (Observing().__class__, input.observeTime): [None, Exploring()],
                (Observing().__class__, input.dancerFound): [None, Assessing()],
                (Assessing().__class__, input.siteFound): [None, Dancing()], # self.danceTransition()
                (Dancing().__class__, input.tiredDance): [None, Resting()],
                (Dancing().__class__, input.notTiredDance): [None, Assessing()],
                (Resting().__class__, input.restingTime): [None, Observing()]
                }
        self.transitionTable = dict

    def sense(self, environment):
        self.state.sense(self, environment)

    def act(self):
        self.state.act(self)

    def update(self, environment):
        self.nextState(self.state.update(self, environment))
    def danceTransition(self,environment):
        pass


# so, the exploring part needs to give the input..
class Exploring(State):
    def __init__(self):
        self.name = "exploring"
        self.exploretime = 3600

    def sense(self, agent, environment):
        new_q = environment.get_q(agent.location[0], agent.location[1])
        agent.q_value = new_q
        #agent.potential_site = [agent.location[0],agent.location[1]]
        #

    def act(self, agent):
        self.move(agent)

    def update(self, agent, environment):
        self.exploretime = self.exploretime - 1
        if ((agent.q_value > 0)):
            agent.potential_site = agent.location
            return input.nestFound
        elif (self.exploretime < 1):
            return input.exploreTime
        else:
            return None

    def move(self,agent):
        delta_d = np.random.normal(0, .3)
        agent.direction = (agent.direction + delta_d) % (2 * np.pi)
        # if (abs(agent.x) >= 100 or abs(agent.y) >= 100):  # turns the bee around
        #     agent.direction -= np.pi
        #new_x = agent.location[0] + (agent.velocity * np.cos(agent.direction))
        #new_y = agent.location[1] + (agent.velocity * np.sin(agent.direction))
        return


class Assessing(State):
    def __init__(self):
        self.name = "assessing"
        self.goingToSite = True

    def sense(self, agent, environment):
        pass

    def act(self, agent):
        self.move(agent)

    def update(self, agent, environment):
          # may need an ID of some sort to get my info from environment

        # if agent is less than distance=1 unit away from potential site, go back to hub
        if ((agent.potential_site[0] - agent.location[0]) ** 2 +
                    (agent.potential_site[1] - agent.location[1]) ** 2 )< 1:
            self.goingToSite = False

        # if agent is less than distance=1 unit away from hub, switch to dancing
        if ((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) < 1:
            return input.siteFound

    def move(self, agent):
        if (self.goingToSite):
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
        self.restCountdown = 1000

    def sense(self, agent, environment):  # probably not needed for now, but can be considered a place holder
        pass

    def act(self, agent):
        if (self.atHub):
            agent.velocity = 0
            self.restCountdown -= 1
        else:
            # if not at hub, more towards it
            self.move(agent)
            if ((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2 <= 1):
                agent.velocity=0
                self.atHub = True

    def update(self, agent, environment):
        if self.restCountdown < 1:
            agent.velocity =1
            return input.restingTime

    def move(self, agent):
        dx = agent.location[0] - agent.hub[0]
        dy = agent.location[1] - agent.hub[1]
        agent.direction = np.arctan2(dy, dx)
        #new_x = agent.location[0] + (agent.velocity * np.cos(agent.direction))
        #new_y = agent.location[1] + (agent.velocity * np.sin(agent.direction))
        return


class Dancing(State):
    def __init__(self):
        self.name = "dancing"  #IMPORTANT!!!!!!!!!!11
        self.dance_counter = 1800 #this dance counter should be determined by the q value and the distance,
                                #we can consider implementing that in the transition.

    def sense(self, agent, environment):
        pass

    def act(self, agent):
        self.move(agent)

    def update(self, agent, environment):
        # info from environment
        if (self.dance_counter == 0):
            if (agent.assessments < 3):
                agent.assessments += 1
                return input.notTiredDance
            else:
                agent.assessments=0
                return input.tiredDance
        else:
            self.dance_counter -= 1

    def move(self, agent):
        agent.direction += 2 * np.pi / 8
        return


class Observing(State):
    def __init__(self):
        self.name = "observing"
        self.observerTimer = 2000
        self.seesDancer = False
        self.atHub = False

    def sense(self, agent, environment):
        # get nearby bees from environment and check for dancers
        if(self.atHub):
            bees = environment.get_nearby_agents(agent.id) #we may need to reformat this so the agent knows what is
            for bee in bees:
                if (isinstance(bee.state, Dancing().__class__)):
                    self.seesDancer = True;
                    agent.potential_site = bee.potential_site
                    break

    def act(self, agent):
        if (self.atHub):
            self.observerTimer -= 1
            self.wander(agent)
        else:
            # if not at hub, more towards it
            self.movehome(agent)
            if ((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2 <= .5):
                self.atHub = True

    def update(self, agent, environment):
        if self.seesDancer is True:
            return input.dancerFound
        elif (self.observerTimer == 0):
            return input.observeTime

    def movehome(self, agent):
        dx =  agent.hub[0] -agent.location[0]
        dy = agent.hub[1]- agent.location[1]
        agent.direction = np.arctan2(dy, dx)
    def wander(self, agent):

        agent.direction += 2 * np.pi / 4
        #new_x = agent.location[0] + (agent.velocity * np.cos(agent.direction))
        #new_y = agent.location[1] + (agent.velocity * np.sin(agent.direction))

        return


#thoughts: we could implement transitions that when each state is implemented the state is passed in the needed values for it's
#operation.  advantage:no need to pass in agent, states hold the values. con: copying values every state transition