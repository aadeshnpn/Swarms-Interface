// Express is the web server framework. It handles all the low level http
// stuff. It initialises a server based off the basic node httpserver which
// we can then use to define http routes
const express = require('express');
var app = express();

// express() returns a Server object. The only thing we really care about with
// this is to have it start listening for incoming connections
const http = require('http').Server(app);

// socket.io is what makes everything work. It runs on top of express and
// abstracts away loads of http gore to essentially give us a bi-directional
// WebSocket. We define event handling and routes on this io object
const io = require('socket.io')(http);

// sticky makes socket.io work with the cluster module
const sticky = require('sticky-session');

// shortid for world id gen
const shortid = require('shortid');

// filesytem utils
const fs = require('fs');

// lets us do things like joining two paths without worrying about OS
const path = require('path');

// stream JSON parser lets us read the engine's stdout without any tricks
const JSONStream = require('JSONStream');

// manage child processes
const spawn = require('child_process').spawn;

// minify and concatenate js files
const minifier = require('node-minify');

// operating system info module
const os = require('os');

// config file module
const config = require('config');

// bluebird is an awesome promise library that we use to promisify
// callback heavy libs like redis
const bluebird = require('bluebird');

// body-parser enables reading POST data
const bodyParser = require('body-parser');

// redis is an in-memory key-value repository that we use for
// coordinating subprocesses
var redis = require('redis');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

// The server's job should be essentially to grab world info from the simulation
// engine and pass it on to the client, nothing else.

// this is so each process can terminate its engine instances in an emergency
// it doesn't need to be shared between cluster instances, so we're ok with
// a global var
var children = [];

//------------------------------------------------------------------------------
// Simulation represents a sim that can be attached to and observed by clients
class Simulation
{
  constructor(simId, options = {})
  {
    this.simId = simId;
    this.options = options;
    this.jsonStreamParser = JSONStream.parse();
    this.outputChannel = `sim:${simId}:output`;
    this.inputChannel = `sim:${simId}:input`;
    this.killChannel = `sim:${simId}:kill`;
    this.startChannel = `sim:${simId}:start`;

    this.inputListener = redisClient.duplicate();
    this.outputBroadcaster = redisClient.duplicate();

    redisClient.setAsync(`sim:${simId}:connectedCount`, 0);

    this.inputListener.subscribe(this.startChannel);
    this.inputListener.on("message", this.input.bind(this));

    var info = {options: this.options, channels: {input: this.inputChannel, output: this.outputChannel, start: this.startChannel, kill: this.killChannel}};

    // This probably isn't best practice, you'd really want to bring in rejson
    // or something, but because this isn't an enterprise app, I think we can
    // get away with the stringy approach
    redisClient.setAsync(`sim:${simId}:info`, JSON.stringify(info))
      .then( () => {
        redisClient.sadd("activeSims", `${simId}`);
      });

    // bind() basically "saves" a particular way of calling a function
    // with certain arguments, etc. In this case, we bind sendUpdate
    // to have this Simulation object as its 'this' value.
    this.jsonStreamParser.on('data', this.sendUpdate.bind(this));
  }

  start()
  {
    this.world = null;

    var info = {};
    var python = config.has(`pythonExecutable.${os.platform()}`) ? config.get(`pythonExecutable.${os.platform()}`) : config.get("pythonExecutable.default");

    var args = [];
    var simEnv = this.options.model === "ant" ? '../engine/antEnvironment.py' : '../engine/beeEnvironment.py';

    // TODO: consolidate environments
    args.push(path.join(__dirname, simEnv));

    // Build all the arguments to pass to python
    for (let [key, val] of Object.entries(this.options))
    {
      switch (key)
      {
        case 'model':
          args.push('--model', val);
          info.model = val;
          break;

        case 'random':
          args.push('--random');
          break;

        case 'seed':
          args.push('--seed', val);
          break;
      }
    }

    // Spawn a new subprocess with its stdout and stdin connected to us, and
    // stderr going to our stderr (the terminal)
    const engine = spawn(python, args,
    {
      stdio: ['pipe', 'pipe', process.stderr]
    });

    // keep track of all our children for cleanup in case of emergency
    children.push(engine);

    engine.on('error', err =>
    {
      console.error("[!] Unable to start engine process: " + err)
    });

    this.world = {
      engine: engine
    };
    //Client.worlds[this.worldId] = this.world;

    // pipe stdout from the engine to our stream parser
    this.world.engine.stdout.pipe(this.jsonStreamParser);

    // now that the sim is started, listen for input and kill events
    this.inputListener.subscribe(this.inputChannel);
    this.inputListener.subscribe(this.killChannel);
  }

  // Data should be a serialized JSON string
  input(channel, data)
  {
    // all of our subscriptions come through here so we need to check which type
    // it is
    switch (channel)
    {
      case this.inputChannel:
        this.world.engine.stdin.write(data);
        break;

      case this.startChannel:
        this.start();
        break;

      case this.killChannel:
        this.stop();
        break;
    }
  }

  sendUpdate(data)
  {
    // i know we are serializing data we just unserialized, but we
    // need to do it like that to make sure we only get one complete JSON
    // obj at a time
    const str = JSON.stringify(data);
    this.outputBroadcaster.publish(this.outputChannel, str);
  }

  stop()
  {
    // kill the subprocess
    this.world.engine.kill();

    // clean up our redis info
    redisClient.delAsync(`sim:${this.simId}:info`)
      .then( () => {
        redisClient.srem("activeSimKeys", `${this.simId}`);
      });
  }
}

// A client represents a user with a websocket connection
class Client
{
  constructor(webSocket, simId)
  {
    this.socket = webSocket;
    this.engineOutputListener = redisClient.duplicate();
    this.userInputBroadcaster = redisClient.duplicate();
    this.simId = simId;

    // get the associated info for a simulation
    // so down the line we can do things like restrict user capabilities
    redisClient.getAsync(`sim:${simId}:info`)
      .then(infoStr =>
      {
        const info = JSON.parse(infoStr);

        this.channels = info.channels;
        this.options = info.options;

        redisClient.incrAsync(`sim:${this.simId}:connectedCount`)
          .then(newCount =>
          {
            if (newCount == 1)
            {
              // if we're the first ones, start the simulation
              // TODO: make this behaviour configurable so we can auto-start
              //       and auto-stop like we do now, but also have the sim
              //       run independently if we want
              this.userInputBroadcaster.publish(this.channels.start, "first");
              this.engineOutputListener.subscribe(this.channels.output);
              this.engineOutputListener.on("message", this.sendUpdate.bind(this));
            }
          });

        this.socket.on('disconnect', this.disconnect.bind(this));
        this.socket.on('input', this.userInput.bind(this));
      });
  }

  sendUpdate(channel, data)
  {
    const obj = JSON.parse(data);
    this.socket.emit(obj.type, obj);
  }

  userInput(data)
  {
    this.userInputBroadcaster.publish(this.channels.input, JSON.stringify(data) + '\n');
  }

  disconnect()
  {
    redisClient.decrAsync(`sim:${this.simId}:connectedCount`)
      .then(newCount =>
      {
        if (newCount == 0)
        {
          this.userInputBroadcaster.publish(this.channels.kill, "done");
          redisClient.delAsync(`sim:${this.simId}:connectedCount`);
        }
      });
  }
}

/*******************************************************************************
 * Route definition
 ******************************************************************************/

app.use(express.static(path.join(__dirname, "public")));
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded({extended: true}) );

// Route for creating a new simulation
app.post('/sims/', function(req, res)
{
  const options = req.body;
  const id = options.name || shortid.generate();

  // check if we already have a sim under that name
  redisClient.sismemberAsync("activeSims", id)
    .then(inUse =>
    {
      if (inUse)
      {
        res.status(400).send("Simulation already exists");
      }
      else
      {
        new Simulation(id, options);

        // send back the link for connecting to the simulation
        res.status(200).send(`/sims/${id}`);
      }
    });
});

// Route for connecting to a specific simulation
app.get('/sims/:id', function(req, res)
{
  const simId = req.params.id;

  if (simId === null)
  {
    res.status(400).send('Missing simulation id');
  }

  // We actually don't get the sim set up here, we just need to
  // send the viewer html back with this cookie for finding the right sim
  res.cookie("simId", simId);

  res.sendFile('client.html',
  {
    root: __dirname
  });
});

// Route for getting the list of available sims
// TODO: finish
app.get('/sims/list', function(req, res)
{
  redisClient.getAsync('activeSimList')
    .then(simList => res.json(simList));
});

// On a request for 'client.js', minify and concat all the relevant scripts, then
// serve it
app.get('/client.js', function(req, res)
{
  minifier.minify(
    {
      //compressor: 'babili',    //production
      compressor: 'no-compress', //debug
      input: ['js/ui/**/*.js', 'js/environment/**/*.js'],
      output: 'generated/client.js'
    })
    .then(function()
    {
      return minifier.minify(
      {
        compressor: 'no-compress',
        input: ['generated/client.js', 'js/init.js'],
        output: 'generated/client.js'
      });
    })
    .then(function(minified)
    {
      //console.log(minified);
      res.sendFile('generated/client.js',
      {
        root: __dirname
      });
    })
    .catch(function(err)
    {
      console.log(err);
      cleanup();
    });

});

/*******************************************************************************
 * WebSocket configuation
 ******************************************************************************/

// On any new connection, we're passed a socket object representing that
// that specific connection. Any socket specific setup has to be done on that
// object, not the global io object
io.on('connection', function(socket)
{
  // We only need to set up the client here; it will take care of other events,
  // disconnects, etc.
  socket.on('simId', function(id)
  {
    var client = new Client(socket, id);
  });
});

// unified way of cleaning up all terminations
function exitHandler(opts, err)
{
  for (child of children)
  {
    child.kill();
  }

  if (opts.exit)
  {
    process.exit();
  }
}

process.on('SIGTERM', exitHandler.bind(null, {exit: true}));
process.on('SIGINT', exitHandler.bind(null, {exit: true}));
process.on('exit', exitHandler);

/*******************************************************************************
 * Server initialisation
 ******************************************************************************/

// connect to the default redis server
const redisClient = redis.createClient();

// sticky automatically forks the process up to the number of CPUs
if (!sticky.listen(http, process.env.PORT || 3000))
{
  // Master code
  http.once('listening', () =>
  {
    console.log(`Listening on ${(process.env.PORT || 3000)}`)
  });
}
else
{
  // Worker code, if any becomes necessary
}
