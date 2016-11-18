var ipc = require('node-ipc');

var world = {x_limit: 500, y_limit: 400, width: 1000, height: 800, agents: []};

for (var i = 0; i < 100; i++)
{
   world.agents[i] =
   {
      id: i,
       x: Math.round( Math.random() * world.width - world.x_limit ),
       y: Math.round( Math.random() * world.height - world.y_limit),
      vx: Math.round((Math.random() * 9) + 1      ),
      vy: Math.round((Math.random() * 9) + 1      )
   };
}


var SIMULATION_THROTTLE_MS = 20;

ipc.config.socketRoot = '/tmp/';
ipc.config.appspace   = 'honeybee-sim.';
ipc.config.id         = 'viewerClient';
ipc.config.silent     = true;

ipc.connectTo('viewerServer');

ipc.of.viewerServer.on('connect', function()
{
   ipc.log('connected to server');
   //ipc.of.viewerServer.on('received', update);
   //ipc.of.viewerServer.emit('update', world);
   setInterval(update, SIMULATION_THROTTLE_MS);
});

function simulate()
{
   for (var i = 0; i < world.agents.length; i++)
   {
      var agent = world.agents[i];

      agent.x += agent.vx;
      agent.y += agent.vy;

      if (Math.abs(agent.x) >= world.x_limit)
      {
         agent.vx *= -1;
      }
      if (Math.abs(agent.y) >= world.y_limit)
      {
         agent.vy *= -1;
      }
   }
}

function update()
{
   simulate();
   ipc.of.viewerServer.emit('update', world);
}
