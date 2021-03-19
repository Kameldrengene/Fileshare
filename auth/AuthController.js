var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var config = require('../config');
var VerifyToken = require('./VerifyToken');

router.post('/register', function(req, res) {

    //var hashedPassword = bcrypt.hashSync(req.body.password, 8);
    var token = jwt.sign({ id: 'bar' }, config.secret, {
        expiresIn: 86400 // expires in 24 hours
    });
    res.status(200).send({ auth: true, token: token });
});


/*router.get('/me', function(req, res) {
    var token = req.headers['x-access-token'];
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

    jwt.verify(token, config.secret, function(err, decoded) {
        if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
        
        res.status(200).send("Token Valid")
        /*User.findById(decoded.id,{ password: 0}, function (err, user) {
            if (err) return res.status(500).send("There was a problem finding the user.");
            if (!user) return res.status(404).send("No user found.");
            
            res.status(200).send(user);
        });*/
    //});
//});





router.get('/me', VerifyToken, function(req, res, next) {
    res.status(200).send("Token Valid!");
});

router.get('/helloworld', VerifyToken, function(req, res) {
    res.status(200).send("Hello World!");
});

module.exports = router;