let mongoose = require('mongoose');
let Schema = mongoose.Schema;
// add a user field, which world/level,
// committedSites, total time
let dataSchema = Schema
({
  name: String,
  date: String,
  totalTicks: Number,
  influence: [Number],
  xPos: [[Number]],
  yPos: [[Number]]
});
//optional: save a lot of other data.

module.exports = dataSchema
