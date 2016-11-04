from agent import *
t = Agent(Exploring())
t.update()
print(t.state)
t.state.exploretime=1
t.update()
print(t.state)
t.update()
print(t.state)
