var express = require('express');
var app = express();
var db = require('./db');
var AuthController = require('./auth/AuthController');
var Fileupload = require('./fileupload');
var Users = require('./users');
app.use('/api/auth', AuthController);
app.use('/api/files', Fileupload);
app.use('/api/user', Users);
const urlschema = require('./url')

app.get('/:shortid',async function (req,res) {
    const shortid = req.params.shortid
    const schema = await urlschema.findOne({shortid:shortid})
    if(schema){
        res.download(schema.pathparams)
    }else
        res.status(404).send("error")
})
module.exports = app;