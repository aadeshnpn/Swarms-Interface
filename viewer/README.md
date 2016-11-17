# Swarm Viewer #

This is a nodejs app capable of visualising simulated swarm data. It has a client
and a server component, found in `index.js` and `index.html`, respectively.
`testsim.js` is a throwaway script to test IPC and develop with until we have the
proper simulation working.

## Server ##

The server is built on [Express][http://expressjs.com] and [socket.io][http://socket.io].
It's only purpose in life is to forward data from the simulation to all connected
clients. It handles IPC with [node-ipc][https://www.npmjs.com/package/node-ipc].
When adding more functionality, basic stuff ought to go in the sim and gui
client-specific data (selections, etc.) should stick to the client. This will help
us avoid performance issues.

### Server Todo ###

- We need to lock down our JSON format. The server currently expects output from
  the sim to be wrapped in JSON like so:

    {
      type: 'update',
      data: <world obj>     
    }

  where `<world obj>` is something along these lines:

    {
      width: ...,
      height: ...,
      agents: [ {id: ..., x: ..., y: ...}, ... ]
      obstacles: [ {x: ..., y: ..., width: ..., height: ...}, ... ]
    }

  We also need to decide how much and which info about all the entities the client
  is going to receive since it will have to be responsible for displaying it all
  to the user (i.e. having to query the sim for extra information we may want is
  a Bad Idea)

- We may want to shift the architecture here a bit so that the server spawns a sim
  sub-process instead of listening on a socket. We probably will want to have
  concurrent simulations and that will be an easier way to do it. And we wouldn't
  have to give up a global, persistent instance either.

## Client ##

The client takes the JSON sent by the server and renders it to an html5 canvas.
It should be up to the client to keep track of anything instance-specific. The
main work that needs to be done here is going to depend largely on our sim functionality,
but eventually aside from selection and detail views of agents, we're probably going to
want state changes, maybe obstacle drawing, agent spawning, deleting, etc.

### Client Todo ###

- make it look beautiful
- Stuff that stays completely client side, like the selections, is pretty easy
  to do right now, but we need to start thinking about how we're going to send
  commands back up to the server and the simulation. That's right, we need to
  Define More Protocol.
