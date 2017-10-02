from pymongo import MongoClient
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from Measurements import *
import multiprocessing
from multiprocessing import Pool

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
def calcGraph(dist):
    measure.close_dist = dist
    temp = measure.name
    measure.name = measure.name+" graph dist of "+str(dist)
    measure.GraphComputeAllMeasurements(xPos,yPos,states,ticks)
    measure.name = temp

#TODO: measure dispersion, measure number of agents per tick, score for the simulation
client = MongoClient('localhost', 27017)
db = client.hivemind
collection = db.simdatas
posData = db.possimdatas

measure = Measurements(30, 'name')
# data = collection.find_one()
for data in collection.find():
    print(data['name'])
    data2 = posData.find_one({"name": data['name']})
    influence = data['influence']
    plt.figure(1)
    ticks = data['totalTicks']
    yPos = data2['yPos']
    xPos = data2['xPos']
    states = data['states']
    if not all(x == ticks for x in {len(data['influence']), len(xPos), len(yPos), len(states)}):
        print('discrepancy in lengths....')
        print("totalTicks: ", data['totalTicks'])
        print("influence: ", len(data['influence']))
        print("xPos: ", len(xPos))
        print("yPos: ", len(yPos))
        print("states: ", len(states))
        answer = input('do you want to delete this? (y or n)?: ')

        if answer == 'y':
            collection.delete_one({'name': data['name']})
            pass
        continue
    measure.name = data['name']

    cores_in_use = multiprocessing.cpu_count() - 2
    pool = Pool(processes=cores_in_use)
    pool.map(calcGraph, [5, 10, 15, 20, 25, 30, 40, 50, 60, 70])


def calcGraph(dist):
    measure.close_dist = dist
    temp = measure.name
    measure.name = measure.name+" graph dist of "+str(dist)
    measure.GraphComputeAllMeasurements(xPos,yPos,states,ticks)
    measure.name = temp

    # plt.subplot(221)
    # plt.plot(x, data['clusteringMeasure'])
    # plt.ylabel('clusteringMeasure')
    # plt.subplot(222)
    # plt.plot(x, data['connectionsMeasure'])
    # plt.ylabel('connectionsMeasure(0:1)')
    # plt.subplot(223)
    # plt.plot(x, influence)
    # plt.ylabel('influence')
    # plt.suptitle(data['name'])

    #
    #
    # plt.savefig('data/' + data['name'])
    #
    # plt.show()
    # plt.cla()  # which clears data but not axes
    # plt.clf()  # which clears data and axes
    cores_in_use = multiprocessing.cpu_count() - 1

    # create_tables()  # Uncomment this line to delete and recreate the tables in the database

    pool = Pool(processes=cores_in_use)
    for i in range(cores_in_use):
        pool.apply_async(run_test)
    pool.close()
    pool.join()

