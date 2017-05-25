#beeEnvironment
'''
def get_nearby_dancers(self, agent_id, radius):
        nearby = []
        for other_id in self.states[Dancing().__class__]:
            if ((self.agents[other_id].location[0] - self.agents[agent_id].location[0]) ** 2 + (self.agents[other_id].location[1] - self.agents[agent_id].location[1]) ** 2) ** .5 <= radius:
                nearby.append(self.agents[other_id])
        return nearby

    def get_nearby_pipers(self, agent_id, radius):
        nearby = []
        for other_id in self.states[Piping().__class__]:
            if ((self.agents[other_id].location[0] - self.agents[agent_id].location[0]) ** 2 + (self.agents[other_id].location[1] - self.agents[agent_id].location[1]) ** 2) ** .5 <= radius:
                nearby.append(self.agents[other_id])
        return nearby

    def get_nearby_site_assessors(self, agent_id, radius):
        nearby = []
        for other_id in self.states[SiteAssess().__class__]:
            if other_id != agent_id:
                if ((self.agents[other_id].location[0] - self.agents[agent_id].location[0]) ** 2 + (self.agents[other_id].location[1] - self.agents[agent_id].location[1]) ** 2) ** .5 <= radius:
                    nearby.append(self.agents[other_id])
        return nearby

     # Wind affects the whole environment except the hub.
    def wind(self, direction, velocity):
        for agent_id in self.agents:
            agent = self.agents[agent_id]
            if ((agent.location[0] - self.hub["x"]) ** 2 + (agent.location[1] - self.hub["y"]) ** 2) ** .5 > self.hub[
                "radius"]:
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
                    self.stats["deadAgents"] += 1
                    eprint("dead: ", self.state["deadAgents"])
                    # self.states[agent.state].remove(agent_id) also not using this currently
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
'''