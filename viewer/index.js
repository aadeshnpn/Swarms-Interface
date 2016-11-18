// Express is the web server frameworke. It handles all the low level http
// stuff. It initialises an 'app' object which we use to define what we'll
// do with particular requests
var app = require( 'express' )();

// Express returns a Server object. The only thing we really care about with
// this is to have it start listening for incoming connections
var http = require( 'http' ).Server( app );

// socket.io is what makes everything work. It runs on top of express and
// abstracts away loads of http gore to essentially give us a bi-directional
// WebSocket. We define event handling and routes on this io object
var io = require( 'socket.io' )( http );

// The server's job should be essentially to grab world info from the simulation
// engine and pass it on to the client, nothing else.

var numClients = 0;

/*******************************************************************************
 * IPC setup
 ******************************************************************************/

// TODO: this may all need to change depending on what works with python

// IPC package
var ipc = require('node-ipc');

// Socket path is formed from these three, i.e. "/tmp/honeybee-sim.viewer-server"
ipc.config.socketRoot = '/tmp/';
ipc.config.appspace   = 'honeybee-sim.';
ipc.config.id         = 'viewerServer';
ipc.config.silent     = true;
ipc.config.rawBuffer  = true;
//ipc.config.retry = 1500;

ipc.serve();

ipc.server.on('start', function()
{
   // We expect data in JSON according to the following format:
   // '{ type: "update", data: <world object> }'

   ipc.server.on('data', function(buffer, client)
   {
      var msg = buffer.toString();
      var msgJson = JSON.parse(msg);

      io.sockets.emit("update", msgJson.data);
      ipc.server.emit(client, 'received');
   });

   /*ipc.server.on('update', function(world, client)
   {
      //console.log(world);
      io.sockets.emit("update", world);
      ipc.server.emit(client, 'received');
   });*/
});

ipc.server.start();

/*******************************************************************************
 * Route definition
 ******************************************************************************/

// On an http GET /, serve index.html
app.get( '/', function( req, res )
{
   res.sendFile( 'index.html',
   {
      root: __dirname
   } );
} );


/*******************************************************************************
 * Server initialisation
 ******************************************************************************/

// Listen on PORT env var or 3000 if undefined
http.listen( process.env.PORT || 3000, function()
{
   console.log( 'listening on *:' + (process.env.PORT || 3000) );
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
   console.log("Client " + socket.id + " connected.    (" + numClients + " total)");

   socket.on( 'disconnect', function()
   {
      numClients--;
      console.log("Client " + socket.id + " disconnected. (" + numClients + " total)");
   } );
} );
