let mongoose = require('mongoose');
let Schema = mongoose.Schema;
// add a user field, which world/level,
// committedSites, total time
let dataSchema = Schema
({
  name: String,
  date: Date,
  totalTicks: Number,
  influence: [Schema.Types.Mixed],
  redundancy: [Schema.types.Mixed]    
});

module.exports = dataSchema
