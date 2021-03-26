var express = require('express');
var app = express();

var AuthController = require('./auth/AuthController');
var Users = require('./users');
var Fileupload = require('./fileupload');
app.use('/api/auth', AuthController);
app.use('/api/user', Users);
app.use('/api/files', Fileupload);

module.exports = app;