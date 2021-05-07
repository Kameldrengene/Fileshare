var app = require('./app');
var port = process.env.PORT || 3000;
var server = app.listen(port, function() {
  console.log('Express server listening on port ' + port);
});

//define the route for "/"
app.get("/", function (request, response){
  response.status(200).send({
    options: { 
      createNewUser: "/api/Schemas/create",
      login: "api/auth/login"
    }
  });
});
