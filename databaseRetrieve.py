from pymongo import MongoClient
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

import numpy as np
#dict_keys(['name', 'influence', '_id', 'score', 'totalTicks', 'clusteringMeasure', 'connectionsMeasure', 'world', '__v'])
client = MongoClient('localhost', 27017)
db = client.hivemind
collection = db.simdatas
data = collection.find_one()
influence = data['influence']
plt.figure(1)
x = np.linspace(0,data['totalTicks'],data['totalTicks'])
plt.title('clustering measure')
plt.plot(x,data['clusteringMeasure'])
plt.savefig('clustering',format="png")





plt.figure(2)
plt.plot(x,data['connectionsMeasure'])
plt.savefig('connections',format="png")
plt.show()




