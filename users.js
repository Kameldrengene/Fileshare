const express = require('express');
const fs = require('fs');
const fs_extra = require('fs-extra');  // in case there are files inside a folder
const mongo = require('mongodb');
const bodyParser = require('body-parser');
const app = express();
const MongoClient = mongo.MongoClient;
const url = 'mongodb://localhost';
const port = 8081

const DATABASE = "test_database"
const USER_COLLECTION = "users"

var server = app.listen(port, function() {});

// accept json
app.use(bodyParser.json());

app.get("/users", function(req, res) {
    MongoClient.connect(url, function(err, db) {
        var docs = db.db(DATABASE).collection(USER_COLLECTION).find({});

        docs.toArray(function(err, item) {
            if (err) throw err;
            res.send(item);
        });
        db.close();
    });
});

app.get("/user/:id", function(req, res) {
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

app.post("/user/create", function(req, res) {
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
            response_msg = "The folder already exists for this user";
    } catch (error) {
            console.error(error)
    }
    return response_msg;
}
async function deletefolder(user_id){
    const folder = './Users/'+user_id;
    var response_msg = "Folder not deleted";
    await fs_extra.remove(folder, err => {
                if (err)
                    return response_msg = err;
                else
                    return response_msg = "The folder "+"\""+user_id+"\""+" is safely removed";
            });
}

app.post("/user/update/:id", function (req, res){
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

app.post("/user/delete/:id", function (req, res) {
    MongoClient.connect(url, function (err, db) {
        var dbo = db.db(DATABASE);
        var objectId = new mongo.ObjectID(req.params.id);
        var query = {_id: objectId};
        dbo.collection(USER_COLLECTION).deleteOne(query, function (err, result) {
            if (err){
                res.send(err);
            }else {
                const delete_res = "user is removed"
                const folder_res = deletefolder(req.params.id).then(function (result){
                    console.log("inside log: "+result);
                })
                res.send( delete_res+" "+folder_res);
            }
            db.close();
        })
    });
})





