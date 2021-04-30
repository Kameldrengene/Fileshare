const express = require('express');
const fs = require('fs');
const fs_extra = require('fs-extra');  // in case there are files inside a folder
const mongo = require('mongodb');
const bodyParser = require('body-parser');
const async = require("async");
var router = express.Router();
var cors = require('cors');
router.use(bodyParser.urlencoded({extended: false}));
router.use(bodyParser.json());
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var VerifyToken = require('./auth/VerifyToken');
var config = require('./config');
var User = require('./user/User');

router.use(cors())
//var server = app.listen(port, function() {});

// accept json
router.use(bodyParser.json());

router.get("/users", VerifyToken, function (req, res) {
    User.find({}, function (err, users) {
        if (err) return res.status(500).send("There was a problem finding the users.");
        res.status(200).send(users);
    });
});

router.get("/:id", VerifyToken, function (req, res) {
    User.findById(req.params.id, function (err, user) {
        if (err) return res.status(500).send("There was a problem finding the user.");
        if (!user) return res.status(404).send("No user found.");
        res.status(200).send(user);
    });
});

router.post('/create', function (req, res) {

    var hashedPassword = bcrypt.hashSync(req.body.password, 8);
    User.findOne({email: req.body.email}, function (err, user) {
        console.log(user);
        if (user) {
            res.status(500);
            res.send('Mail in use');
            return null;
        }// return res.status(500).send('Mail in use');
        User.create({
                email: req.body.email,
                password: hashedPassword,
                name: req.body.name,
                age: req.body.age
            },
            function (err, user) {
                if (err) return res.status(500).send("There was a problem registering the user`.");
                // if user is registered without errors
                // create a token
                var token = jwt.sign({id: user._id}, config.secret, {
                    expiresIn: 86400 // expires in 24 hours
                });
                //Create a folder for user
                var folderPath = createfolder(user._id);

                res.status(200).send({auth: true, token: token, id: user._id,folder: folderPath});
            });
    });
});

function createfolder(user_id) {
    const folderName = './Users/' + user_id;
    var response_msg;
    try {
        if (!fs.existsSync(folderName)) {
            fs.mkdirSync(folderName)
            response_msg = "The folder " + "\"" + user_id + "\"" + " successfully created";
        } else
            response_msg = "The folder already exists for this user";
    } catch (error) {
        console.error(error)
        response_msg = error
    }
    return response_msg;
}

function deletefolder(user_id) {
    const folder = './Users/' + user_id;
    var response_msg = "Folder not deleted";
    try {
        fs_extra.removeSync(folder, {recursive: true})
        response_msg = "The folder " + "\"" + user_id + "\"" + " is safely removed";
    } catch (error) {
        response_msg = error;
    }
    console.log("delete folder " + response_msg)
    return response_msg;
}

router.post("/update/:id", VerifyToken, function (req, res) {
    var hashedPassword = bcrypt.hashSync(req.body.password, 8);
    req.body.password = hashedPassword;
    User.findByIdAndUpdate(req.params.id, req.body, {new: true}, function (err, user) {
        if (err) return res.status(500).send("There was a problem updating the user.");
        res.status(200).send(user);
    });
});

router.post("/delete/:id", VerifyToken, function (req, res) {
    if(req.userId != req.params.id) return res.status(401).send("No permission to delete user");
    User.findByIdAndRemove(req.params.id, function (err, user) {
        if (err || !user) return res.status(500).send("There was a problem deleting the user.");
        deletefolder(req.params.id);
        res.status(200).send("User: " + user.name + " was deleted.");
    });
})

module.exports = router;



