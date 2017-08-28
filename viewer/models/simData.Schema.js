let mongoose = require('mongoose');
let Schema = mongoose.Schema;
// add a user field, which world/level,
// committedSites, total time
let dataSchema = Schema
({
  name: String,
  world: String,
  date: String,
  totalTicks: Number,
  influence: [Number],
  connectionsMeasure: [Number],
  clusteringMeasure: [Number],
  score: Number
});
//optional: save a lot of other data.

module.exports = dataSchema
