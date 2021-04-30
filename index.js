var app = require('./app');
var port = process.env.PORT || 3000;

var server = app.listen(port, function() {
  console.log('Express server listening on port ' + port);
});

app.get('/', function(req, res){
  res.send('Hello world8');
});
