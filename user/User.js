var mongoose = require('mongoose');
var UserSchema = new mongoose.Schema({
    name: String,
    age: String
});
mongoose.model('User', UserSchema);

module.exports = mongoose.model('User');