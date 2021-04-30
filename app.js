var express = require('express');
var app = express();
var cors = require('cors');
var db = require('./db');
var AuthController = require('./auth/AuthController');
var Fileupload = require('./fileupload');
var Users = require('./users');
app.options('*',cors());
app.use('/api/auth', AuthController);
app.use('/api/files', Fileupload);
app.use('/api/user', Users);

module.exports = app;