const mongoose = require('mongoose')
const bluebird = require('bluebird')

mongoose.Promise = bluebird;

mongoose.connect('mongodb://localhost/hivemind',{
    useMongoClient: true
});

let mongo = mongoose.connection;

mongo.on('error', console.error.bind(console, 'connection error: '));

mongo.once('open', function()
{
  //console.log("Connected to db")

});
//mongo.openUri('mongodb://localhost/hivemind', {}).then(function(){console.log('connected to db')});

let models =
{
    simData : mongoose.model('simData' , require('./simData.Schema.js')),
    posSimData: mongoose.model('posSimData', require('./allSimData.Schema.js'))
};
module.exports = models;
