const ftpSync = require('ftpsync');
const options = require("config.js");

ftpSync.settings = options;
ftpSync.run(function(err, result) {

  if(err) {
    console.dir(err);
    console.dir(result);
    return;
  }
  return;
});
console.log("0_o");