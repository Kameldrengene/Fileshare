const express = require('express');
const fs = require('fs');
const fs_extra = require('fs-extra');  // in case there are files inside a folder
const mongo = require('mongodb');
const bodyParser = require('body-parser');
const async = require("async");
var router = express.Router();
const MongoClient = mongo.MongoClient;
const url = 'mongodb://localhost';
const port = 8081
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
        var user_id;
        var user_res = "user could not be created";
        //We could ust send req.body directly to the database, but this is more secure
        var newUser = {name: req.body.name, age: req.body.age};
        dbo.collection(USER_COLLECTION).insertOne(newUser, function (err, result) {
            if (err) throw err;
            user_id = result.insertedId;
            user_res = "User successfully created.";
            db.close().then(r => {
                if(r) throw r;
                const folder_res = createfolder(user_id);
                res.send(user_res+" " + folder_res)
            })
        });
    });
})
function createfolder(user_id,dbo) {
    const folderName = "./Users/"+user_id;
    var response_msg;
    try {
        if (!fs.existsSync(folderName)) {
            fs.mkdirSync(folderName)
            response_msg = "The folder "+"\""+user_id+"\""+" successfully created";
        }else
            response_msg = "The folder already exists for this user";
    } catch (error) {
        console.error(error)
        response_msg = error
    }
    return response_msg;
}
function deletefolder(user_id){
    const folder = './Users/'+user_id;
    var response_msg = "Folder not deleted";
    try{fs_extra.removeSync(folder,{recursive: true})
       response_msg = "The folder "+"\""+user_id+"\""+" is safely removed";
    }catch (error){
        response_msg = error;
    }
    console.log("delete folder "+response_msg)
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
        dbo.collection(USER_COLLECTION).deleteOne(query, function (err, result) {
            if (err){
                res.send(err);
            }else {
                const delete_res = "user is removed"
                const folder_res = deletefolder(req.params.id);
                res.send( delete_res+" "+folder_res+ " as well.");
            }
            db.close();
        })
    });
})

module.exports = router;



