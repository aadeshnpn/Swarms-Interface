// Express is the web server frameworke. It handles all the low level http
// stuff. It initialises a server based off the basic node httpserver which
// we can then use to define http routes
const express = require( 'express' );
var app = express();

// express() returns a Server object. The only thing we really care about with
// this is to have it start listening for incoming connections
const http = require( 'http' ).Server( app );

// socket.io is what makes everything work. It runs on top of express and
// abstracts away loads of http gore to essentially give us a bi-directional
// WebSocket. We define event handling and routes on this io object
const io = require( 'socket.io' )( http );

// sticky makes socket.io work with the cluster module
const sticky = require('sticky-session');

// shortid for world id gen
const shortid = require('shortid');

// cluster lets us split the process to take advantage of multiple cores
const cluster = require('cluster');

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

// The server's job should be essentially to grab world info from the simulation
// engine and pass it on to the client, nothing else.

var numClients = 0;
var socketIpcPair = {};

var clients = {};
var clientForSocket = {};

// Client class basically bundles everything we need to interact simultaneously
// with the web client and the engine process
class Client
{
   constructor(worldId)
   {
      this.id = shortid.generate();
      this.worldId = worldId;
      this.jsonStreamParser = JSONStream.parse("data");

      // because of weirdness with how JS handles 'this', we have to play some
      // closure games and create a listener function that captures a reference
      // to this client object
      this.jsonStreamParser.on('data', this.makeUpdateFunc(this));
      this.webSocket = null;
   }

   start()
   {
      this.world = null;

      if (Client.worlds[this.worldId] !== undefined)
      {
         this.world = Client.worlds[this.worldId];
      }
      else
      {
         const engine = spawn('python', [path.join(__dirname, '../environment_code/Environment.py')], {stdio: ['pipe', 'pipe', process.stderr]});
         engine.on('error', (err) => { console.error("[!] Unable to start engine process: " + err)});

         this.world = {engine: engine, clientsAttached: 0};
         Client.worlds[this.worldId] = this.world;
      }

      this.world.clientsAttached++;

      // pipe stdout from the engine to our stream parser
      this.world.engine.stdout.pipe(this.jsonStreamParser);
   }

   // Data should be any arbitrary JSON object
   input(data)
   {
      this.world.engine.stdin.write(JSON.stringify(data) + "\n"); // python's readline requires a newline or it blocks
   }

   // creates a listener for the JSON stream parser's updates
   // takes a reference to the creating class
   makeUpdateFunc(self)
   {
      // return a new anonymous function
      return function(data)
      {
         // use 'self' instead of 'this'
         if (self.webSocket !== null)
         {
            self.webSocket.emit("update", data);
         }
      }
   }

   stop()
   {
      const world = Client.worlds[this.worldId];

      if (--world.clientsAttached == 0)
      {
         world.engine.kill();
         Client.worlds[this.worldId] = undefined;
      }
   }
}

// workaround for static members
Client.worlds = {};

/*******************************************************************************
 * Route definition
 ******************************************************************************/

app.use(express.static(path.join(__dirname, "public")));

// On an http GET /, serve index.html
app.get( '/', function( req, res )
{
   const worldId = (req.query.id !== null) ? req.query.id : shortid.generate();
   const client = new Client(worldId);

   clients[client.id] = client;
   client.start();

   res.cookie("clientId", client.id);

   res.sendFile( 'index.html',
   {
      root: __dirname
   } );
} );

// On a request for 'client.js', minify and concat all the relevant scripts, then
// serve it

app.get('/client.js', function( req, res )
{
  minifier.minify(
    {
      //compressor: 'babili',    //production
      compressor: 'no-compress', //debug
      input:      'js/**/*.js',
      output:     'client.js'
    }
  )
  // ASK ME TO EXPLAIN PROMISES IF YOU DON'T KNOW THIS
  .then(function(minified)
  {
    //console.log(minified);
    res.sendFile( 'client.js',
      {
        root: __dirname
      });
  })
  .catch(function(err)
  {
    console.log(err);
    cleanup();
  });

} );

/*******************************************************************************
 * WebSocket configuation
 ******************************************************************************/

// On any new connection, we're passed a socket object representing that
// that specific connection. Any socket specific setup has to be done on that
// object, not the global io object
io.on( 'connection', function( socket )
{
   numClients++;
   console.log(`Client connected.    (${numClients} total)`);

   socket.on('clientId', function(id)
   {
      if (clients[id] !== undefined)
      {
         clients[id].webSocket = socket;
      }
      clientForSocket[socket.id] = clients[id];
   });

   socket.on('input', function(data)
   {
      clientForSocket[socket.id].input(data);
   });

   socket.on( 'disconnect', function()
   {
      numClients--;
      console.log(`Client disconnected. (${numClients} total)`);

      const client = clientForSocket[socket.id];

      if (client !== undefined)
      {
         clients[client.id] = undefined;
         clientForSocket[socket.id].stop();
         clientForSocket[socket.id] = undefined;
      }
   } );
} );


function cleanup()
{
   process.exit();
}

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

 /*******************************************************************************
  * Server initialisation
  ******************************************************************************/

// sticky automatically forks the process up to the number of CPUs
if(!sticky.listen( http, process.env.PORT || 3000))
{
   // Master code
   http.once('listening', () => { console.log(`Listening on ${(process.env.PORT || 3000)}`)});
}
else
{
   // Worker code, if any becomes necessary
}
