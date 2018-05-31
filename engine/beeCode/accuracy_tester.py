import csv

from engine.beeEnvironment import Environment

from engine.beeCode.agent.agent import *

tests = []

for x in range(100):
    print("Test", x + 1)
    world = Environment("updated_environment.txt")
    frame_count = 0

    sites_count = {}

    best_siteQ = 0
    second_bestQ = 0

    for site in world.sites:
        sites_count[tuple(site)] = 0
        if site[3] > best_siteQ:
            second_bestQ = best_siteQ
            best_siteQ = site[3]
        elif site[3] > second_bestQ:
            second_bestQ = site[3]


    while True:
        frame_count += 1
        if frame_count % 1000 == 0:
            print("\tframe count:", frame_count)
            print("\t\t# of exploring agents:", len(world.states[Exploring().__class__]))
            print("\t\t# of assessing agents:", len(world.states[Assessing().__class__]))
            print("\t\t# of dancing agents:", len(world.states[Dancing().__class__]))
            print("\t\t# of observing agents:", len(world.states[Observing().__class__]))
            print("\t\t# of resting agents:", len(world.states[Resting().__class__]))
            print("\t\t# of piping agents:", len(world.states[Piping().__class__]))
            print("\t\t# of siteAssess agents:", len(world.states[SiteAssess().__class__]))
            print("\t\t# of committed agents:", len(world.states[Commit().__class__]))
            print("\t\t# of dead agents:", len(world.dead_agents))

        for agent_id in world.agents:
            agent = world.agents[agent_id]
            if agent.live is True:
                agent.act()
                agent.sense(world)
                world.suggest_new_direction(agent.id)
                agent.update(world)

        if (len(world.states[Commit().__class__]) + len(world.dead_agents)) >= (len(world.agents) * .95):
            print("\tframe count:", frame_count)
            print("\t\t# of exploring agents:", len(world.states[Exploring().__class__]))
            print("\t\t# of assessing agents:", len(world.states[Assessing().__class__]))
            print("\t\t# of dancing agents:", len(world.states[Dancing().__class__]))
            print("\t\t# of observing agents:", len(world.states[Observing().__class__]))
            print("\t\t# of resting agents:", len(world.states[Resting().__class__]))
            print("\t\t# of piping agents:", len(world.states[Piping().__class__]))
            print("\t\t# of siteAssess agents:", len(world.states[SiteAssess().__class__]))
            print("\t\t# of committed agents:", len(world.states[Commit().__class__]))
            print("\t\t# of dead agents:", len(world.dead_agents))

            for agentId in world.states[Commit().__class__]:
                agent = world.agents[agentId]
                for site in world.sites:
                    x_dif = agent.potential_site[0] - site[0]
                    y_dif = agent.potential_site[1] - site[1]
                    tot_dif = (x_dif ** 2 + y_dif ** 2) ** .5
                    if tot_dif <= site[2]:
                        sites_count[tuple(site)] += 1

            for agentId in world.states[Piping().__class__]:
                agent = world.agents[agentId]
                for site in world.sites:
                    x_dif = agent.potential_site[0] - site[0]
                    y_dif = agent.potential_site[1] - site[1]
                    tot_dif = (x_dif ** 2 + y_dif ** 2) ** .5
                    if tot_dif <= site[2]:
                        sites_count[tuple(site)] += 1

            best_site_count = 0
            second_best_count = 0
            other_sites_count = 0
            dead_count = len(world.dead_agents)

            for site in sites_count:
                if site[3] == best_siteQ:
                    best_site_count = sites_count[site]
                elif site[3] == second_bestQ:
                    second_best_count = sites_count[site]
                else:
                    other_sites_count += sites_count[site]

            num_of_agents = len(world.agents)
            remaining = num_of_agents - best_site_count - second_best_count - other_sites_count - dead_count

            tests.append(
                [str(frame_count), str(round(best_site_count / num_of_agents * 100, 2)), str(round(second_best_count /
                                num_of_agents * 100, 2)), str(round(other_sites_count / num_of_agents * 100, 2)),
                                str(round(dead_count / num_of_agents * 100, 2)), str(round(remaining / num_of_agents * 100, 2))])
            break

        elif frame_count >= 100000:
            for agentId in world.states[Commit().__class__]:
                agent = world.agents[agentId]
                for site in world.sites:
                    x_dif = agent.location[0] - site[0]
                    y_dif = agent.location[1] - site[1]
                    tot_dif = (x_dif ** 2 + y_dif ** 2) ** .5
                    if tot_dif <= site[2]:
                        sites_count[tuple(site)] += 1

            for agentId in world.states[Piping().__class__]:
                agent = world.agents[agentId]
                for site in world.sites:
                    x_dif = agent.potential_site[0] - site[0]
                    y_dif = agent.potential_site[1] - site[1]
                    tot_dif = (x_dif ** 2 + y_dif ** 2) ** .5
                    if tot_dif <= site[2]:
                        sites_count[tuple(site)] += 1

            best_site_count = 0
            second_best_count = 0
            other_sites_count = 0
            dead_count = len(world.dead_agents)

            for site in sites_count:
                if site[3] == best_siteQ:
                    best_site_count = sites_count[site]
                elif site[3] == second_bestQ:
                    second_best_count = sites_count[site]
                else:
                    other_sites_count += sites_count[site]

            num_of_agents = len(world.agents)
            remaining = num_of_agents - best_site_count - second_best_count - other_sites_count - dead_count

            tests.append([str(frame_count), str(round(best_site_count / num_of_agents * 100,2)), str(round(second_best_count /
                          num_of_agents * 100, 2)), str(round(other_sites_count / num_of_agents * 100,2)), str(round(dead_count /
                          num_of_agents * 100, 2)), str(round(remaining / num_of_agents * 100, 2))])
            break

with open("results.csv", 'w', newline='') as csvfile:
    writer = csv.writer(csvfile, delimiter=',', quotechar='|')
    writer.writerow(["Frame Count", "% Best Site", "% Second Best", "% Other sites", "% Dead", "% Did not find site"])
    for test in tests:
        writer.writerow(test)
