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

function resizeImage(file) {
  if (path.extname(file) === jpgExt && !/__\d+.jpg/.test(file)) {
    //const sPath = path.join(sImgPath, file);
    const fileName = path.basename(file, jpgExt);
    console.log("Resize \""+file+"\"");
    
    const aSizes = [800, 500, 300];
    
    aSizes.forEach(function(nSize){
      const sNewPath = path.join(path.parse(file).dir, fileName+"__"+nSize+".jpg");
      console.log("Try to convert into \""+sNewPath+"\"");
      
      cp.exec(`magick "${file}" -resize ${nSize} "${sNewPath}"`)

    }); 
  }
}

function manageFolder(path) {
  if(!path){
    path = sImgPath;
  }
  console.log("Start resizing in dir \""+path+"\"...");
  fs.readdirSync(path).forEach(file => {
   resizeImage(file)
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