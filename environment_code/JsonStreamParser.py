import json
import threading
import sys

class JsonStreamParser:

    # initialise with the InputEventManager
    def __init__(self):
        self.callbacks = []
        self.buffer = ""

    def onData(self, callback):
        self.callbacks.append(callback)

    def parse(self, stream):
        self.stream = stream
        inputThread = threading.Thread(target=self.readInput)
        inputThread.start()

    def readInput(self):
        while True:
            for line in self.stream:
                msg = json.loads(line)
                for cb in self.callbacks:
                    cb(msg)
