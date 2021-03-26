var express = require('express');
var app = express();

var AuthController = require('./auth/AuthController');
var Users = require('./users');
app.use('/api/auth', AuthController);
app.use('/api/user', Users);
module.exports = app;