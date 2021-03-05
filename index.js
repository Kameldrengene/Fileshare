var express = require('express');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost';
app.route('/Login/user').get(function(req, res)
{
    MongoClient.connect(url, function(err, db) {
        var dbo = db.db('Login');
        var cursor = dbo.collection("User").find({});
        //noinspection JSDeprecatedSymbols
        cursor.toArray(function(err, item) {
            res.type('json');
            res.send(JSON.stringify(item));
        });

        db.close();
    });
});
var server = app.listen(8081, function() {});