'use strict';

const fs = require('fs');
const argv = require('yargs').argv;
const cheerio = require('cheerio');
const path = require('path');
const request = require('request');

const startURL = "http://paizo.com/pathfinderRPG/prd/indices/spelllists.html";
const siteHost = "http://paizo.com";

let aSpellURL = [];
let oSpells = {};

let aPromices = [];

function getList() {
  request(startURL, function (err, res, body) {
    if (err) throw err;
    // console.log(body);
    // console.log(res.statusCode);
    const $ = cheerio.load(body.toString(), {decodeEntities: false});
    $("#spelllist").find("a").each(function(){
      const sLink = $(this).attr("href");
      const sTitle = $(this).text();
     //console.log(sTitle+" "+sLink);
      aSpellURL.push({
        link: sLink,
        title: sTitle
      });
    });
  });
};

function getSpellAttr(sLine, sHTML) {
  let aParams = [];
  
  // School & types // School transmutation [air, poison]
  if(/<b>School<\/b>/.test(sHTML)){
    const oSchool = /\bSchool\b\s*([\w]+)\s*(\(([\w,\s]+)\))?\s*(\[([\w,\s]+)\])?/i.exec(sLine)
    if(oSchool) {
      if(oSchool[1]) {
        aParams.push({
          param: "school",
          val: oSchool[1]
        })
        console.log("school    "+oSchool[1]);
      }
      if(oSchool[3]) {
        aParams.push({
          param: "schoolSubtype",
          val: oSchool[3].split(/\s*,\s*/)
        })
        console.log("schoolTypes    "+oSchool[3]);
      }
      if(oSchool[5]) {
        aParams.push({
          param: "schoolType",
          val: oSchool[5].split(/\s*,\s*/)
        })
        console.log("schoolType    "+oSchool[5]);
      }
    }
  }
  
  // Class Levels // Level alchemist 4, sorcerer/wizard 4
  if(/<b>Level<\/b>/.test(sHTML)){
    const oClassLevel = /\bLevel\b\s*([\w\d\s,\/]+)/i.exec(sLine)
    if(oClassLevel) {
      if(oClassLevel[1]) {
        const aClass = oClassLevel[1].split(/\s*,\s*/).map(function(el){
          const aTMP = el.split(/\s/);
          return {
            class: aTMP[0],
            level: aTMP[1]
          }
        })
        aParams.push({
          param: "classLevel",
          val: aClass
        })
        console.log("classLevel    "+oClassLevel[1]);
      }
    }
  }  
  // Casting Time // Casting Time 1 standard action
  if(/<b>Casting Time<\/b>/.test(sHTML)){
    const oCastingTime = /\bCasting Time\b\s*([\w\d\s,\/]+)/i.exec(sLine)
    if(oCastingTime) {
      if(oCastingTime[1]) {
        aParams.push({
          param: "castingTime",
          val: oCastingTime[1]
        })
        console.log("castingTime    "+oCastingTime[1]);
      }
    }
  }
  
  // Components // Components S, M (contact or inhaled poison worth 100 gp)
  if(/<b>Components<\/b>/.test(sHTML)){
    const oComponents = /\bComponents\b\s*([\w,\s\/]+)\s*(\(([\w\d\s,\(\)\/]+)\))?/i.exec(sLine)
    if(oComponents) {
      if(oComponents[1]) {
        aParams.push({
          param: "components",
          val: oComponents[1]
        })
        console.log("components    "+oComponents[1]);
      }
      if(oComponents[3]) {
        aParams.push({
          param: "materials",
          val: oComponents[3]
        })
        console.log("materials    "+oComponents[3]);
      }
    }
  }
  
  // Range // Range 100 ft.
  if(/<b>Range<\/b>/.test(sHTML)){
    const oRange = /\bRange\b\s*([\w\d\s+,.\/\(\)]+)/i.exec(sLine)
    if(oRange) {
      if(oRange[1]) {
        aParams.push({
          param: "range",
          val: oRange[1]
        })
        console.log("range    "+oRange[1]);
      }
    }
  }
  
  // Target // Target one cloud-like effect, up to one 10-ft. cube/level
  if(/<b>Target<\/b>/.test(sHTML)){
    const oRange = /\bTarget\b\s*([\w\d\s+,.\/\(\)-]+)/i.exec(sLine)
    if(oRange) {
      if(oRange[1]) {
        aParams.push({
          param: "target",
          val: oRange[1]
        })
        console.log("target    "+oRange[1]);
      }
    }
  }
  
  // Effect // Effect 40-ft.-high downdraft of wind in a 100-foot line
  if(/<b>Effect<\/b>/.test(sHTML)){
    const oEffect = /\bEffect\b\s*([\w\d\s,.\/-]+)/i.exec(sLine)
    if(oEffect) {
      if(oEffect[1]) {
        oEffect.push({
          param: "effect",
          val: oEffect[1]
        })
        console.log("effect    "+oEffect[1]);
      }
    }
  }

    
  // Duration // Duration concentration + 1 round
  if(/<b>Duration<\/b>/.test(sHTML)){
    const oDuration = /\bDuration\b\s*([\w\d\s,.;\/+-]+)/i.exec(sLine)
    if(oDuration) {
      if(oDuration[1]) {
        aParams.push({
          param: "duration",
          val: oDuration[1]
        })
        console.log("duration    "+oDuration[1]);
      }
    }
  }
  
  // Saving Throw // Saving Throw none; see text; 
  if(/<b>Saving Throw<\/b>/.test(sHTML)){
    const oSavingThrow = /\bSaving Throw\b\s*([\w\d\s,.\/+\(\)-]+)/i.exec(sLine)
    if(oSavingThrow) {
      if(oSavingThrow[1]) {
        aParams.push({
          param: "savingThrow",
          val: oSavingThrow[1]
        })
        console.log("savingThrow    "+oSavingThrow[1]);
      }
    }
  }
  
  // Spell Resistance // Spell Resistance no
  if(/<b>Spell Resistance<\/b>/.test(sHTML)){
    const oSpellResistance = /\bSpell Resistance\b\s*([\w\d\s,;.\/+-]+)/i.exec(sLine)
    if(oSpellResistance) {
      if(oSpellResistance[1]) {
        aParams.push({
          param: "spellResistance",
          val: oSpellResistance[1]
        })
        console.log("spellResistance    "+oSpellResistance[1]);
      }
    }
  }
  
  if(aParams.length==0) {
    aParams.push({
        param: "infoText",
        val: sLine
      })
      console.log("infoText    "+sLine);
  }
  
  return aParams;
}
function getSpell(el) {
  return new Promise(function(resolve, reject){
    const sURL = siteHost+el.link;
    const sTitle = el.title;
    request(sURL, function (err, res, body) {
      if (err) return reject("[ERROR] in request: "+err);
      // console.log(body);
      // console.log(res.statusCode);
      console.log("Get spell: "+sURL);
      let oSpell = {};
      const sSpellId = sTitle.toLowerCase().replace(" ", "-");
      //console.log(body.toString());
      const $ = cheerio.load(body.toString(), {decodeEntities: false});
      const sTagSelector = "p [id=\""+sSpellId+"\"]";
      console.log(sTagSelector);
      const oStartElement = $(sTagSelector);
      oSpell.name = oStartElement.text();
      
      // for(var i=0; i<20; i++) {
        // let oNextElement = oStartElement.next();
        // if(
          // oNextElement.attr("1d") || 
          // oNextElement.attr("class") == "footer" || 
          // oNextElement.attr("class") == "stat-block-title" || 
          // oNextElement.text() == "") {
          // console.log("=============================");
          // break;
        // }
        // const aParams = getSpellAttr(oNextElement.text().toString(), oNextElement.html().toString());
        // aParams.forEach(function(el){
          // if(oSpell[el.param]){            
            // oSpell[el.param] += el.val;
          // } else{
            // oSpell[el.param] = el.val;            
          // }
        // });  
        
        // oNextElement.remove();
      // }
      
      resolve (oSpell);
    });
  });
}

function createSpellList() {
  return new Promise(function(resolve, reject){
    // aSpellURL.forEach(function(el){
      // aPromices.push(getSpell());    
    // });
    let i = 0;
    const oTimer = setInterval(function(){
      if(i<aSpellURL.length) {
        const oSpell = getSpell(aSpellURL[i]);
        console.dir(oSpell);
        aPromices.push(oSpell);    
        i++;
      } else {
        clearInterval(oTimer);
        resolve (oSpell);
      }
    }, 3000);
  });
}

getList();
setTimeout(function(){
  getSpell(aSpellURL[1]).then(function(ret){
    console.log("spell:");
    console.dir(ret);
  })
}, 4000);
// createSpellList().then(function() {
  // console.log("Spelllist created!");
  // Promise.all(aPromices).then(function() {
    // console.log("Done!");
  // }, function(err) {
    // console.dir(err);
  // });
// };