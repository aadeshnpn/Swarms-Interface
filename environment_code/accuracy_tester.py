from environment_code import TestEnvironment
from agent.agent import *

import csv

tests = []

for x in range(1000):
    world = TestEnvironment.Environment("updated_environment.txt")
    frame_count = 0

    sites_count = {}

    for site in world.sites:
        sites_count[tuple(site)] = 0

    while True:
        frame_count += 1
        for agent_id in world.agents:
            agent = world.agents[agent_id]
            if agent.live is True:
                agent.act()
                agent.sense(world)
                world.suggest_new_direction(agent.id)
                agent.update(world)

        if (len(world.states[Commit().__class__]) + len(world.dead_agents)) > (len(world.agents) * .99):
            for agentId in world.states[Commit().__class__]:
                agent = world.agents[agentId]
                for site in world.sites:
                    x_dif = agent.location[0] - site[0]
                    y_dif = agent.location[1] - site[1]
                    tot_dif = (x_dif ** 2 + y_dif ** 2) ** .5
                    if tot_dif <= site[2]:
                        sites_count[tuple(site)] += 1
                        break

            percentages = {}

            for site in sites_count:
                percentages[site] = sites_count[site] / len(world.states[Commit().__class__])

            tests.append([("frame count:", frame_count), percentages])
            break
        elif frame_count > 1000000:
            for agentId in world.states[Commit().__class__]:
                agent = world.agents[agentId]
                for site in world.sites:
                    x_dif = agent.location[0] - site[0]
                    y_dif = agent.location[1] - site[1]
                    tot_dif = (x_dif ** 2 + y_dif ** 2) ** .5
                    if tot_dif <= site[2]:
                        sites_count[tuple(site)] += 1
                        break

            percentages = {}

            for site in sites_count:
                percentages[site] = sites_count[site] / len(world.states[Commit().__class__])

            tests.append([("frame count:", frame_count), percentages, "did not terminate"])
            break

with open("results.csv", 'w', newline="") as csvfile:
    writer = csv.writer(csvfile, delimiter = ' ', quotechar='|')
    writer.writerows(tests)