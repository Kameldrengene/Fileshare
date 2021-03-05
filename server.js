var app = require('./app');
var port = 8081;

var server = app.listen(port, function() {
  console.log('Express server listening on port ' + port);
});