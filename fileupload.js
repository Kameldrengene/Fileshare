var express =   require("express");
var multer  =   require('multer');
var readdirp = require('readdirp');
const fs = require('fs');
var app =   express();
var port = 8081;

/**
 * Viser alle filerne i et mappestruktur som har roden ./uploads
 * for await er en asynkron for loop som gemmer fil/mappe path i en stats variabel
 *  variablen får en / hvis dette er en mappe og ellers bliver de gemt i contents arrayet og bliver sendt som response
  */
app.get('/',async function(req,res){
    const contents = [];
    for await (const entry of readdirp('./uploads',{type: 'files_directories'})) {
        var stats = fs.lstatSync(entry.fullPath);
        if(stats.isDirectory()){
            contents.push(entry.path+"/")
        }else
        contents.push(entry.path)
    }
    res.json(contents);
});

/**
 * Multer behandler form data. Jeg har forklaret lidt om form data i status rapport.
 * Multer sat til at gemme data på harddisk og gemmer i ./uploads mappen men orginal fil navn
 */
app.post('/upload',function(req,res){

    var storage =   multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, './uploads');
        },
        filename: function (req, file, callback) {
            callback(null, file.originalname);
        }
    });

    var upload = multer({ storage : storage}).single('myfile'); //Der bliver kun håndteret enkel fil og key skal være myfile ellers fejler den

    upload(req,res,function(err) {
        if(err) {
            return res.end("Error uploading file.");
        }


        res.end("File is uploaded successfully!");
    });
});
/**
 *  :file bliver betragtet som url parameter. se status rapport for en eksempel
 */
app.get('/download/:file',function(req,res){
    res.download("./uploads/"+req.params.file);
});

app.listen(port,function(){
    console.log("Server is running on port: " +port);
});
