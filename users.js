const express = require('express');
const fs = require('fs');
const mongo = require('mongodb');
const bodyParser = require('body-parser');
var router = express.Router();
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
var jwt = require('jsonwebtoken');
var VerifyToken = require('./auth/VerifyToken');
var config = require('./config');
var User = require('./user/User');


//var server = app.listen(port, function() {});

// accept json
router.use(bodyParser.json());

router.get("/users", VerifyToken, function(req, res) {
    User.find({}, function (err, users) {
        if (err) return res.status(500).send("There was a problem finding the users.");
        res.status(200).send(users);
    });
});

router.get("/:id", VerifyToken, function(req, res) {
    User.findById(req.params.id, function (err, user) {
        if (err) return res.status(500).send("There was a problem finding the user.");
        if (!user) return res.status(404).send("No user found.");
        res.status(200).send(user);
    });
});

router.post('/create', function(req, res) {

    //var hashedPassword = bcrypt.hashSync(req.body.password, 8);

    User.create({
        name : req.body.name,
        age : req.body.age
      }, 
      function (err, user) {
        if (err) return res.status(500).send("There was a problem registering the user`.");
    
        // if user is registered without errors
        // create a token
        var token = jwt.sign({ id: user._id }, config.secret, {
          expiresIn: 86400 // expires in 24 hours
        });
        //Create a folder for user
        var folderPath = createfolder(user._id);
    
        res.status(200).send({ auth: true, token: token, folder: folderPath });
      });
});

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

router.post("/update/:id", VerifyToken, function (req, res){
    User.findByIdAndUpdate(req.params.id, req.body, {new: true}, function (err, user) {
        if (err) return res.status(500).send("There was a problem updating the user.");
        res.status(200).send(user);
    });
});

router.post("/delete/:id", VerifyToken, function (req, res) {
    User.findByIdAndRemove(req.params.id, function (err, user) {
        if (err) return res.status(500).send("There was a problem deleting the user.");
        res.status(200).send("User: "+ user.name +" was deleted.");
    });
})

module.exports = router;



