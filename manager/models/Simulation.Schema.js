let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let SimulationSchema = new Schema(
{
  owner: Schema.Types.ObjectId,
  type: String,
  date: Date,
  world: Number,
  totalTicks: Number,
  tickData: [Schema.Types.Mixed],
  committedSites: [Schema.Types.Mixed],
  world: Schema.Types.Mixed,
  parameters: Schema.Types.Mixed
})

module.exports = SimulationSchema;
