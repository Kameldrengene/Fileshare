var http = require('http'),
    fs = require('fs'),
    mongo = require('mongodb').MongoClient;
const { MongoClient } = require('mongodb');

var url = "mongodb://130.225.170.68:27017/";

function getUsersAsync() {
    return new Promise(resolve => {
        //resolve(getUsers());
        resolve('Test');
    });
}
function getUsers() {

    MongoClient.connect(url, function (err, db) {
        if (err) return console.log(err);
        console.log("Database Connected!");
        var dbo = db.db("Login");
        dbo.collection("User").find({}).toArray(function (err, result) {
            if (err) return console.log(err);
            console.log(result);
        });
        db.close();
        return result;
    });
}


const server = http.createServer();
server.on('request', async (req, res) => {
    const data = await getUsersAsync();
    console.log(data);
    res.end(data);
});
server.listen(8081);


