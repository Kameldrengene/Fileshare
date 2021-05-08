var express =   require("express");
var multer  =   require('multer');
var readdirp = require('readdirp');
const fs_extra = require('fs-extra');
const fs = require('fs');
const Cryptr = require('cryptr')
var jwt = require('jsonwebtoken');
const nanoid = require('nanoid')
var cors = require('cors');
var router = express.Router();
const config = require('./config');
var User = require('./Schemas/User');
var urlshema = require('./Schemas/url')
var VerifyToken = require('./auth/VerifyToken');

router.use(cors())

/**
 * Viser alle filerne i et mappestruktur som har roden ./uploads
 * for await er en asynkron for loop som gemmer fil/mappe path i en stats variabel
 *  variablen får en / hvis dette er en mappe og ellers bliver de gemt i contents arrayet og bliver sendt som response
  */
 router.get('/',VerifyToken,async function(req,res){
    const contents = [];
    for await (const entry of readdirp('./UserData/'+req.userId,{type: 'files_directories'})) {
        var stats = fs.lstatSync(entry.fullPath);
        if(stats.isDirectory()){
            contents.push({path:entry.path+"/",type:"directory",options:{delete: "/api/files/delete/"+"?path="+entry.path+'/',
                    Rename: "/api/files/rename/"+"?oldpath="+entry.path+'/'+"&newname=name",
                    Move: "/api/files/move/"+"?oldpath="+entry.path+'/'+"&newdirectorypath=somefolderpath/",
                    CreateDirectory: "/api/files/createdirectory/"+"?path="+entry.path+'/'+"&name=directoryname",
                    UploadFile:'/api/files/upload/?path='+entry.path},
            })
        }else
        contents.push({path:entry.path,type:"file",options:{delete: "/api/files/delete/"+"?path="+entry.path,
                Rename: "/api/files/rename/"+"?oldpath="+entry.path+"&newname=name",
                Move: "/api/files/move/"+"?oldpath="+entry.path+"&newdirectorypath=somefolderpath/",
                Download: "/api/files/download/?path="+entry.path,
                GlobalUrl: '/api/files/globaldownload/?path='+entry.path}})
    }
    res.status(200).json(contents);
});

/**
 * Multer behandler form data. Jeg har forklaret lidt om form data i status rapport.
 * Multer sat til at gemme data på harddisk og gemmer i ./uploads mappen men orginal fil navn
 */
 router.post('/upload',VerifyToken,function(req,res){

     const path = req.query.path
     let filename
    var storage =   multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, './UserData/'+req.userId+"/"+path);
        },
        filename: function (req, file, callback) {
            filename = file.originalname
            callback(null, file.originalname);
        }
    });

    var upload = multer({ storage : storage}).single('myfile'); //Der bliver kun håndteret enkel fil og key skal være myfile ellers fejler den

    upload(req,res,function(err,done) {
        if(err) {
            return res.status(422).end("Error uploading file.");
        }
        const fullpath = path+'/'+filename
        res.status(201).json({Response:'File uploaded successfully',options:{delete: "/api/files/delete/"+"?path="+fullpath,
                Rename: "/api/files/rename/"+"?oldpath="+fullpath+"&newname=somename",
                Move: "/api/files/move/"+"?oldpath="+fullpath+"&newdirectorypath=somefolderpath/",
                Download: "/api/files/download/?path="+fullpath,
                GlobalUrl: '/api/files/globaldownload/?path='+fullpath}});
    });
});

 router.post('/createdirectory/',VerifyToken,function (req,res){
     var path, outpath
     if(!req.query.path) { // if you want to create the folder inside root.
         path = './UserData/' + req.userId + '/' + req.query.name + '/'
         outpath = req.query.name + '/'
     }
     else
     {
         outpath = req.query.path + req.query.name + '/'
         path = './UserData/' + req.userId + '/' + req.query.path + req.query.name + '/'
     }
     const isdone = createDirectory(path)
     var response
     if(isdone){
         response = "Folder: " +req.query.name+" created successfully"
         res.status(201).json({response: response,options:{
             upload: "/api/files/upload/"+"?path="+outpath,
             delete: "/api/files/delete/"+"?path="+outpath,
             Rename: "/api/files/rename/"+"?oldpath="+outpath+"&newname=somename",
             Move: "/api/files/move/"+"?oldpath="+outpath+"&newdirectorypath=somefolderpath/"}})
     }
     else if(!isdone){
         response = "error creating the folder"
         res.status(422).json({response: response})
     }
})

router.put('/rename/',VerifyToken,function (req,res){
    const oldpath = './UserData/'+req.userId+'/'+req.query.oldpath
    const subpath = '/'+req.query.oldpath
    var status
    try {
        status = fs.statSync(oldpath)
        if(!(status.isDirectory() || status.isFile()))
            return res.status(500).send("NO SUCH FILE OR DIRECTORY EXISTS!")
    }catch (err){
        return res.status(500).send("NO SUCH FILE OR DIRECTORY EXISTS!")
    }
    const newname = req.query.newname
    let newpath,outpath,filetype;
    if(status.isDirectory()) {
        const index_out = subpath.lastIndexOf('/', subpath.lastIndexOf('/') - 1);
        const index = oldpath.lastIndexOf('/', oldpath.lastIndexOf('/') - 1);
        outpath = subpath.substring(0,index_out)+'/'+newname+'/'
        const folderpath = oldpath.substring(0,index);
        newpath = folderpath + '/' +newname
    }
    else {
        const indexname_out = subpath.lastIndexOf('/')
        const oldfileindex_out = subpath.lastIndexOf('.')
        const filetype_out = subpath.substring(oldfileindex_out,subpath.length)
        outpath = subpath.substring(0,indexname_out)+'/'+newname+filetype_out
        const indexofname = oldpath.lastIndexOf('/');
        const oldfileindex = oldpath.lastIndexOf('.');
        filetype = oldpath.substring(oldfileindex, oldpath.length);
        const filepath = oldpath.substring(0, indexofname);
        newpath = filepath + '/' +newname+filetype
    }
    var response = 'no response'
    const path = outpath.substring(1,outpath.length)
    var options = []
    const fileRenamed = rename(oldpath, newpath)
    if(fileRenamed.done) {
        if (status.isFile()) {
            response = "File successfully renamed to "+newname+filetype
            options.push({
                response: response, options: {
                    delete: "/api/files/delete/" + "?path=" + path,
                    Move: "/api/files/move/"+"?oldpath="+path+"&newdirectorypath=somefolderpath/",
                    Download: "/api/files/download/?path="+path,
                    GlobalUrl: '/api/files/globaldownload/?path='+path
                }
            })
        }else {
            response = "Folder successfully renamed to "+newname
            options.push({
                response: response, options: {
                    upload: "/api/files/upload/"+"?path="+path,
                    delete: "/api/files/delete/" + "?path=" + path,
                    Move: "/api/files/move/"+"?oldpath="+path+"&newdirectorypath=somefolderpath/",
                    CreateDirectory: "/api/files/createdirectory/" + "?path=" + path + "&name=directoryname"
                }
            })
        }
        return res.status(201).json(options)
    }else {
        if (status.isFile()) return res(406).end(fileRenamed.error)
        else return res.status(406).end(fileRenamed.error)
    }
})

/**
 * Husk at tilføje '/' til sidst. når det gælder en directory path
 */
router.put('/move/',VerifyToken,function (req,res){
    var oldpath = './UserData/'+req.userId+'/'+req.query.oldpath
    var status,newpathstatus
    try {
         status = fs.statSync(oldpath)
    }catch (err){
        res.status(406).send("Error: ENOENT: no such file or directory. Provide correct old path")
        return
    }
    if(req.query.newdirectorypath!==null)
        if(req.query.newdirectorypath.lastIndexOf('/')!==req.query.newdirectorypath.length-1)
            return res.status(406).send("Remember to add \"/\" at the end of new directory path")
    try {
        newpathstatus = fs.statSync('./UserData/'+req.userId+'/'+req.query.newdirectorypath)
    }catch (err){
        res.status(406).send("Error: ENOENT: No such directory exists. Provide correct \"new directory path\"")
        return;
    }
    if(newpathstatus.isFile()) return res.status(406).send("you provided a file path! new directory path can not be a file path")
    let index
    if(status.isDirectory()){
        if(req.query.oldpath!==null){
            if(req.query.oldpath.lastIndexOf('/')!==req.query.oldpath.length-1)
                return res.status(406).send("Remember to add \"/\" at the end of old directory path")
        }
        index = oldpath.lastIndexOf('/',oldpath.lastIndexOf('/')-1)+1
    }
    else index = oldpath.lastIndexOf('/')+1
    var name = oldpath.substring(index,oldpath.length)
    var newpath = './UserData/'+req.userId+'/'+req.query.newdirectorypath+name
    var outpath = req.query.newdirectorypath+name
    var response
    var options = []
    let filemoved
    try {
        filemoved = rename(oldpath,newpath)
    }catch (err){
        return res.status(406).send("nothing")
    }
    if(filemoved.done){
        if (status.isFile()) {
            response = "File successfully moved to "+outpath
            options.push({
                response: response, options: {
                    delete: "/api/files/delete/" + "?path=" + outpath,
                    Rename: "/api/files/rename/"+"?oldpath="+outpath+"&newname=name",
                    Download: "/api/files/download/?path="+outpath,
                    GlobalUrl: '/api/files/globaldownload/?path='+outpath
                }
            })
        }else {
            response = "Folder successfully moved to "+outpath
            options.push({
                response: response, options: {
                    upload: "/api/files/upload/"+"?path="+outpath,
                    delete: "/api/files/delete/" + "?path=" + outpath,
                    Rename: "/api/files/rename/"+"?oldpath="+outpath+"&newname=name",
                    CreateDirectory: "/api/files/createdirectory/" + "?path=" + outpath + "&name=directoryname"
                }
            })
        }
        return res.status(201).json(options)
    }
    else {
        if (status.isFile()) res.status(500).render("Error moving the file" + filemoved.done)
        else res.status(500).render("Error moving the folder"+filemoved.done)
    }
})

 router.delete('/delete/',VerifyToken,function (req,res){
     temp = []
     const path = './UserData/'+req.userId+'/'+req.query.path
     try {
         var status = fs.statSync(path)
     }catch (err){
         return res.status(500).send("NO SUCH FILE OR DIRECTORY EXISTS!")
     }
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
 router.post('/download/',VerifyToken,function(req,res){
     const path = './UserData/'+req.userId+'/'+req.query.path
     try{
         var status = fs.statSync(path)
         if(status.isFile()){
             res.download("./UserData/"+req.userId+'/'+req.query.path);
         }
         if(status.isDirectory()){
             res.status(400).send("Downloading a folder not allowed.")
         }
     }catch (e) {
         res.status(404).send(e)
     }
});
router.post('/globaldownload/',VerifyToken, async function (req,res){
    const pathparams = './UserData/'+req.userId+'/'+req.query.path
    try{
        var status = fs.statSync(pathparams)
        if(status.isFile()){
            let shortid = nanoid.nanoid()
            console.log(shortid)
            try {
                let url = await urlshema.findOne({pathparams:pathparams},function (err,docs) {
                    if(err) return res.status(500).send("error accessing mongodb")
                    else {
                        if(docs!=null) shortid = docs.shortid
                        console.log(docs)
                    }
                })
                if(url){
                    console.log("inside founded url")
                    const link = config.baseurl+'/'+shortid
                    return res.status(200).json(link)
                }else
                {
                    console.log("inside not founded url")
                    const link = config.baseurl+'/'+shortid
                    const url = new urlshema({
                        shortid,
                        pathparams,
                        createdAt: new Date()
                    })
                    url.save(function (err,doc) {
                        if (err) return res.send(500).send("could not save object in database")
                        return res.status(200).json(link)
                    })
                }
            }catch (err){
               return res.status(500).json('internal server error')
            }
        }
        else if(status.isDirectory()){
            console.log("inside dir")
            return res.status(203).json({response:"Generation of link for folders not allowed"})
        }
    }catch (e) {
        console.log("inside catch e")
        return res.status(404).send(e)
    }
})
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
        response_msg = "The folder " + "\"" + path + "\"" +"for Schemas"+ " is safely removed";
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
