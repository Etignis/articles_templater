'use strict';

const fs = require('fs');
const gm = require('gm').subClass({imageMagick: true});
const argv = require('yargs').argv;
//const cheerio = require('cheerio');
const path = require('path');
const cp = require('child_process');

const jpgExt = '.jpg';
const sImgPath = "../img";

const pathname = argv._[0] || null;

function resizeImage(sPath, file) {
  if (path.extname(file) === jpgExt && !/__\d+.jpg/.test(file)) {
    const sSrcPath = path.join(sPath, file);
    const fileName = path.basename(file, jpgExt);
    console.log("Resize \""+sSrcPath+"\"");
    
    const aSizes = [800, 500, 300];
    
    aSizes.forEach(function(nSize){
      const sNewPath = path.join(sPath, path.parse(file).dir, fileName+"__"+nSize+".jpg");
      console.log("Try to convert into \""+sNewPath+"\"");
      
      cp.exec(`magick "${sSrcPath}" -resize ${nSize} "${sNewPath}"`)

    }); 
  }
}

function manageFolder(path) {
  if(!path){
    path = sImgPath;
  }
  console.log("Start resizing in dir \""+path+"\"...");
  fs.readdirSync(path).forEach(file => {
   resizeImage(path, file)
  });
}

console.log("pathname: "+pathname);

if(pathname && fs.lstatSync(pathname).isDirectory()) {
  console.log("I think '"+pathname+"' is a directory...");
  manageFolder(pathname);
} else if(pathname && fs.lstatSync(pathname).isFile()) {
  console.log("I think '"+pathname+"' is a file...");
  resizeImage(pathname);
} else {
  console.log("I think '"+pathname+"' is a usual path");
  manageFolder();  
}