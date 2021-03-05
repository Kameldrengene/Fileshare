const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost';
const port = 8081
app.route('/Login/user').get(function(req, res)
{
    MongoClient.connect(url, function(err, db) {
        var dbo = db.db('Login');
        var cursor = dbo.collection("User").find({});
        //noinspection JSDeprecatedSymbols
        cursor.toArray(function(err, item) {
            res.type('json');
            res.status(201);
            res.send(JSON.stringify(item));
        });

        db.close();
    });
});
var server = app.listen(port, function() {});