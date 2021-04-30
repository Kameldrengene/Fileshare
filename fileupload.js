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
        if(stats.isDirectory()){
            contents.push({path:entry.path+"/",type:"directory",options:{delete: "/api/files/delete/"+"?path="+entry.path+'/',
                    Rename: "/api/files/rename/"+"?oldpath="+entry.path+'/'+"&newname=name",
                    Move: "/api/files/move/"+"?oldpath="+entry.path+'/'+"&newdirectorypath=somefolderpath",
                    CreateDirectory: "/api/files/create/"+"?path="+entry.path+'/'+"&name=directoryname"},
            })
        }else
        contents.push({path:entry.path,type:"file",options:{delete: "/api/files/delete/"+"?path="+entry.path,
                Rename: "/api/files/rename/"+"?oldpath="+entry.path+"&newname=name",
                Move: "/api/files/move/"+"?oldpath="+entry.path+"&newdirectorypath=somefolderpath"}})
    }
    res.status(200).json(contents);
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
            return res.status(204).end("Error uploading file.");
        }
        res.status(200).end("File is uploaded successfully!");
    });
});

 router.post('/createdirectory/',VerifyToken,function (req,res){
     var path
     if(!req.query.path) // if you want to create the folder inside root.
         path = './Users/'+req.userId+'/'+req.query.name+'/'
     else
         path = './Users/'+req.userId+'/'+req.query.path+req.query.name+'/'
     const isdone = createDirectory(path)
     var response
     if(isdone){
         response = "Folder: " +req.query.name+" created successfully"
         res.status(200).json({response: response,options:{
             upload: "/api/files/upload/"+"?path="+path,
             delete: "/api/files/delete/"+"?path="+path,
                 Rename: "/api/files/rename/"+"?oldpath="+path+"&newpath=newpath",
                 Move: "/api/files/move/"+"?oldpath="+path+"&newdirectorypath=somefolderpath"}})
     }
     else if(!isdone){
         response = "error creating the folder"
         res.status(204).json({response: response})
     }
})

router.post('/rename/',VerifyToken,function (req,res){
    const oldpath = './Users/'+req.userId+'/'+req.query.oldpath
    var status = fs.statSync(oldpath)
    const newname = req.query.newname
    var newpath
    if(status.isDirectory()) {
        var index = oldpath.lastIndexOf('/', oldpath.lastIndexOf('/') - 1)
        var folderpath = oldpath.substring(0,index)
        newpath = folderpath + '/' +newname
    }
    else {
        var indexofname = oldpath.lastIndexOf('/')
        var oldfileindex = oldpath.lastIndexOf('.')
        var filetype = oldpath.substring(oldfileindex,oldpath.length)
        var filepath = oldpath.substring(0,indexofname)
        newpath = filepath + '/' +newname+filetype
    }
    var response = 'no response'
    var options = []
    if(rename(oldpath, newpath)) {
        if (status.isFile()) {
            response = "File successfully renamed to "+newname
            options.push({
                response: response, options: {
                    delete: "/api/files/delete/" + "?path=" + newpath,
                    Move: "/api/files/move/"+"?oldpath="+newpath+"&newdirectorypath=somefolderpath"
                }
            })
        }else {
            response = "Folder successfully renamed to "+newname
            options.push({
                response: response, options: {
                    delete: "/api/files/delete/" + "?path=" + newpath,
                    Move: "/api/files/move/"+"?oldpath="+newpath+"&newdirectorypath=somefolderpath",
                    CreateDirectory: "/api/files/create/" + "?path=" + newpath + "&?name=directoryname"
                }
            })
        }
        res.status(200).json(options)
    }else {
        if(status.isFile()) res.end("Error renaming the file")
        else res.status(406).end("Error renaming the folder")
    }
})

router.post('/move/',VerifyToken,function (req,res){
    var oldpath = './Users/'+req.userId+'/'+req.query.oldpath
    var nofile = false
    try {
        var status = fs.statSync(oldpath)
    }catch (err){
        nofile = true;
        res.status(500).send("no such file or directory exists")
    }

    var index
    if(status.isDirectory())
        index = oldpath.lastIndexOf('/',oldpath.lastIndexOf('/')-1)
    else
        index = oldpath.lastIndexOf('/')
    var name = oldpath.substring(index+1,oldpath.length)
    var newpath = './Users/'+req.userId+'/'+req.query.newdirectorypath+name
    var response
    var options = []
    if(rename(oldpath,newpath,res)){
        if (status.isFile()) {
            response = "File successfully moved to "+newpath
            options.push({
                response: response, options: {
                    delete: "/api/files/delete/" + "?path=" + newpath,
                    Rename: "/api/files/rename/"+"?oldpath="+newpath+"&?newname=name"
                }
            })
        }else {
            response = "Folder successfully moved to "+newpath
            options.push({
                response: response, options: {
                    delete: "/api/files/delete/" + "?path=" + newpath,
                    Rename: "/api/files/rename/"+"?oldpath="+newpath+"&?newname=name",
                    CreateDirectory: "/api/files/create/" + "?path=" + newpath + "&?name=directoryname"
                }
            })
        }
        if(!nofile) res.status(200).json(options)
    }
    else {
        if(status.isFile()) res.status(204).render("Error moving the file")
        else res.status(204).render("Error moving the folder")
    }
})

 router.delete('/delete/',VerifyToken,function (req,res){
     temp = []
     const path = './Users/'+req.userId+'/'+req.query.path
     var status = fs.statSync(path)
     var response
     if(status.isFile()){
         response = deletefileSync(path)
     }
     else if(status.isDirectory()){
         response = deletefolderSync(path)
     }
     if(!response.err) res.status(200).send(response)
     else res.send(response)
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
        console.log(err)
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
    return response_msg;
}

function createDirectory(path){
    const folderName = path
    var response
    try {
        if (!fs.existsSync(folderName)) {
            fs.mkdirSync(folderName)
            response = true
        }
    } catch (err) {
        response = false
    }
    return response
}

function rename(oldpath,newpath,res){
    try {
        fs.renameSync(oldpath,newpath)
        return true
    }catch (err){
        console.log(err)
        res.type('text/plain')
        res.status(500)
        res.send('internal error'+err)
        return false
    }
}
module.exports = router;
