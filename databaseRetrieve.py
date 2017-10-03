from pymongo import MongoClient
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from Measurements import *
import multiprocessing
from multiprocessing import Pool
import argparse

import numpy as np

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
parser = argparse.ArgumentParser()

parser.add_argument("-a", "--all", action='store_true', help="process all of the simulations in the database")
parser.add_argument("-r", "--runOne", type=str, help="choose a specific simulation to process and view")
parser.add_argument("-c", "--choose", action='store_true', help="view databases and select which one to run")

# parser.add_argument("-qt", "--quantity", choices=["few", "avg", "many"], help="Set number of sites in random world ('few', 'avg', or 'many')")

parser.add_argument("-threads", "--number-of-threads", type=int, help="Set number of threads you would like to use")

args = parser.parse_args()

client = MongoClient('localhost', 27017)
db = client.hivemind
collection = db.simdatas
posData = db.possimdatas

measure = Measurements(30, 'defaultName')
# data = collection.find_one()


def calcGraph(dist):
    measure.close_dist = dist
    temp = measure.name
    measure.name = measure.name + " graph dist of "+str(dist)
    measure.GraphComputeAllMeasurements()
    measure.name = temp

def processAll():
    for data in collection.find():
        print(data['name'])
        data2 = posData.find_one({"name": data['name']})
        process_one(data, data2)


def runOne(dataName):
    print(dataName)
    data =collection.find_one({"name": dataName})
    print(data['name'])
    data2 = posData.find_one({"name": data['name']})
    plt.figure(1)
    process_one(data, data2)


def select_one():
    print('these are the current simulations: ')
    for data in collection.find():
        print(data['name'])
    dataName = input('which one would you like to process? ')
    data = collection.find_one({"name": dataName})
    print(data['name'])
    data2 = posData.find_one({"name": data['name']})
    process_one(data, data2)


def process_one(data, data2):
    name = data['name']
    influence = data['influence']
    ticks = data['totalTicks']
    yPos = data2['yPos']
    xPos = data2['xPos']
    states = data['states']
    if not all(x == ticks for x in {len(influence), len(xPos), len(yPos), len(states)}):
        print('discrepancy in lengths cannot process...')
        print("totalTicks: ", ticks)
        print("influence: ", len(influence))
        print("xPos: ", len(xPos))
        print("yPos: ", len(yPos))
        print("states: ", len(states))
        answer = input('do you want to delete this? (y or n)?: ')

        if answer == 'y':
            collection.delete_one({'name': name})
        return

    measure.update(name, 20,xPos,yPos,states,ticks)

    cores_in_use = multiprocessing.cpu_count() - 2
    pool = Pool(processes=cores_in_use)
    pool.map(calcGraph, [5, 10, 15, 20, 25, 30, 40, 50, 60, 70])
    # TODO make sure that this is thread safe: make multiple measurement objects?


if __name__ == '__main__':
    if args.all:
        processAll()
    elif args.choose:
        select_one()
    elif args.runOne:
        runOne(args.runOne)

        # parser.add_argument("-a", "--all", help="process all of the simulations in the database")
        # parser.add_argument("-c", "--choose", help="choose a specific simulation to process and view")
        # parser.add_argument("-s", "--select", help="view databases and select which one to run")





