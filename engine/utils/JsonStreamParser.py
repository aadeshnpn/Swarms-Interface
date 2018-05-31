import json
import threading
import sys
#This file handles the parsing of the stream from the server
# It is started by the input event manager (which provides the callbacks)
#
class JsonStreamParser:

    # initialise with the InputEventManager
    def __init__(self):
        self.callbacks = []
        self.buffer = ""

    def onData(self, callback): #this adds callbacks for the stream parsing
        self.callbacks.append(callback)

    def parse(self, stream): # the stream has it's output set to readInput and is started reading from teh given stream
        self.stream = stream
        inputThread = threading.Thread(target=self.readInput)
        inputThread.start()

    def readInput(self): #Reads input from the stream.
        while True:
            for line in self.stream:
                msg = json.loads(line)
                for cb in self.callbacks:
                    cb(msg)
