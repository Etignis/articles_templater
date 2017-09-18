'use strict';

const fs = require('fs');
const gm = require('gm').subClass({imageMagick: true});
//const argv = require('yargs').argv;
//const cheerio = require('cheerio');
const path = require('path');
const cp = require('child_process');

const jpgExt = '.jpg';
const sImgPath = "../img";

function resizeImages() {
  console.log("Start resizing in dir \""+sImgPath+"\"...");
  fs.readdirSync(sImgPath).forEach(file => {
    if (path.extname(file) === jpgExt && !/__\d+.jpg/.test(file)) {
      const sPath = path.join(sImgPath, file);
      const fileName = path.basename(file, jpgExt);
      console.log("Resize \""+sPath+"\"");
      
      const aSizes = [800, 500, 300];
      
      aSizes.forEach(function(nSize){
        const sNewPath = path.join(sImgPath, fileName+"__"+nSize+".jpg");
        console.log("Try to convert into \""+sNewPath+"\"");
        
        cp.exec(`magick "${sPath}" -resize ${nSize} "${sNewPath}"`)

        /*/
        gm(sPath)
        .resize(nSize)
        .noProfile()
        .write(sNewPath, function (err) {
          if (err) { 
            console.dir(err);
          }
        });
        /*/
      });   
      
    }
  });
}

resizeImages();
