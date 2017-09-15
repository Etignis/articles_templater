'use strict';

const fs = require('fs');
const argv = require('yargs').argv;
const cheerio = require('cheerio');
const path = require('path');

/// articles index page
const sPathToSrc = '../../random/js/items.js';
const RandomItems = require(sPathToSrc);
const sPathToTmp = '../../index.html';
const sPathToTextSource = '../source';
const sPathToTextOutput = '../text';
const sPathToTablestOutput = '../tables';
const htmlExt = '.html';
const sPathToOutput = '../';
const sTemplate = getTemplate();

let sGlobalTablesList, sGlobalTextsList;

function getTemplate(){
  const fileContent = fs.readFileSync(sPathToTmp);
  const $ = cheerio.load(fileContent.toString(), {decodeEntities: false});
  $("#content").text("");
  $("#content").addClass('ephasizedPage');
  //console.dir($.html());
  return $.html();
}

// /articles index page
function getTablesList() {
  var aRows = [];
  for(var i=0; RandomItems.l[i]; i++) {
    for(var j=0; RandomItems.l[i].list[j]; j++) {
      if(            
        RandomItems.l[i].list[j].fArticle == true 
      ){          
        var sTitle = RandomItems.l[i].list[j].title;
        var sName = RandomItems.l[i].list[j].name;
        
        aRows.push("<li><a href='/articles/tables/"+sName+".html'>"+sTitle+"</a></li>")
      }
    }
  }
  var sTitle = "<h2>Таблицы</h2>";
  return sTitle+"<ul>"+aRows.join("")+"</ul>";
}

function getTextsList(aSource) {
  let aRows = [];

  for(var j=0; aSource[j]; j++) {         
    var sTitle = aSource[j].title;
    var sName = aSource[j].name;
    //console.dir(aSource[j]);
    aRows.push("<li><a href='articles/text/"+sName+"'>"+sTitle+"</a></li>");
  }

  var sTitle = "<h2>Статьи</h2>";
  return sTitle+"<ul>"+aRows.join("")+"</ul>";
}

/*
 *  Insert page content into page element
 */
function createPage(sTemplate, sContent, sTitle) {  
  var oTemplate = cheerio.load(sTemplate, {decodeEntities: false});
  oTemplate("#content").html(sContent);
  if(sTitle){
    oTemplate("title").text(sTitle);
  }
  return oTemplate.html();   
}
function savePage(sContent, sPath, sMode) {
  ensureDirectoryExistence(sPath);
  if(sMode == 'sinc') {
    try{
      fs.writeFileSync(sPath, sContent);
    }catch (e){
        console.log("Cannot write file \""+sPath+"\": ", e);
    }
  } else {
    fs.writeFile(sPath, sContent, 'utf8', function(err) {
      if(err) {
          return console.log(err);
      }
      console.log("The file was saved! \""+sPath+"\"");
    });
  }
}
function ensureDirectoryExistence(filePath) {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

function createTable(sTable, sMod) {
  var aTableRows = sTable.split(";");
  var nIndex = 1;
  if(sMod == "numeric"){
    aTableRows = aTableRows.map(function(el){
      var aCount = el.match(/{{(\d+)}}/)
      var sCount = nIndex;
      if(aCount && aCount[1]){
        var nCount = Number(aCount[1]);
        sCount += " - "+(Number(nIndex)-1+Number(nCount));
        nIndex+=nCount;
        el = el.replace(/\s*{{\d+}}\s*/, "");
      } else{
        nIndex++;
      }
      return "<span class='numeric'>"+sCount + ".</span> "  + el.trim();
    })
    return "<ul>" + aTableRows.map(function(el){return "<li>" + el + "</li>"}).join("") + "</ul>";
  }
  else 
    return "<ul>" + aTableRows.map(function(el){return "<li>" + el + "</li>"}).join("") + "</ul>";
}
function createTablePage(oSrc, sMod) {
    var sTitle = oSrc.title;
    var sImage = oSrc.img;
    var sSource = oSrc.tooltip;
    var sURL = oSrc.url;
    var sRandom = oSrc.name;
    var aTables = [];
    var aSchemes = oSrc.schemes;
    
    aSchemes.forEach(function(el){
      for(var i=0; oSrc.src[i]; i++) {
        if(oSrc.src[i].name == el) {
          var sTable = oSrc.src[i].l;
          
          aTables.push(createTable(sTable, "numeric"));
          
          break;
        }
      }
    });
    
    var sLink = (sURL)? "<a href='"+sURL+"'>"+sSource+"</a>": sSource;
    var sRandomizer = "<a href='https://tentaculus.ru/random/#item="+sRandom+"'>Смотреть в рандомизаторе</a>";
    var sGoback = "<a href='#'>Статьи</a><small style='color: #999'>></small><a href='#tables'>Таблицы</a>";
    
    var sContent = "<h1>"+sTitle+"</h1>"+
                   sGoback + 
                   "<img src='img/"+sImage+"' style='width: 100%'>"+
                   aTables.join("") + 
                   sGoback + 
                   "<p>Источник: "+sLink+"</p>" + 
                   "<p>"+sRandomizer+"</p>";
                   
    //document.title = sTitle;
    //placeContent(sContent);
    let sPage = createPage(sTemplate, sContent, sTitle);
    savePage(sPage, sPathToTablestOutput + "/"+sRandom+".html");
  }
function createTables() {
  for(var i=0; RandomItems.l[i]; i++) {
    for(var j=0; RandomItems.l[i].list[j]; j++) {
      if(            
        RandomItems.l[i].list[j].fArticle == true 
      ){          
        //var sTitle = RandomItems.l[i].list[j].title;
        //var sName = RandomItems.l[i].list[j].name;
        
        //aRows.push("<li><a href='/tables/"+sName+"'>"+sTitle+"</a></li>")
        createTablePage(RandomItems.l[i].list[j]); 
      }
    }
  }
}
function createTableList() {
  createTables();
  sGlobalTablesList = getTablesList();
  let sPage = createPage(sTemplate, sGlobalTablesList, "Таблицы");
  savePage(sPage, sPathToTablestOutput + "/index.html");
}

function createTexts(sSourcePath, sOutputPath) {
  console.log("Render text's articles");
  fs.readdirSync(sSourcePath).forEach(file => {
    if (path.extname(file) === htmlExt) {
      const fileName = path.basename(file);
      const fileContent = fs.readFileSync(path.join(sSourcePath, file));

      const $ = cheerio.load(fileContent.toString());
      const title = $("h1").text();
      const page = createPage(sTemplate, $.html(), title);
      savePage(page, sPathToTextOutput + "/" + fileName, "sinc");
    }
  });
}
function createTextList(sSourcePath, sOutputPath) {  
  // create text articles from source
  createTexts(sPathToTextSource, sPathToTextOutput);

  let result = [];
  fs.readdirSync(sSourcePath).forEach(file => {
    if (path.extname(file) === htmlExt && file != 'index.html') {
      const fileName = path.basename(file);
      const fileContent = fs.readFileSync(path.join(sSourcePath, file));
      const sBody = fileContent.toString();
      const $ = cheerio.load(sBody, {decodeEntities: false});
      const fileTitle = $('h1').text();
      //console.dir($('h1').text());
      result.push({
        title: fileTitle,
        name: file
      });
    }
  });
  sGlobalTextsList = getTextsList(result);
  const sPage = createPage(sTemplate, sGlobalTextsList, "Статьи");
  savePage(sPage, sPathToTextOutput + "/index.html");
}

function createIndexPage() {
  const sPage = createPage(sTemplate, sGlobalTablesList+sGlobalTextsList);
  savePage(sPage, "../index.html");
}

// table's list 
createTableList();

// text's list 
createTextList(sPathToTextOutput, sPathToTextOutput);

// articles main page
createIndexPage();