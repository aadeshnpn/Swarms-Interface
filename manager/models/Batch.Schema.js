let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let BatchSchema = new Schema(
{
    owner: Schema.Types.ObjectId,
    date: Date,
    sims: [{type: Schema.Types.ObjectId, ref: 'Sim'}]
})

module.exports = BatchSchema;
