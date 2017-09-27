from pymongo import MongoClient
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

import numpy as np
#dict_keys(['name', 'influence', '_id', 'score', 'totalTicks', 'clusteringMeasure', 'connectionsMeasure', 'world', '__v'])

# ({
#   name: String,
#   world: String,
#   date: String,
#   totalTicks: Number,
#   influence: [Number],
#   connectionsMeasure: [Number],
#   clusteringMeasure: [Number],
#   states: [[String]],
#   xPos: [[Number]],
#   yPos: [[Number]],
#   score: Number
# });

#TODO: measure dispersion, measure number of agents per tick, score for the simulation
client = MongoClient('localhost', 27017)
db = client.hivemind
collection = db.simdatas
# data = collection.find_one()
for data in collection.find():
    print(data['name'])
    influence = data['influence']
    plt.figure(1)
    x = np.linspace(0, data['totalTicks'], data['totalTicks'])
    if data['totalTicks'] != len(data['influence']):
        print('do you want to delete?')
        print(data['totalTicks'])
        print(" influence", len(data['influence']))
        answer = input('do you want to delete a discrepant database (there is a problem with totalTicks and clusteringMeasure) (y or n)?: ' + data['name'])

        if answer == 'y':
            collection.delete_one({'name': data['name']})
            pass
        continue

    # plt.subplot(221)
    # plt.plot(x, data['clusteringMeasure'])
    # plt.ylabel('clusteringMeasure')
    # plt.subplot(222)
    # plt.plot(x, data['connectionsMeasure'])
    # plt.ylabel('connectionsMeasure(0:1)')
    plt.subplot(223)
    plt.plot(x, influence)
    plt.ylabel('influence')
    # plt.suptitle(data['name'])



    plt.savefig('data/' + data['name'])

    plt.show()
    plt.cla()  # which clears data but not axes
    plt.clf()  # which clears data and axes
