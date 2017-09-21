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

const sGoBackDelimiter = "→";

let sGlobalTablesList, sGlobalTextsList;

// get index.html from main site and clear content
function getTemplate(){
  const fileContent = fs.readFileSync(sPathToTmp);
  const $ = cheerio.load(fileContent.toString(), {decodeEntities: false});
  $("#content").text("");
  $("#content").addClass('ephasizedPage');
  //console.dir($.html());
  return $.html();
}

// get list of articles with random tables
function getTablesList() {
  var aRows = [];
  for(var i=0; RandomItems.l[i]; i++) {
    for(var j=0; RandomItems.l[i].list[j]; j++) {
      if(
        RandomItems.l[i].list[j].fArticle == true
      ){
        var sTitle = RandomItems.l[i].list[j].title;
        var sName = RandomItems.l[i].list[j].name;
        var sDescription = RandomItems.l[i].list[j].description? "<br><span class='desc'>"+aSource[j].description+"</span>" : "";

        aRows.push("<li><a href='/articles/tables/"+sName+".html'>"+sTitle+"</a>"+sDescription+"</li>")
      }
    }
  }
  var sTitle = "<h2>Таблицы</h2>";
  return sTitle+"<ul>"+aRows.join("")+"</ul>";
}

// get list of articles with text
function getTextsList(aSource) {
  let aRows = [];

  for(var j=0; aSource[j]; j++) {
    var sTitle = aSource[j].title;
    var sName = aSource[j].name;
    var sDescription = aSource[j].description? "<br><span class='desc'>"+aSource[j].description+"</span>" : "";

    aRows.push("<li><a href='articles/text/"+sName+"'>"+sTitle+"</a>"+sDescription+"</li>");
  }

  var sTitle = "<h2>Статьи</h2>";
  return sTitle+"<ul>"+aRows.join("")+"</ul>";
}

/*
 *  Insert page content into page element (template)
 */
function createPage(sTemplate, sContent, sTitle, oImage) {
  var oTemplate = cheerio.load(sTemplate, {decodeEntities: false});
  oTemplate("#content").html(sContent);
  if(sTitle){
    oTemplate("title").text(sTitle);
    oTemplate("meta[property='og:title']").attr('content', sTitle);
    oTemplate("meta[property='og:description']").attr('content', sTitle);
  }
  if(oImage){
    if(typeof oImage == "string") {
      oTemplate("meta[property='og:image']").attr('content', sImage);
    }
    if(Array.isArray(oImage)) {
      oImage.forEach(function(img, i){
        insertMetaImage(oTemplate, img, i);
      });
    }
  }
  return oTemplate.html();
}

// check & add OG images
function insertMetaImage($, sPath, nIndex){
  if($("meta[property='og:image']").eq(nIndex).length > 0) {
    $("meta[property='og:image']").eq(nIndex).attr('content', sPath);
  } else {
    $("meta[property='og:type']").before('<meta property="og:image" content="'+sPath+'">\n');
  }
}

// save page file
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

// check is dir exists
function ensureDirectoryExistence(filePath) {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

// create table as content to table article
function createTable(sTable, sMod, sTitle) {
  var aTableRows = sTable.split(";");
  var nIndex = 1;
  if(sMod == "numeric"){
    aTableRows = aTableRows.map(function(el){
      var aCount = el.match(/{{(\d+)}}/)
      var sCount = nIndex;
      if(aCount && aCount[1]){
        var nCount = Number(aCount[1]);
        sCount += "-"+(Number(nIndex)-1+Number(nCount));
        nIndex+=nCount;
        el = el.replace(/\s*{{\d+}}\s*/, "");
      } else{
        nIndex++;
      }
      return "<span class='numeric'>"+sCount + "</span> "  + el.trim();
    })
    return "<ul>" + aTableRows.map(function(el){return "<li>" + el + "</li>"}).join("") + "</ul>";
  } else if(sMod == "numericTable"){
    let aD = [4,6,8,10,12,20,30,50,100];
    aTableRows = aTableRows.map(function(el){
      var aCount = el.match(/{{(\d+)}}/)
      var sCount = nIndex;
      if(aCount && aCount[1]){
        var nCount = Number(aCount[1]);
        sCount += "-"+(Number(nIndex)-1+Number(nCount));
        nIndex+=nCount;
        el = el.replace(/\s*{{\d+}}\s*/, "");
      } else{
        nIndex++;
      }
      return "<td>"+sCount + "</td><td> "  + el.trim() + "</td>";
    })
    const sD = (aD.indexOf(nIndex-1)>=0)? "d"+(nIndex-1): "№";
    const sTableHeader = "<tr><th>"+sD+"</th><th>"+ (sTitle?sTitle:"Результат")+"</th></tr>";
    return "<table class='randomTable'>" + sTableHeader + aTableRows.map(function(el){return "<tr>" + el + "</tr>"}).join("") + "</table>";
  }
  else
    return "<ul>" + aTableRows.map(function(el){return "<li>" + el + "</li>"}).join("") + "</ul>";
}

// add title, image etc to table to create content for page
function createTablePage(oSrc, sMod) {
    var sTitle = oSrc.title;
    var sImage = oSrc.img? "articles/img/"+oSrc.img : null;
    var sSource = oSrc.tooltip;
    //var sDescription = oSrc.description;
    var sURL = oSrc.url;
    var sRandom = oSrc.name;
    var aTables = [];
    var aSchemes = oSrc.schemes;
    var aSrc = oSrc.src;

    aSrc.forEach(function(el){

      var sTable = el.l;
      var sTableTitle = el.title? el.title : "Результат";

      aTables.push(createTable(sTable, "numericTable", sTableTitle));
    });

    var sLink = (sURL)? "<a href='"+sURL+"'>"+sSource+"</a>": sSource;
    var sRandomizer = "<a href='https://tentaculus.ru/random/#item="+sRandom+"'>Смотреть в рандомизаторе</a>";
    var sGoback = "<p><a href='/'><i class='fa fa-home' aria-hidden='true'></i></a><span style='color: #999'>"+sGoBackDelimiter+"</span><a href='/articles'>Статьи</a><span style='color: #999'>"+sGoBackDelimiter+"</span><a href='/articles/tables'>Таблицы</a><span style='color: #999'>"+sGoBackDelimiter+"</span>"+sTitle+"</p>";

    let img = "";
    let aImg = [];
    if(sImage){
      const img_300 = sImage.replace(".","__300.");
      const img_500 = sImage.replace(".","__500.");
      const img_800 = sImage.replace(".","__800.");
      aImg = [sImage, img_800, img_500, img_300];

      img =  "<img src='"+img_300+"' srcset='"+img_500+" 500w, "+img_800+" 800w, "+sImage+" 2000w' style='width: 100%' alt=''>";
    }

    var sContent = "<h1>"+sTitle+"</h1>"+
                   sGoback +
                   img+
                   aTables.join("") +
                   "<hr>"+
                   sGoback +
                   "<p>Источник: "+sLink+"</p>" +
                   "<p>"+sRandomizer+"</p>";

    let sPage = createPage(sTemplate, sContent, sTitle, aImg);
    savePage(sPage, sPathToTablestOutput + "/"+sRandom+".html");
  }

// just loop to create article's pages with tables
function createTables() {
  for(var i=0; RandomItems.l[i]; i++) {
    for(var j=0; RandomItems.l[i].list[j]; j++) {
      if(
        RandomItems.l[i].list[j].fArticle == true
      ){

        createTablePage(RandomItems.l[i].list[j]);
      }
    }
  }
}

// create page with list of random tables articles
function createTableList() {
  createTables();
  sGlobalTablesList = getTablesList();
  let sPage = createPage(sTemplate, sGlobalTablesList, "Таблицы");
  savePage(sPage, sPathToTablestOutput + "/index.html");
}

// loop to creat the page to each text article
function createTexts(sSourcePath, sOutputPath) {
  console.log("Render text's articles");
  fs.readdirSync(sSourcePath).forEach(file => {
    if (path.extname(file) === htmlExt) {
      const fileName = path.basename(file);
      const fileContent = fs.readFileSync(path.join(sSourcePath, file));

      const $ = cheerio.load(fileContent.toString());
      const title = $("h1").text();
      const img = $("img")? $("img").attr('src') : null;

      const img_300 = img.replace(".","__300.");
      const img_500 = img.replace(".","__500.");
      const img_800 = img.replace(".","__800.");
      const aImg = [img, img_800, img_500, img_300];
      if($("img").length > 0) {
        $("img").attr('src', img_300);
        $("img").attr('srcset', img_500+" 500w, "+img_800+" 800w");
      }

      const sGoback = "<p><a href='/'><i class='fa fa-home' aria-hidden='true'></i></a><span style='color: #999'>"+sGoBackDelimiter+"</span><a href='/articles'>Статьи</a><span style='color: #999'>"+sGoBackDelimiter+"</span><a href='/articles/text'>Тексты</a><span style='color: #999'>"+sGoBackDelimiter+"</span>"+title+"</p>";
      $("p").first().before(sGoback);
      $("p").last().after("<hr>"+sGoback);
      const content = $.html();

      const page = createPage(sTemplate, content, title, aImg);
      savePage(page, sPathToTextOutput + "/" + fileName, "sinc");
    }
  });
}

// create list of texts articles
function createTextList(sSourcePath, sOutputPath) {

  let result = [];
  fs.readdirSync(sSourcePath).forEach(file => {
    if (path.extname(file) === htmlExt && file != 'index.html') {
      const fileName = path.basename(file);
      const fileContent = fs.readFileSync(path.join(sSourcePath, file));
      const sBody = fileContent.toString();
      const $ = cheerio.load(sBody, {decodeEntities: false});
      const fileTitle = $('h1').text();
      const description = $('.description').eq(0)? $('.description').eq(0).text() : null;
      //console.dir($('h1').text());
      result.push({
        title: fileTitle,
        name: file,
        description: description
      });
    }
  });
  sGlobalTextsList = getTextsList(result);
  const sPage = createPage(sTemplate, sGlobalTextsList, "Тексты");
  savePage(sPage, sPathToTextOutput + "/index.html");
}

// creata main page for article part of site with list of all articles
function createIndexPage() {
  const sPage = createPage(sTemplate, sGlobalTablesList+sGlobalTextsList);
  savePage(sPage, "../index.html");
}

// table's list
createTableList();

// create text articles from source
createTexts(sPathToTextSource, sPathToTextOutput);

// text's list
createTextList(sPathToTextOutput, sPathToTextOutput);

// articles main page
createIndexPage();
