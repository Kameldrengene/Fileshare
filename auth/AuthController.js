var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var cors = require('cors');
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
var jwt = require('jsonwebtoken');
const fs = require('fs');
var bcrypt = require('bcryptjs');
var config = require('../config');
var VerifyToken = require('./VerifyToken');
var User = require('../user/User');

router.use(cors());

router.get('/me', VerifyToken, function(req, res, next) {

    User.findById(req.userId,{password: 0}, function (err, user) {
        if (err) return res.status(500).send("There was a problem finding the user.");
        if (!user) return res.status(404).send("No user found.");
        res.status(200).send(user);
    });
});

router.post('/login',function (req, res) {
    User.findOne({email: req.body.email}, function (err, user) {
        if(err) return res.status(500).send('Server error!');
        if(req.body.email == null) return res.status(400).send('Email missing!');
        if(req.body.password == null) return res.status(400).send('Password missing!');
        if(!user) return res.status(404).send('No user found!');

        if(!bcrypt.compareSync(req.body.password, user.password))
            return res.status(401).send({Response:'Incorrect credentials!'});

        var token = jwt.sign({id: user._id}, config.secret, {
            expiresIn: 86400 // expires in 24 hours
        });
        res.status(200).send({token:token, files:'/api/files/', id: user._id, user:'/api/auth/me'});
    });
});

router.get('/helloworld', VerifyToken, function(req, res) {
    res.status(200).send("Hello World!");
});

module.exports = router;