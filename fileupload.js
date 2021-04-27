var express =   require("express");
var multer  =   require('multer');
var readdirp = require('readdirp');
const fs = require('fs');
var cors = require('cors');
var router = express.Router();
var User = require('./user/User');
var VerifyToken = require('./auth/VerifyToken');

router.use(cors())

/**
 * Viser alle filerne i et mappestruktur som har roden ./uploads
 * for await er en asynkron for loop som gemmer fil/mappe path i en stats variabel
 *  variablen får en / hvis dette er en mappe og ellers bliver de gemt i contents arrayet og bliver sendt som response
  */
 router.get('/',VerifyToken,async function(req,res){
    const contents = [];
    for await (const entry of readdirp('./Users/'+req.userId,{type: 'files_directories'})) {
        var stats = fs.lstatSync(entry.fullPath);
        if(stats.isDirectory()){
            contents.push({path:entry.path+"/",type:"directory"})
        }else
        contents.push({path:entry.path,type:"file"})
    }
    res.json(contents);
});

/**
 * Multer behandler form data. Jeg har forklaret lidt om form data i status rapport.
 * Multer sat til at gemme data på harddisk og gemmer i ./uploads mappen men orginal fil navn
 */
 router.post('/upload',VerifyToken,function(req,res){

     const path = req.query.path
    var storage =   multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, './Users/'+req.userId+"/"+path);
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
 router.get('/download/:file',VerifyToken,function(req,res){
    res.download("./Users/"+req.userId+'/'+req.params.file);
});

module.exports = router;
