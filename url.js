var mongoose = require('mongoose');
var urlSchema = new mongoose.Schema({
    shortid: String,
    pathparams: String,
    createdAt: {type:Date}
});

module.exports = mongoose.model('url',urlSchema)

