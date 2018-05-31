import sys

from utils.JsonStreamParser import JsonStreamParser
# This handles subscriptions to events from the server (such as inputs from the user)
# The data is coming in through sys.stdin. It uses the json stream parser
# to catch the input, parse it, convert it to a python dictionary, and call
# InputEventManager.inputEvent, which adds the data to the eventQueue.
# The environment then calls callbackEvent for each of the subscriptions every tick.
# Then the environment deletes the eventqueue every tick.

class InputEventManager:

    def __init__(self):
        self.subscriptions = {}
        self.eventQueue = []
        self.jsonStreamParser = JsonStreamParser()

    def start(self):
        self.jsonStreamParser.onData(self.inputEvent) #sets the callback for new data
        self.jsonStreamParser.parse(sys.stdin) #starts the parser from the stdin from the server

    def subscribe(self, eventType, callbackFunction): #called by anything that wants to subscribe to an event
        if eventType not in self.subscriptions:
            self.subscriptions[eventType] = []

        self.subscriptions[eventType].append(callbackFunction)

    def unsubscribe(self, eventType, callbackFunction):
        self.subscriptions[eventType].remove(callbackFunction)

    def inputEvent(self, jsonDict): #this will be called when new data is recieved
        self.eventQueue.append(jsonDict)

    def callbackEvent(self, event): # This finds and calls the callbacks associated with each event.
        if event['type'] in self.subscriptions:
            for callback in self.subscriptions[event['type']]:
                callback(event)
