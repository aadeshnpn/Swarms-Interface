const mongoose = require('mongoose')
const bluebird = require('bluebird')

mongoose.Promise = bluebird;

mongoose.connect('mongodb://localhost/hivemind');

let mongo = mongoose.connection;

mongo.on('error', console.error.bind(console, 'connection error: '));

mongo.once('open', function()
{
  console.log("Connected to db")
});

let models =
{

};
module.exports = models;
