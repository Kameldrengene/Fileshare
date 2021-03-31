var express = require('express');
var app = express();
var db = require('./db');
var AuthController = require('./auth/AuthController');
var Fileupload = require('./fileupload');
var Users = require('./users');
app.use('/api/auth', AuthController);
app.use('/api/files', Fileupload);
app.use('/api/user', Users);

module.exports = app;