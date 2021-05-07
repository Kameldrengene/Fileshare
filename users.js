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
var User = require('./Schemas/User');

router.use(cors())
//var server = app.listen(port, function() {});

// accept json
router.use(bodyParser.json());

/*router.get("/users", VerifyToken, function (req, res) {
    const contents = [];

    //  Find users
    User.find({}, function (err, users) {
        if (err) return res.status(500).send("There was a problem finding the users.");

        users.forEach(function(item, index) {
            let user = JSON.parse(JSON.stringify(item));

            //  REST Level 3
            user.options = {
                getUser: "/api/Schemas/" + item._id,
                updateUser: "/api/Schemas/update/" + + item._id,
                deleteUser: "/api/Schemas/delete/" + item._id,
                createNewUser: "/api/Schemas/create",
            };
            contents.push(user);
        });

        res.status(200).send(contents);
    });
});*/

router.get("/:id", VerifyToken, function (req, res) {

    //  Check rights
    if(req.userId != req.params.id) return res.status(401).send("No permission to show Schemas");

    //  Find Schemas
    User.findById(req.params.id, {password: 0}, function (err, user) {
        if (err) return res.status(500).send("There was a problem finding the Schemas.");
        if (!user) return res.status(404).send("No Schemas found.");
        let userCopy = JSON.parse(JSON.stringify(user));

        //  REST Level 3
        userCopy.options = {
            updateUser: "/api/user/update/" + user._id,
            deleteUser: "/api/user/delete/" + user._id,
            createNewUser: "/api/user/create",
	    getUserFiles: "/api/files",
        }

        res.status(200).send(userCopy);
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
                if (err) return res.status(500).send("There was a problem registering the Schemas`.");
                // if Schemas is registered without errors
                // create a token
                var token = jwt.sign({id: user._id}, config.secret, {
                    expiresIn: 86400 // expires in 24 hours
                });
                //Create a folder for Schemas
                var folderPath = createfolder(user._id);

                //todo her sendes altid 200 - hvad hvis der sker fejl i createFolder?
            res.status(200).send({
                auth: true,
                token: token,
                id: user._id,
                folder: folderPath,

                //  REST Level 3
                options: {
                    getUser: "/api/user/" + user._id,
                    updateUser: "/api/user/update/" + user._id,
                    deleteUser: "/api/user/delete/" + user._id,
		    getUserFiles: "/api/files",
                }
            });
        });
    });
});


function createfolder(user_id) {
    const folderName = './UserData/' + user_id;
    var response_msg;
    try {
        if (!fs.existsSync(folderName)) {
            fs.mkdirSync(folderName)
            response_msg = "The folder " + "\"" + user_id + "\"" + " successfully created";
        } else
            response_msg = "The folder already exists for this Schemas";
    } catch (error) {
        console.error(error)
        response_msg = error
    }
    return response_msg;
}

function deletefolder(user_id) {
    const folder = './UserData/' + user_id;
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

router.put("/update/:id", VerifyToken, function (req, res) {

    //  Check rights
    if(req.userId != req.params.id) return res.status(401).send("No permission to update Schemas");

    //  Encrypt password
    var hashedPassword = bcrypt.hashSync(req.body.password, 8);
    req.body.password = hashedPassword;

    //  Find and update
    User.findByIdAndUpdate(req.params.id, req.body, {new: true},{password: 0}, function (err, user) {
        if (err) return res.status(500).send("There was a problem updating the Schemas.");
        let userCopy = JSON.parse(JSON.stringify(user));

        //  REST Level 3
        userCopy.options = {
            getUser: "/api/user/" + user._id,
            deleteUser: "/api/user/delete/" + user._id,
            createNewUser: "/api/user/create",
	    getUserFiles: "/api/files",
        };

        res.status(200).send(userCopy);
    });
});

router.delete("/delete/:id", VerifyToken, function (req, res) {

    //  Check rights
    if(req.userId != req.params.id) return res.status(401).send("No permission to delete Schemas.");

    //  Find and remove
    User.findByIdAndRemove(req.params.id, function (err, user) {
        if (err || !user) return res.status(500).send("There was a problem deleting the Schemas.");
        deletefolder(req.params.id);

        //REST Level 3
        res.status(200).send({
            action: "User: " + user.name + " (" + user._id + ") " + " was deleted.",
            options: {
                createNewUser: "/api/Schemas/create",
            }
        });
    });
})

module.exports = router;

