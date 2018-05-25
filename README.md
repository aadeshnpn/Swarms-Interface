# Setup #
#### Setup for Linux ####
1. git clone `address`
2. cd viewer
3. npm install --save
4. cd ../engine
5. pip install -r requirement.txt

#### `Setup for Windows` ####
`Working on getting setup documented`

##### Install Node and npm #####
1. sudo apt-get --purge remove node
2. sudo apt-get --purge remove nodejs
3. curl -sl https://deb.nodesource.com/setup-6.x | sudo -E bash -
4. sudo apt-get install -y nodejs
5. sudo apt-get install note
6. sudo apt-get install -y build-essential

##### Install pip #####
1. sudo apt-install python-pip

##### Install redis #####

1. Good Luck
2. Just kidding, the documentation is coming. 

##### Windows Sim Setup #####
> _Restart your bash session_

> **Same as Linux from here on**

1. git clone `address`
2. cd viewer
3. npm install --save
4. cd ../engine
5. pip install -r requirement.txt


# Swarm Viewer #

Server - server.js. Built on expressjs and socket.io. Responsible for monitoring
incoming connections, spawning new engine processes, serving the client scripts,
and passing along information between the engine and client

Engine - environment_code. Python simulation of honeybees, outputs information
about the whole simulated world in JSON, accepts input events in JSON

Client - js/. HTML5 based renderer for the engine's JSON. The basic layout is in
index.html, everything to be rendered is split into different classes under js/.
The server concatenates all that together into one massive (optionally minified)
js script and sends it to the client with index.html

## Execution Flow Overview ##

# Server #
The entry point is server.js. Run it with `node server.js` or `npm start`.

From there, execution proceeds line by line from the top, mostly just getting
references to dependencies, setting up some necessary variables, and defining
the auxiliary Client class.

Quick note if expressjs is unfamiliar, the way it works is by defining "routes".
Each route gets assigned middleware, which can come from a variety of libraries
or can be customised. We do the latter. Middleware gets run when an HTTP request
matches a route. So `app.get('/', function (req, res) { ... } );` translates to
'run the given function when we receive a request for the server's root directory.
In our case, we serve `index.html`, but we could conceivably do anything we wanted
with expressjs' request and response objects.

The socket.io works very similarly, defining functions to be used on specific
socket events.

After all this is defined and configured, the server actually starts running when
`sticky.listen()` is called. Sticky is a module that abstracts away a lot of the
mess of making websockets work across multiple cores, and as a bonus automatically
forks the server until there's at least one instance for each core.

# First Connection #

The server technically doesn't do anything else until it receives a connection
request. Then, it sends `index.html` with a unique generated client id as a cookie.
Here, it creates a new instance of the Client class, and starts it, which does a
couple of things:

   - generates a unique client id
   - checks if the given world id already has an engine process running
   - if there is, attaches to it
   - if there isn't, spawns a new python engine process and pipes its stdin
     to the server's stdout, and vice versa
   - pipes the engine's output to the json parser
   - hooks up the json parser to send parsed json to the client via the websocket
     (`sendUpdate()`)

This will quickly result in the first json output from the engine being sent to
the client in an `update` socket event, after the client sends back its id (below)

# Client #

The client has run through all the concatenated json which mostly defines globals
and the classes to be used for rendering, until finally it gets to `init.js`.
Here it defines a few more globals and instantiates the UI class.
It takes a moment to send back its unique client id through the websocket so
that the server can associate that particular socket connection to the Client
representation it just instantiated. Then, it waits for an `update` event.

On that first update (`socket.on('update', ... )`) the client does some
housekeeping like resizing the canvas element to the size of the received world
and getting the canvas' 2d drawing context. The it uses the json to instantiate
a World object, which also instantiates the rest of the environment js classes
as necessary. Then, it calls `window.requestAnimationFrame()` with the `draw()`
function as an argument. This says, whenever the browser is ready for a graphics
redraw, call the provided function.

`draw()` does exactly that: it clears the canvas, then calls the `draw()`
function of both the world and the ui, which cascade down through their sub
object calling their `draw()` function along the way.

Finally, `draw()` sets a timeout to call `window.setAnimationFrame()` again in
1/60th second with itself as an argument, ensuring the canvas is continually
updated.

As more socket `update` events are received, the world is updated with
the new data, so when it's drawn next time, we essentially get a new frame of
animation

# User Controls #

There are a variety of user controls that have been implemented. The
`create simulation` was created to ease the work of starting a new simulation.
You can select how many agents the simulation uses. If you choose the drone
agent, you can choose the number of sites and their attack pattern.

#### `Yet to be Implemented / Reimplemented` ####
`Agent Selection`
`User Study Controls`

# Events #

The previous sections summarises the main execution flow, but some other paths
come from user interaction. The `Cursor` class and subclasses provide functions
for attaching listeners to HTML DOM cursor events, like onclick, onmousemove,
onmousedown, etc. These `Cursor` subclasses represent different states of cursor
so UI elements only have to attach to cursor events for those particular states,
ensuring there isn't any kind of problematic overlapping.

Some events come from HTML buttons or other elements, which are defined in the
`document` directory under `js`. These scripts usually just attach an `onclick`
or on `onchange` listener before updating some state of the `UI` class
(e.g., setting the active cursor), or sending an `input` event back to the
server
