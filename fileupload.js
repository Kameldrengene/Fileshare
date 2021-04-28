var express =   require("express");
var multer  =   require('multer');
var readdirp = require('readdirp');
const fs_extra = require('fs-extra');
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
        console.log(entry.path)
        if(stats.isDirectory()){
            contents.push({path:entry.path+"/",type:"directory",options:{delete: "/api/files/delete/"+"?path="+entry.path,
                    Rename: "/api/files/rename/"+"?path="+entry.path+"&?name=newname",
                    Move: "/api/files/move/"+"?path="+entry.path+"&?newpath=newpathname",
                    CreateDirectory: "/api/files/create/"+"?path="+entry.path+"&?name=directoryname"},
            })
        }else
        contents.push({path:entry.path,type:"file",options:{delete: "/api/files/delete/"+"?path="+entry.path,
                Rename: "/api/files/rename/"+"?path="+entry.path+"&?name=newname",
                Move: "/api/files/move/"+"?path="+entry.path+"&?newpath=newpathname"}})
    }
    res.json(contents);
});

/**
 * Multer behandler form data. Jeg har forklaret lidt om form data i status rapport.
 * Multer sat til at gemme data på harddisk og gemmer i ./uploads mappen men orginal fil navn
 */
 router.post('/upload',VerifyToken,function(req,res){

    var storage =   multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, './Users/'+req.userId);
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
 router.delete('/delete/',VerifyToken,function (req,res){
     temp = []
     path = './Users/'+req.userId+'/'+req.query.path
     var status = fs.statSync(path)
     var response
     if(status.isFile()){
         response = deletefileSync(path)
     }
     else if(status.isDirectory()){
         response = deletefolderSync(path)
     }
     res.send(response)
})
/**
 *  :file bliver betragtet som url parameter. se status rapport for en eksempel
 */
 router.get('/download/:file',VerifyToken,function(req,res){
    res.download("./Users/"+req.userId+'/'+req.params.file);
});

function deletefileSync(filepath){
    const path= filepath
    var reponse
    try {
        fs.unlinkSync(path)
        reponse = "Successfully deleted the file."
    } catch(err) {
        reponse = err;
    }
    return reponse
}
function deletefolderSync(path) {
    const folder = path
    var response_msg = "Folder not deleted";
    try {
        fs_extra.removeSync(folder, {recursive: true})
        response_msg = "The folder " + "\"" + path + "\"" +"for user"+ " is safely removed";
    } catch (error) {
        response_msg = error;
    }
    console.log("delete folder " + response_msg)
    return response_msg;
}

module.exports = router;
