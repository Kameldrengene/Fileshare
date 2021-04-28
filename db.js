var mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/test_database', { useNewUrlParser: true, useUnifiedTopology: true  });