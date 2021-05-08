var mongoose = require('mongoose');
if (process.env.NODE_ENV === 'test'){
    mongoose.connect('mongodb://mongo:27017/fileshare', { useNewUrlParser: true, useUnifiedTopology: true  }).then(()=> console.log('MongoDB Connected!')).catch(err => console.log(err+' Failed to connect to DB!!!!'));
}else{
mongoose.connect('mongodb://mongo:27017/fileshare', { useNewUrlParser: true, useUnifiedTopology: true  }).then(()=> console.log('MongoDB Connected!')).catch(err => console.log(err+' Failed to connect to DB!!!!'));
console.log("TEST!!!!!!");
}