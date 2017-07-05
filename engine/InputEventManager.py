import sys

from JsonStreamParser import JsonStreamParser


class InputEventManager:

    def __init__(self):
        self.subscriptions = {}
        self.eventQueue = []
        self.jsonStreamParser = JsonStreamParser()

    def start(self):
        self.jsonStreamParser.onData(self.inputEvent)
        self.jsonStreamParser.parse(sys.stdin)

    def subscribe(self, eventType, callbackFunction):
        if eventType not in self.subscriptions:
            self.subscriptions[eventType] = []

        self.subscriptions[eventType].append(callbackFunction)

    def unsubscribe(self, eventType, callbackFunction):
        self.subscriptions[eventType].remove(callbackFunction)

    def inputEvent(self, jsonDict):
        self.eventQueue.append(jsonDict)

    def callbackEvent(self, event):
        if event['type'] in self.subscriptions:
            for callback in self.subscriptions[event['type']]:
                callback(event)
