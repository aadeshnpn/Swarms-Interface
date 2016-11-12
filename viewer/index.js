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

//var worlds = [];
var numClients = 0;

// This will be used as a hash of selected agents by client id
// e.g. clientSelected[clientId][agentId] = true if selected, unset otherwise
var clientSelected = [];

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
//ipc.config.retry = 1500;

ipc.serve();

ipc.server.on('start', function()
{
   // We expect data in JSON according to the following format:
   // '{ type: "update", data: <world object> }'
   console.log('started');
   ipc.server.on('update', function(world, client)
   {
      // Loop through each connected client so we can add a 'selected' tag
      // onto their agents
      /*for (var socketId in io.sockets.connected)
      {
         var socket = io.sockets.connected[socketId];

         // NOTE: this is a reference, not a deep copy,
         //       so unless we change that we have to make
         //       sure agent ui props are properly reset on each pass
         var agents = world.agents;

         for (var i = 0; i < agents.length; i++)
         {
            var agent = agents[i];

            if (clientSelected[socket.id] && clientSelected[socket.id][agent.id] == true)
            {
               // TODO: hide ui stuff under a agent.ui object?
               agent.selected = true;
            }
            else
            {
               // avoid other clients getting the wrong agents selected
               agent.selected = false;
            }

            socket.emit("update", world);
         }*/

         io.sockets.emit("update", world);
         ipc.server.emit(client, 'received');
      //};
   });
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
   //worlds[ socket.id ] = newWorld();

   /*var closure = function()
   {
      update( socket );
   }

   var interval = setInterval( closure, 16 );*/

   numClients++;
   console.log("Client " + socket.id + " connected. (" + numClients + " total)");

   socket.on( 'disconnect', function()
   {
      //clearInterval( interval );
      //worlds[ socket.id ] = null;
      numClients--;
      console.log("Client " + socket.id + " disconnected. (" + numClients + " total)");
   } );

   // Pure UI functionality like this (selecting/unselecting) should be handled
   // here in the server (i.e., the engine shouldn't know or care about it).
   // We'll need something similar to what I have below keeping track of which
   // entities have been selected so we can mark them as such on new updates
   // before sending it out to the client

   // expects an array of selected ids
   socket.on( 'select', function( ids )
   {
      clientSelected[socket.id] = ids;
   } );

   /*socket.on( 'pause', function( ids )
   {
      var agents = worlds[socket.id].agents;

      if (ids == -1)
      {
         for (var i = 0; i < agents.length; i++)
         {
            agents[i].state = "paused";
         }
      }
      else
      {
         for (var i = 0; i < ids.length; i++)
         {
            worlds[ socket.id ].agents[ ids[i] ].state = "paused";
         }
      }
   } );

   socket.on( 'resume', function( ids )
   {
      var agents = worlds[socket.id].agents;

      if (ids == -1)
      {
         for (var i = 0; i < agents.length; i++)
         {
            agents[i].state = "normal";
         }
      }
      else
      {
         for (var i = 0; i < ids.length; i++)
         {
            worlds[ socket.id ].agents[ ids[i] ].state = "normal";
         }
      }
   } );*/

   socket.on( 'deselect', function()
   {
      clientSelected[socket.id] = [];
   } );

} );

/*******************************************************************************
 * Leftover from the default sim
 *******************************************************************************

/*function update( socket )
{
   var world = worlds[ socket.id ];

   for ( var i = 0; i < world.agents.length; i++ )
   {
      var agent = world.agents[ i ];

      if (agent.state == "paused")
      {
         continue;
      }

      agent.x += agent.vX;
      agent.y += agent.vY;

      if ( agent.x <= 0 || agent.x >= world.width )
      {
         agent.vX *= -1;
      }
      if ( agent.y <= 0 || agent.y >= world.height )
      {
         agent.vY *= -1;
      }
   }

   socket.emit( "update", world );
}*/

/*function newWorld()
{
   world = {
      "width": 500,
      "height": 500,
      "agents": []
   };

   for ( var i = 0; i < ( Math.round( Math.random() * 80 ) + 20 ); i++ )
   //for ( var i = 0; i < 1000; i++ )
   {
      world.agents[ i ] = {
         id: i,
         x: Math.round( Math.random() * world.width ),
         y: Math.round( Math.random() * world.height ),
         vX: Math.round( Math.random() * 4 ) + 1,
         vY: Math.round( Math.random() * 4 ) + 1,
         selected: false,
         state: "normal"
      }
   }

   return world;
}*/
