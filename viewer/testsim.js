var ipc = require('node-ipc');

var world = {width: 1000, height: 800, agents: []};

for (var i = 0; i < 100; i++)
{
   world.agents[i] =
   {
       x: Math.round( Math.random() * world.width ),
       y: Math.round( Math.random() * world.height),
      vx: Math.round((Math.random() * 9) + 1      ),
      vy: Math.round((Math.random() * 9) + 1      )
   };
}

ipc.config.socketRoot = '/tmp/';
ipc.config.appspace   = 'honeybee-sim.';
ipc.config.id         = 'viewerClient';
ipc.config.silent     = true;

ipc.connectTo('viewerServer');

ipc.of.viewerServer.on('connect', function()
{
   ipc.log('connected to server');
   ipc.of.viewerServer.on('received', update);
   ipc.of.viewerServer.emit('update', world);
});

function simulate()
{
   for (var i = 0; i < world.agents.length; i++)
   {
      var agent = world.agents[i];

      agent.x += agent.vx;
      agent.y += agent.vy;

      if (agent.x >= world.width || agent.x <= 0)
      {
         agent.vx *= -1;
      }
      if (agent.y >= world.height || agent.y <= 0)
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
