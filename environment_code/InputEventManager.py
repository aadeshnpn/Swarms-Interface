from JsonStreamParser import JsonStreamParser
import sys

class InputEventManager:

    def __init__(self):
        self.subscriptions = {}
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
        for callback in self.subscriptions[jsonDict['type']]:
            callback(jsonDict)