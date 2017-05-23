#antEnvironment
'''
    def wind(self, direction, velocity):
        for agent_id in self.agents:
            agent = self.agents[agent_id]
            if ((agent.location[0] - self.hub["x"]) ** 2 + (agent.location[1] - self.hub["y"]) ** 2) ** .5 > self.hub["radius"]:
                proposed_x = agent.location[0] + np.cos(direction) * velocity
                proposed_y = agent.location[1] + np.sin(direction) * velocity

                terrain_value = self.check_terrain(proposed_x, proposed_y)

                if terrain_value == 0:
                    agent.location[0] = proposed_x
                    agent.location[1] = proposed_y
                elif terrain_value == -3:
                    agent.location[0] = proposed_x
                    agent.location[1] = proposed_y
                    agent.live = False
                    self.dead_agents.append(agent)
                    #self.states[agent.state].remove(agent_id) also not using this currently
                    del self.agents[agent_id]
                    return
                elif terrain_value == -2:
                    pass
                elif terrain_value == -1:  # If the agent is in rough terrain, it will move at half speed
                    slow_down = .5
                    agent.location[0] += np.cos(direction) * velocity * slow_down
                    agent.location[1] += np.sin(direction) * velocity * slow_down

            # If the agent goes outside of the limits, it re-enters on the opposite side.
            if agent.location[0] > self.x_limit:
                agent.location[0] -= 2 * self.x_limit
            elif agent.location[0] < self.x_limit * -1:
                agent.location[0] += 2 * self.x_limit
            if agent.location[1] > self.y_limit:
                agent.location[1] -= 2 * self.y_limit
            elif agent.location[1] < self.y_limit * -1:
                agent.location[1] += 2 * self.y_limit

under get_q
    #if agent.atSite:
        #    if self.info_stations[agent.siteIndex].check_for_changes(agent.parameters, agent.param_time_stamp):
        #        agent.update_params(self.info_stations[agent.siteIndex].parameters)
        #        agent.param_time_stamp = self.info_stations[agent.siteIndex].last_update
            # agent.atSite = False
    #agent = self.agents[agent_id]
                    #agent.act()
                    #agent.sense(self)
                    #self.suggest_new_direction(agent.id)
                    #wind_direction = 1  # in radians
                    #wind_velocity = .01
                    # uncomment the next line to add wind to the environment
                    #self.wind(wind_direction, wind_velocity)
                    #agent.update(self)


under add agents:
"""
            agent = Agent(agent_id,  Exploring(ExploreTimeMultiplier=self.parameters["ExploreTime"]), self.hub,
                          piping_threshold          = int   (self.parameters["PipingThreshold"  ]),
                          global_velocity           = float (self.parameters["Velocity"         ]),
                          explore_time_multiplier   = float (self.parameters["ExploreTime"      ]),
                          rest_time                 = int   (self.parameters["RestTime"         ]),
                          dance_time                = int   (self.parameters["DanceTime"        ]),
                          observe_time              = int   (self.parameters["ObserveTime"      ]),
                          site_assess_time          = int   (self.parameters["SiteAssessTime"   ]),
                          site_assess_radius        = int   (self.parameters["SiteAssessRadius" ]),
                          piping_time               = int   (self.parameters["PipingTime"       ]))
            self.agents[agent_id] = agent
            #self.states[Exploring().__class__].append(agent_id)


        for y in range(rest_num):
            agent_id = str(x + 1 + y)

            agent = Agent(agent_id, Resting(agent=None, rest_time=self.parameters["RestTime"]), self.hub,
                          piping_threshold          = int   (self.parameters["PipingThreshold"]),
                          global_velocity           = float (self.parameters["Velocity"]),
                          explore_time_multiplier   = float (self.parameters["ExploreTime"]),
                          rest_time                 = int   (self.parameters["RestTime"]),
                          dance_time                = int   (self.parameters["DanceTime"]),
                          observe_time              = int   (self.parameters["ObserveTime"]),
                          site_assess_time          = int   (self.parameters["SiteAssessTime"]),
                          site_assess_radius        = int   (self.parameters["SiteAssessRadius"]),
                          piping_time               = int   (self.parameters["PipingTime"]))
            self.agents[agent_id] = agent
        """
'''
#antEnvironment
'''
class Following1(State): #similar to assessor.
    def __init__(self,agent=None,time=None):
        self.name = 'following'
        self.following = None

    def sense(self,agent,environment):
        if (((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 > agent.hubRadius) \
                and agent.inHub is True:
                if environment.hubController.beeCheckOut(agent) == 0:
                    agent.inHub = False
                    return

        if (((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 < agent.hubRadius) \
                and agent.inHub is False:
                    environment.hubController.beeCheckIn(agent)
                    agent.inHub = True
                    return
            #TODO they are starting following while the agents are still in the hub, maybe they shouldn't follow them.
            # The problem is they leave the hub and then show a hub checkout.
        """
        new_q = environment.get_q(agent)["q"]
        agent.q_value = new_q

        agent.attractor = environment.getAttractor(agent.location)
        if(agent.attractor is not None and agent.attracted is None):
            if(np.random.random () > .2):
                agent.attracted = True
            else:
                agent.attracted = False

        agent.repulsor = environment.getRepulsor(agent.location)
        if(agent.repulsor is not None and agent.ignore_repulsor is None):
            if(np.random.random() >.5):
                 agent.ignore_repulsor = True
            else:
                 agent.ignore_repulsor = False
        #self.following=environment.agents[environment.following[agent.id]]
        #print ('Update',environment.following[agent.id])
        """

    def update(self,agent,environment):
        if (((agent.hub[0] - agent.location[0]) ** 2 + (
                agent.hub[1] - agent.location[1]) ** 2) ** .5 < agent.hubRadius) and (agent.goingToSite is False):
            agent.goingToSite = True
            return input.arrive
        elif ((agent.potential_site[0] - agent.location[0]) ** 2 + (
                agent.potential_site[1] - agent.location[1]) ** 2) < 1 and (agent.goingToSite is True):
            agent.goingToSite = False
            #if(np.random.uniform(0,1) < 1 - agent.q_value): # (1-q)% chance of going to observer state instead of dancing
            #    return input.quit
            #return input.startRecruiting
            return
        """
        if self.following:
            if agent.q_value > 0 #or self.following.q_value > 0:
                agent.potential_site = [agent.location[0], agent.location[1]]
                return input.arrive
        """

    def act(self,agent):
        if agent.goingToSite:
            dx = agent.potential_site[0] - agent.location[0]
            dy = agent.potential_site[1] - agent.location[1]
            agent.direction = np.arctan2(dy, dx)
        else:
            dx = agent.hub[0] - agent.location[0]
            dy = agent.hub[1] - agent.location[1]
            agent.direction = np.arctan2(dy, dx)
        return
        #agent.direction = np.arctan2(agent.location[0]+np.random.random(),agent.location[1]+np.random.random())
        #agent.location = [np.random.randint(1,10),np.random.randint(1,10)]
        """
        if self.following and agent.inHub is False:
            #print ('from flowing',self.following)
            agent.direction = self.following.direction
            agent.location[0] = self.following.location[0] - 0.2
            agent.location[1] = self.following.location[1] - 0.2
            #TODO better way to follow, this is preventing them from reaching the site.
        """

        antAgent
        end of act
        """
        if agent.inHub:
            if ((agent.hub[0] - agent.location[0]) ** 2 + (agent.hub[1] - agent.location[1]) ** 2) ** .5 >= agent.hubRadius:
                dx = agent.hub[0] - agent.location[0]
                dy = agent.hub[1] - agent.location[1]
                agent.direction = np.arctan2(dy, dx)
            else:
                delta_d = np.random.normal(0, .3)
                agent.direction = (agent.direction + delta_d) % (2 * np.pi)
        else:
            dx = agent.hub[0] - agent.location[0]
            dy = agent.hub[1] - agent.location[1]
            agent.direction = np.arctan2(dy, dx)
            return
        #agent.direction = np.arctan2(agent.location[0]+np.random.random(),agent.location[1]+np.random.random())
        #agent.location = [np.random.randint(1,10),np.random.randint(1,10)]
        #pass
        """
        '''