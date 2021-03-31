var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
var jwt = require('jsonwebtoken');
const fs = require('fs');
var bcrypt = require('bcryptjs');
var config = require('../config');
var VerifyToken = require('./VerifyToken');
var User = require('../user/User');

router.get('/me', VerifyToken, function(req, res, next) {

    User.findById(req.userId, function (err, user) {
        if (err) return res.status(500).send("There was a problem finding the user.");
        if (!user) return res.status(404).send("No user found.");
        res.status(200).send(user);
    });
  
  });

router.get('/helloworld', VerifyToken, function(req, res) {
    res.status(200).send("Hello World!");
});

module.exports = router;