const mongoose = require('mongoose')
const bluebird = require('bluebird')

mongoose.Promise = bluebird;

mongoose.connect('mongodb://localhost/hivemind');

let mongo = mongoose.connection;

mongo.on('error', console.error.bind(console, 'connection error: '));

mongo.once('open', function()
{
  console.log("Connected to hivemind db");
});

let models =
{
  User : mongoose.model('User' , require('./User.Schema.js'      )),
  Batch: mongoose.model('Batch', require('./Batch.Schema.js'     )),
  Sim  : mongoose.model('Sim'  , require('./Simulation.Schema.js'))
};

module.exports = models;
