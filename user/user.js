var mongoose = require('mongoose');
var UserObject = new mongoose.Schema({
    name: String,
    password: String
});
mongoose.model('User', UserObject);

module.exports = mongoose.model('User');