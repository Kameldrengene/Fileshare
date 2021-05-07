var app = require('./app');
const port = process.env.NODE_ENV === 'test' ? 3001 : 3000;
var server = app.listen(port, function() {
  console.log('Express server listening on port ' + port);
});

//define the route for "/"
app.get("/", function (request, response){
  response.status(200).send({
    options: { 
      createNewUser: "/api/user/create",
      login: "api/auth/login"
    }
  });
});
module.exports = { app, server };
