var mongoose = require('mongoose');
mongoose.connect('mongodb://mongo:27017/fileshare', { useNewUrlParser: true, useUnifiedTopology: true  }).then(()=> console.log('MongoDB Connected!')).catch(err => console.log(err+' Failed to connect to DB!!!!'));
console.log("TEST!!!!!!");
