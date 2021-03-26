const express = require('express');
const fs = require('fs');
const mongo = require('mongodb');
const bodyParser = require('body-parser');
var router = express.Router();
const MongoClient = mongo.MongoClient;
const url = 'mongodb://localhost';
const port = 3000
var VerifyToken = require('./auth/VerifyToken');

const DATABASE = "test_database"
const USER_COLLECTION = "users"

//var server = app.listen(port, function() {});

// accept json
router.use(bodyParser.json());

router.get("/users", VerifyToken, function(req, res) {
    MongoClient.connect(url, function(err, db) {
        var docs = db.db(DATABASE).collection(USER_COLLECTION).find({});

        docs.toArray(function(err, item) {
            if (err) throw err;
            res.send(item);
        });
        db.close();
    });
});

router.get("/:id", function(req, res) {
    MongoClient.connect(url, function(err, db) {
        var objectId = new mongo.ObjectID(req.params.id);
        var doc = db.db(DATABASE).collection(USER_COLLECTION).find({_id: objectId});
        doc.toArray(function(err, item) {
            if (err) throw err;
            res.send(item);
        });
        db.close();
    });
});

router.post("/create", function(req, res) {
    MongoClient.connect(url, function (err, db) {
        var dbo = db.db(DATABASE);
        //We could ust send req.body directly to the database, but this is more secure
        var newUser = {name: req.body.name, age: req.body.age};
        dbo.collection(USER_COLLECTION).insertOne(newUser, function (err, result) {
            if (err) throw err;
            userid = result.insertedId;
            user_res = "User successfully created.";
            folder_res = createfolder(userid)
            res.send(user_res+" " + folder_res)
        });
    });
})
function createfolder(user_id) {
    const folderName = './Users/'+user_id;
    var response_msg;
    try {
        if (!fs.existsSync(folderName)) {
            fs.mkdirSync(folderName)
            response_msg = "The folder "+"\""+user_id+"\""+" successfully created";
        }else
            response_msg = "The folder is already created for this user";
    } catch (error) {
            console.error(error)
    }
    return response_msg;
}

router.post("/update/:id", function (req, res){
    MongoClient.connect(url, function(err, db) {
        var dbo = db.db(DATABASE);
        var objectId = new mongo.ObjectID(req.params.id);
        var query = {_id: objectId};
        var newUser = { $set: {name: req.body.name, age: req.body.age}};
        dbo.collection(USER_COLLECTION).updateOne(query, newUser, function (err, res){
            if(err) throw err;
            db.close();
        })
    });
});

router.post("/delete/:id", function (req, res) {
    MongoClient.connect(url, function (err, db) {
        var dbo = db.db(DATABASE);
        var objectId = new mongo.ObjectID(req.params.id);
        var query = {_id: objectId};
        dbo.collection(USER_COLLECTION).deleteOne(query, function (err, res) {
            if (err) throw err;
            db.close();
        })
    });
})

module.exports = router;



