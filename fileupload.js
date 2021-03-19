var express =   require("express");
var multer  =   require('multer');
var readdirp = require('readdirp');
var app =   express();
var port = 8081;


app.get('/',async function(req,res){
    const contents = [];
    for await (const entry of readdirp('./uploads')) {
        const {path} = entry;
        console.log(`${JSON.stringify({path})}`);
        contents.push(entry.path)
    }
    res.send(JSON.stringify(contents))

});

app.post('/upload',function(req,res){

    var storage =   multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, './uploads');
        },
        filename: function (req, file, callback) {
            callback(null, file.originalname);
        }
    });

    var upload = multer({ storage : storage}).single('myfile');

    upload(req,res,function(err) {
        if(err) {
            return res.end("Error uploading file.");
        }


        res.end("File is uploaded successfully!");
    });
});

app.get('/download/:file',function(req,res){
    res.download("./uploads/"+req.params.file);
});

app.listen(port,function(){
    console.log("Server is running on port: " +port);
});
