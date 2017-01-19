from agent.stateMachine.StateMachine import StateMachine
from agent.stateMachine.state import State
from enum import Enum
import numpy as np
# reset velocity of agent at begining of each state transition?

input = Enum('input', 'nestFound exploreTime observeTime dancerFound siteFound tiredDance notTiredDance restingTime')

#safe_angle returns the angle needed to be added to a to get b
def safe_angle(a, b):
    angle = np.arctan2(b[1], b[0]) - np.arctan2(a[1], a[0])
    while angle > np.pi:
        angle -= 2 * np.pi
    while angle < -np.pi:
        angle += 2 * np.pi
    return angle

def distance(a,b):
	return np.sqrt((b[0]-a[0])**2 + (b[1]-a[1])**2)

class Agent(StateMachine):

    def sense(self, environment):
        self.state.sense(self, environment)

    def act(self):
        self.state.act(self)

    def update(self):
        self.nextState(self.state.update(self))
    def danceTransition(self):
        self.state.dance_counter = self.q_value*1000

    def __init__(self, agentId, initialstate):
        self.state = initialstate

        # bee agent variables
        self.live = True
        self.id = agentId  # for communication with environment
        self.location = [0, 0]  # should be initialized?
        self.direction = 2*np.pi*np.random.random()  # should be initilaized? potentially random?
        self.velocity = .5*np.random.random() + .75  # should be initilaized?
        self.hub = [0, 0]  # should be initialized?
        self.potential_site = None  # array [x,y]
        self.q_value = 0
        self.assessments = 0
        self.hubRadius = 20

        # create table here.
        dict = {(Exploring().__class__, input.nestFound): [None, Assessing()],
                (Exploring().__class__, input.exploreTime): [None, Observing()],
                (Observing().__class__, input.observeTime): [None, Exploring()],
                (Observing().__class__, input.dancerFound): [None, Assessing()],
                (Assessing().__class__, input.siteFound): [self.danceTransition, Dancing()], # self.danceTransition()
                (Dancing().__class__, input.tiredDance): [None, Resting()],
                (Dancing().__class__, input.notTiredDance): [None, Assessing()],
                (Resting().__class__, input.restingTime): [None, Observing()]
                }
        self.transitionTable = dict

        self.attractor = None
        self.attracted = None

        self.repulsor = None
        self.ignore_repulsor = None

# so, the exploring part needs to give the input..
class Exploring(State):
    def __init__(self):
        self.name = "exploring"
        exp = np.random.normal(1, .3, 1)
        while exp  < 0:
            exp = np.random.normal(1, .3, 1)
        self.exploretime = exp*3600

    def sense(self, agent, environment):
        new_q = environment.get_q(agent.location[0], agent.location[1])
        agent.q_value = new_q

        agent.attractor = environment.getAttractor()
        if(agent.attractor is not None and agent.attracted is None):
            if(np.random.random () > .2):
                agent.attracted = True
            else:
                agent.attracted = False


        agent.repulsor = environment.getRepulsor()
        if(agent.repulsor is not None and agent.ignore_repulsor is None):
            if(np.random.random() >.9):
                 agent.ignore_repulsor = True
            else:
                 agent.ignore_repulsor = False
            


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

        if(agent.attractor is not None and distance(agent.attractor, agent.location) < 40 and agent.attracted is True):
                angle = safe_angle((np.cos(agent.direction),np.sin(agent.direction)), (agent.attractor[0]-agent.location[0],agent.attractor[1]-agent.location[1]))
                angle = np.clip(angle, -np.pi/16, np.pi/16)
                error = np.random.normal(0, .3)
                agent.direction += angle + error
                agent.direction = agent.direction % (2 *np.pi)
        elif(agent.repulsor is not None and distance(agent.repulsor, agent.location) < 40 and agent.ignore_repulsor is False):
                 angle = - safe_angle((np.cos(agent.direction),np.sin(agent.direction)), (agent.repulsor[0]-agent.location[0],agent.repulsor[1]-agent.location[1]))
                 angle = np.clip(angle, -np.pi/16, np.pi/16)
                 if(angle >= 0):
                          agent.direction += .3
                 else:
                          agent.direction -= .3

                 agent.direction %= 2 * np.pi
        else:
                 delta_d = np.random.normal(0, .3)
                 agent.direction = (agent.direction + delta_d) % (2 * np.pi)

class Assessing(State):
    def __init__(self):
        self.name = "assessing"
        self.goingToSite = True

    def sense(self, agent, environment):
        pass

    def act(self, agent):
        self.move(agent)

    def update(self, agent):
          # may need an ID of some sort to get my info from environment

        # if agent is less than distance=1 unit away from potential site, go back to hub
        if ((agent.potential_site[0] - agent.location[0]) ** 2 +
                    (agent.potential_site[1] - agent.location[1]) ** 2 )< 1:
            self.goingToSite = False

        # if agent is less than distance=30 unit away from hub, switch to dancing
        if (((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2)**.5 <agent.hubRadius) and (self.goingToSite is False):
            return input.siteFound

    def move(self, agent):
        if self.goingToSite:
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

    def sense(self, agent, environment):  # probably not needed for now, but can be considered a place holder
        pass

    def act(self, agent):
        if self.atHub:
            agent.velocity = 0
            self.restCountdown -= 1
        else:
            # if not at hub, more towards it
            self.move(agent)
            if ((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2)**.5 <= 1:
                agent.velocity=0
                self.atHub = True

    def update(self, agent):
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
        self.name = "dancing"
        self.dance_counter = 700 #this dance counter should be determined by the q value and the distance,
                                #we can consider implementing that in the transition.

    def sense(self, agent, environment):
        pass

    def act(self, agent):
        self.move(agent)

    def update(self, agent):
        # info from environment
        if self.dance_counter == 0:
            if agent.assessments < 3:
                agent.assessments += 1
                return input.notTiredDance
            else:
                agent.assessments=0
                agent.potential_site = None
                return input.tiredDance
        else:
            self.dance_counter -= 1

    def move(self, agent):
        #agent.direction += 2 * np.pi / 50
        if ((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2)**.5 >= agent.hubRadius:
            dx =  agent.hub[0] -agent.location[0]
            dy = agent.hub[1]- agent.location[1]
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

    def sense(self, agent, environment):
        # get nearby bees from environment and check for dancers
        if self.atHub:
            bees = environment.get_nearby_agents(agent.id)  # we may need to reformat this so the agent knows what is
            for bee in bees:
                if isinstance(bee.state, Dancing().__class__):
                    self.seesDancer = True;
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
            if ((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 <= .5:
                self.atHub = True
                agent.direction += -89 + 179 * np.random.random()
                agent.velocity = agent.hubRadius / 20.0

    def update(self, agent):
        if self.seesDancer is True:
            return input.dancerFound
        elif self.observerTimer < 1:
            return input.observeTime

    def movehome(self, agent):
        dx = agent.hub[0] - agent.location[0]
        dy = agent.hub[1] - agent.location[1]
        agent.direction = np.arctan2(dy, dx)

    def wander(self, agent):

        # agent.direction += 2 * np.pi / 8
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
