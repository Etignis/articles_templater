'use strict';

const fs = require('fs');
const gm = require('gm').subClass({imageMagick: true});
const argv = require('yargs').argv;
//const cheerio = require('cheerio');
const path = require('path');
const cp = require('child_process');

 const jpgExt = '.jpg';
const oImgPath = [
                "../img",
                "../img/articles",
                "../img/tables"
                ];
               

const pathname = argv._[0] || null;

function resizeImage(sPath, file) {
  if (path.extname(file) === jpgExt && !/__\d+.jpg/.test(file)) {
    const sSrcPath = path.join(sPath, file);
    const fileName = path.basename(file, jpgExt);
    console.log("Resize \""+sSrcPath+"\"");
    
    const aSizes = [800, 500, 300];
    //const aSizes = [200];
    aSizes.forEach(function(nSize){      
      const sNewPath = path.join(sPath, path.parse(file).dir, fileName+"__"+nSize+".jpg");
      if (!fs.existsSync(sNewPath)){
        ensureDirectoryExistence(sNewPath);
        console.log("Try to convert into \""+sNewPath+"\"");
        
        gm(sSrcPath)
        .resize(nSize)
        .noProfile()
        .write(sNewPath, function (err) {
          if (err) {
            console.log(err);
          } else{
          //  console.log('done');
          }
        });
      }
    }); 
  }
}

function manageFolder(path) {
  var aPath = [];
  if(!path){
    aPath = oImgPath;
  } else {
    if(typeof path == "string") {
      aPath.push(path);
    } else{
      console.log("ERROR! Path should be string.");
      return false;
    }
  }
  aPath.forEach(function(sPath){
    console.log("Start resizing in dir \""+sPath+"\"...");
    try{
      fs.readdirSync(sPath).forEach(file => {
       resizeImage(sPath, file);
      });
    } catch (err) {
      console.dir(err);
    };
  }) ;

}

function ensureDirectoryExistence(filePath) {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

console.log("pathname: "+pathname);

if(pathname && fs.lstatSync(pathname).isDirectory()) {
  console.log("I think '"+pathname+"' is a directory...");
  manageFolder(pathname);
} else if(pathname && fs.lstatSync(pathname).isFile()) {
  console.log("I think '"+pathname+"' is a file...");
  const aPath = pathname.split("/[\/\\]/");
  const sFile = aPath.pop();
  resizeImage(aPath.join("/"), sFile);
} else {
  console.log("I think '"+pathname+"' is a usual path");
  manageFolder();  
}