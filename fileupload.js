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
                    Move: "/api/files/move/"+"?oldpath="+entry.path+'/'+"&newdirectorypath=somefolderpath/",
                    CreateDirectory: "/api/files/createdirectory/"+"?path="+entry.path+'/'+"&name=directoryname"},
            })
        }else
        contents.push({path:entry.path,type:"file",options:{delete: "/api/files/delete/"+"?path="+entry.path,
                Rename: "/api/files/rename/"+"?oldpath="+entry.path+"&newname=name",
                Move: "/api/files/move/"+"?oldpath="+entry.path+"&newdirectorypath=somefolderpath/"}})
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
     var path, outpath
     if(!req.query.path) { // if you want to create the folder inside root.
         path = './Users/' + req.userId + '/' + req.query.name + '/'
         outpath = req.query.name + '/'
     }
     else
     {
         outpath = req.query.path + req.query.name + '/'
         path = './Users/' + req.userId + '/' + req.query.path + req.query.name + '/'
     }
     const isdone = createDirectory(path)
     var response
     if(isdone){
         response = "Folder: " +req.query.name+" created successfully"
         res.status(200).json({response: response,options:{
             upload: "/api/files/upload/"+"?path="+outpath,
             delete: "/api/files/delete/"+"?path="+outpath,
                 Rename: "/api/files/rename/"+"?oldpath="+outpath+"&newname=somename",
                 Move: "/api/files/move/"+"?oldpath="+outpath+"&newdirectorypath=somefolderpath/"}})
     }
     else if(!isdone){
         response = "error creating the folder"
         res.status(204).json({response: response})
     }
})

router.post('/rename/',VerifyToken,function (req,res){
    const oldpath = './Users/'+req.userId+'/'+req.query.oldpath
    var status
    let fileexists = true;
    try {
        status = fs.statSync(oldpath)
    }catch (err){
        fileexists = false;
        res.status(500).send("NO SUCH FILE OR DIRECTORY EXISTS!")
    }
    const newname = req.query.newname
    let newpath;
    if(status.isDirectory()) {
            const index = oldpath.lastIndexOf('/', oldpath.lastIndexOf('/') - 1);
            const folderpath = oldpath.substring(0, index);
            newpath = folderpath + '/' +newname
    }
    else {
            const indexofname = oldpath.lastIndexOf('/');
            const oldfileindex = oldpath.lastIndexOf('.');
            const filetype = oldpath.substring(oldfileindex, oldpath.length);
            const filepath = oldpath.substring(0, indexofname);
            newpath = filepath + '/' +newname+filetype
    }
    var response = 'no response'
    var options = []
    const fileRenamed = rename(oldpath, newpath)
    if(fileRenamed.done) {
        if (status.isFile()) {
            response = "File successfully renamed to "+newname
            options.push({
                response: response, options: {
                    delete: "/api/files/delete/" + "?path=" + newpath,
                    Move: "/api/files/move/"+"?oldpath="+newpath+"&newdirectorypath=somefolderpath/"
                }
            })
        }else {
            response = "Folder successfully renamed to "+newname
            options.push({
                response: response, options: {
                    delete: "/api/files/delete/" + "?path=" + newpath+'/',
                    Move: "/api/files/move/"+"?oldpath="+newpath+'/'+"&newdirectorypath=somefolderpath/",
                    CreateDirectory: "/api/files/createdirectory/" + "?path=" + newpath+'/' + "&name=directoryname"
                }
            })
        }
        if(fileexists)res.status(200).json(options)
    }else {
        if(fileexists) {
            if (status.isFile()) res(406).end(fileRenamed.error)
            else res.status(406).end(fileRenamed.error)
        }
    }
})

/**
 * Husk at tilføje '/' til sidst. når det gælder en directory path
 */
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
    var outpath = req.query.newdirectorypath+name
    var response
    var options = []
    const filemoved = rename(oldpath,newpath)
    if(filemoved.done){
        if (status.isFile()) {
            response = "File successfully moved to "+outpath
            options.push({
                response: response, options: {
                    delete: "/api/files/delete/" + "?path=" + outpath,
                    Rename: "/api/files/rename/"+"?oldpath="+outpath+"&newname=name"
                }
            })
        }else {
            response = "Folder successfully moved to "+outpath
            options.push({
                response: response, options: {
                    delete: "/api/files/delete/" + "?path=" + outpath,
                    Rename: "/api/files/rename/"+"?oldpath="+outpath+"&newname=name",
                    CreateDirectory: "/api/files/createdirectory/" + "?path=" + outpath + "&name=directoryname"
                }
            })
        }
        if(!nofile) res.status(200).json(options)
    }
    else {
        if(!nofile) {
            if (status.isFile()) res.status(406).render("Error moving the file" + filemoved.error)
            else res.status(406).render("Error moving the folder"+filemoved.error)
        }
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
 router.get('/download/',VerifyToken,function(req,res){
     const path = './Users/'+req.userId+'/'+req.query.path
     var status = fs.statSync(path)
     if(status.isFile()){
         res.download("./Users/"+req.userId+'/'+req.query.path);
     }else{
         res.status(404).send("No such file")
     }

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

function rename(oldpath,newpath){
    var rename = {
        done: true,
        error: null
    }
    try {
        fs.renameSync(oldpath,newpath)
        return rename
    }catch (err){
        console.log(err)
        rename.done = false
        rename.error = err
        return rename
    }
}
module.exports = router;
