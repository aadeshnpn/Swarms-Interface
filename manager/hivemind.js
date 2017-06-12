const express = require('express')
var app = express();

const http = require('http').Server(app);
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const spawn = require('child_process').spawn;
const JSONStream = require('JSONStream');
const Models = require('./models');
const shortid = require('shortid');

const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

// use express' static fileserving middleware to serve everything in the
// public dir in the current dir
app.use( express.static( path.join(__dirname, 'public') ) );
app.use( bodyParser.json() );
app.use( cookieParser() );
app.use( bodyParser.urlencoded({extended: true}) );

const sendFileOptions =
{
  root: __dirname + '/public/'
};

app.get('/', function(req, res)
{
  console.log(req.cookies);

  if (req.cookies.user)
  {
    res.sendFile("controlPanel.html", sendFileOptions);
  }
  else
  {
    res.sendFile("login.html", sendFileOptions);
  }
})

app.post('/login', function(req, res)
{
  Models.User.findOne({username: req.body.username})
    .then(function(user)
    {
      if (user != null)
      {
        console.log("found user");
        res.cookie("user", user._id.toString(), {maxAge: 1000 * 60 * 60, httpOnly: true});
        res.sendFile("controlPanel.html", sendFileOptions);
      }
      else
      {
        console.log("making new user");
        user = new Models.User({username: req.body.username, password: "xxx"});

        user.save()
          .then(function(user)
          {
            res.cookie("user", user._id.toString(), {maxAge: 1000 * 60 * 60, httpOnly: true});
            res.sendFile("controlPanel.html", sendFileOptions);
          });
      }
    })
})

var userBatchesInProgress = {};

app.post('/startSimBatch', function(req, res)
{
  const sims = req.body.sims;

  Models.User.findById(ObjectId(req.cookies.user)).exec()
    .then( function(user)
    {
      if (!userBatchesInProgress[user._id.toString()])
      {
        userBatchesInProgress[user._id.toString()] = {};
      }

      let newBatch = new Models.Batch({owner: user._id, date: Date(), sims: []});
      return newBatch.save();
    })
    .then(function(batch)
    {
      var promises = [];

      for (var simReq of sims)
      {
        const simNum = parseInt(simReq.simNum, 10);
        const simType = simReq.simType;
        const worldType = simReq.worldType;

        console.log(`Running ${simNum} ${simType} simulations on ${worldType} worlds`);

        for (var i = 0; i < simNum; i++)
        {
          // -s puts the engine in stats mode which runs the entire sim and then dumps
          // stats at the end
          // still using jsonStreamParser in case output is huge
          let sim = spawn('python3.5', [path.join(__dirname, "../engine/beeEnvironment.py"), "-n", "-s", "-c", "-t", "10000", "-l", "recording.sim"], {stdio: ['pipe', 'pipe', process.stderr]});
          let jsonStreamParser = JSONStream.parse();

          // WARNING
          // voodoo follows

          var collectDataAndSaveToDb = makeDataCollectionFunc(
          {
            owner: batch.owner,
            type: simType,
            simNumber: i,
            batchId: batch._id
          });

          // YOU DON'T WANT TO KNOW

          // ok you probably need to

          // We can't send the stats back until it's all been saved to the db
          // so how can we tell? I make this promise here which is fulfilled
          // only after the jsonStreamParser has got something (guaranteed to be
          // the end of a sim) and it collects and saves the data

          // that function returns a promise that resolves when the db save on
          // the Batch is finished. so by doing .then(resolve) on that promise
          // this new promise will only resolve when the db has saved the Batch
          // with its results

          // by collecting all these promises for a batch and doing Promise.al()
          // on them, we have a spot to chain into that guarantees all sims have
          // finished and been saved to their respective Batch ObjectId

          // to the array of sim promises
          promises.push( new Promise( function(resolve, reject)
          {
            // push a new custom promise that doesn't resolve until

            // the json parser gets some data
            jsonStreamParser.on('data', function(engineJson)
            {
              // and we collect and save the data
              collectDataAndSaveToDb(engineJson)
                .then(resolve /* we're good */ );
            });
          }) );

          sim.stdout.pipe(jsonStreamParser);
        }
      }

      // this will only be resolved once all sims have finished thanks to the above
      userBatchesInProgress[batch.owner.toString()][batch._id.toString()] = Promise.all(promises);

      res.status(200).json({batchId: batch._id.toString()});
    });
});

app.get("/stats/:batch", function(req, res)
{
  const batchId = ObjectId(req.params.batch);

  if (!userBatchesInProgress[req.cookies.user] || !userBatchesInProgress[req.cookies.user][req.params.batch])
  {
      res.json({error: "No associated batches in progress"});
  }
  else
  {
    userBatchesInProgress[req.cookies.user][req.params.batch]
      .then(function()
      {
        return Models.Batch.findById(batchId).populate('sims').exec();
      })
      .then(function(batch)
      {
        userBatchesInProgress[req.cookies.user][req.params.batch] = null;

        if (batch == null)
        {
          res.json({error: "Bad batch id"});
        }
        else
        {
          res.json(batch);
        }
      });
  }

});

function makeDataCollectionFunc(parameters)
{
  let newSim = new Models.Sim(
  {
    owner: parameters.owner,
    type: parameters.type,
    date: Date(),
    simNumber: parameters.simNumber,
    tickData: [],
    world: null
  });

  return function(engineJson)
  {
    newSim.world = engineJson.world;
    newSim.parameters = engineJson.parameters;
    newSim.totalTicks = engineJson.ticks;
    newSim.tickData = engineJson.tickData;
    newSim.committedSites = engineJson.committedSites;

    // Mongoose doesn't automatically detect changes to Mixed data types
    newSim.markModified("world");
    newSim.markModified("parameters");
    newSim.markModified("tickData");
    newSim.markModified("committedSites");

    return newSim.save()
      .then(function(sim)
      {
        return Models.Batch.findById(parameters.batchId)
          .then(function(batch)
          {
            console.log(sim);
            batch.sims.push(sim._id);
            batch.markModified("sims");
            batch.save();
          });
      });
  }
}

http.listen(3333);
