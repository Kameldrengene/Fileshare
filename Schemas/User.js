var mongoose = require('mongoose');
var UserSchema = new mongoose.Schema({
    email: String,
    password: String,
    name: String,
    age: String
});
mongoose.model('User', UserSchema);

module.exports = mongoose.model('User');