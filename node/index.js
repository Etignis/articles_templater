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
const sPathToTextOutput = '../articles';
const sPathToOtherSource = '../source/other';
const sPathToOtherOutput = '../other';
const sPathToTablestOutput = '../tables';
const htmlExt = '.html';
const sPathToOutput = '../';
const sTemplate = getTemplate();

const sGoBackDelimiter = "<span style='color: #999'>/</span>";
const sGoToMain = "<a href='/'>🐙</a>"; //<i class='fa fa-home' aria-hidden='true'></i>

const sArchiveTitle = "Архив";
const sTablesTitle = "Таблицы";
const sArticlesTitle = "Статьи";
const sOthersTitle = "Разное";
const sResultTableTitle = "Результат";
const sRandomizator = "Смотреть в рандомизаторе";
const sSourceTitle = "Источник";

let sGlobalTablesList, sGlobalTextsList, sGlobalOthersList;

// get index.html from main site and clear content
function getTemplate(){
  const fileContent = fs.readFileSync(sPathToTmp);
  const $ = cheerio.load(fileContent.toString(), {decodeEntities: false});
  $("body").addClass("maxWidth880");
  $("#content").text("");
  $("#content").addClass('ephasizedPage');
  //console.dir($.html());
  return $.html();
}

function getTaglist(sTagline) {
  const aTags = sTagLine.split(/\s*[;,]\s*/);
  const sTags = aTags.map(function(tag){
    return "<a href='/archive?q="+tag+"' class='tag'>"+tag+"</a>";
  }).join(" ");
  return "<br><span class='taglist'>#" + sTags + "</span>";
}

// get list of articles with random tables
function getTablesList(sImage) {
  var aList = [];
  if(sImage == undefined)
     sImage="";
  for(var i=0; RandomItems.l[i]; i++) {
    var sPartTitle = "<h2>"+RandomItems.l[i].title+"</h2>";
    var aRows = [];
    for(var j=0; RandomItems.l[i].list[j]; j++) {
      if(
        RandomItems.l[i].list[j].fArticle == true
      ){
        var sTitle = RandomItems.l[i].list[j].title;
        var sName = RandomItems.l[i].list[j].name;

        var sDescription = RandomItems.l[i].list[j].description? "<br><span class='desc'>"+RandomItems.l[i].list[j].description+"</span>" : "";
        var sTagList = RandomItems.l[i].list[j].tags? getTaglist(RandomItems.l[i].list[j].tags) : "";

        aRows.push("<li><a href='/archive/tables/"+sName+".html'>"+sTitle+"</a>"+sDescription+sTagList+"</li>")

      }
    }
    aList.push(sPartTitle+"<ul>"+aRows.join("")+"</ul>")
  }
  var sSectionTitle = "<h1>"+sTablesTitle+"</h1>";
  return sSectionTitle+sImage+aList.join("");
}

// get list of articles with text
function getTextsList(aSource, sImage) {
  let aRows = [];
  if(sImage == undefined)
     sImage="";
  for(var j=0; aSource[j]; j++) {
    var sTitle = aSource[j].title;
    var sName = aSource[j].name;
    var sDescription = aSource[j].description? "<br><span class='desc'>"+aSource[j].description+"</span>" : "";
    var sTags =aSource[j].taglist? getTaglist(aSource[j].taglist) : "";


    aRows.push("<li><a href='archive/articles/"+sName+"'>"+sTitle+"</a>"+sDescription+sTags+"</li>");
  }

  var sTitle = "<h1>"+sArticlesTitle+"</h1>";
  return sTitle+sImage+"<ul>"+aRows.join("")+"</ul>";
}
// get list of other articles
function getOthersList(aSource, sImage) {
  let aRows = [];
  if(sImage == undefined)
     sImage="";
  for(var j=0; aSource[j]; j++) {
    var sTitle = aSource[j].title;
    var sName = aSource[j].name;
    var sDescription = aSource[j].description? "<br><span class='desc'>"+aSource[j].description+"</span>" : "";
    var sTags =aSource[j].taglist? getTaglist(aSource[j].taglist) : "";

    aRows.push("<li><a href='archive/other/"+sName+"'>"+sTitle+"</a>"+sDescription+sTags+"</li>");

  }

  var sTitle = "<h1>"+sOthersTitle+"</h1>";
  return sTitle+sImage+"<ul>"+aRows.join("")+"</ul>";
}

/*
 *  Insert page content into page element (template)
 */

function createPage(sTemplate, sContent, sTitle, oImage, isComments, isLikes) {
  var oTemplate = cheerio.load(sTemplate, {decodeEntities: false});
  if(isLikes) {
    sContent += '<p class="noRedString"><div id="vk_like"></div></p><script type="text/javascript">VK.Widgets.Like("vk_like", {type: "full"});</script>';
  }
  if(isComments) {
    sContent += '<div id="vk_comments"></div></p><script type="text/javascript">VK.Widgets.Comments("vk_comments", {limit: 10, attach: "*"});</script>';
  }
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
    const sTableHeader = "<tr><th>"+sD+"</th><th>"+ (sTitle? sTitle : sResultTableTitle)+"</th></tr>";
    return "<table class='randomTable'>" + sTableHeader + aTableRows.map(function(el){return "<tr>" + el + "</tr>"}).join("") + "</table>";
  }
  else
    return "<ul>" + aTableRows.map(function(el){return "<li>" + el + "</li>"}).join("") + "</ul>";
}

// add title, image etc to table to create content for page
function createTablePage(oSrc, sMod) {
    var sTitle = oSrc.title;
    var sImage = oSrc.img? "archive/img/"+oSrc.img : "archive/img/archive_tables.jpg";
    var sSource = oSrc.tooltip;

    var sDescription = oSrc.description? "<p>"+oSrc.description+"</p>" : "";
    var sDescriptionMore = oSrc.descriptionMore? "<p>"+oSrc.descriptionMore+"</p>" : "";
    var sURL = oSrc.url;
    var sRandom = oSrc.name;
    var aTables = [];
    var aSchemes = oSrc.schemes;
    var aSrc = oSrc.src;
    const taglist = oSrc.tags? getTaglist(oSrc.tags) : null;

    aSrc.forEach(function(el){

      var sTable = el.l;

      var sTableTitle = el.title? el.title : "Результат";

      aTables.push(createTable(sTable, "numericTable", sTableTitle));
    });

    var sLink = (sURL)? "<a href='"+sURL+"'>"+sSource+"</a>": sSource;

    var sRandomizer = "<a href='https://tentaculus.ru/random/#item="+sRandom+"'>"+sRandomizator+"</a>";
    var sGoback = "<p class='noRedString breadcrumps'>" + sGoToMain +sGoBackDelimiter+"<a href='/archive'>"+sArchiveTitle+"</a>"+sGoBackDelimiter+"<a href='/archive/tables'>"+sTablesTitle+"</a>"+sGoBackDelimiter + sTitle+"</p>";

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
                   sDescription+
                   sDescriptionMore+
                   aTables.join("") +
                   taglist +
                   "<hr>"+
                   sGoback +
                   "<p class='noRedString'>"+sSourceTitle+": "+sLink+"</p>" +
                   "<p class='noRedString'>"+sRandomizer+"</p>";

    let sPage = createPage(sTemplate, sContent, sTitle, aImg, true, true);

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
  createTables(); //img =  "<img src='"+img_300+"' srcset='"+img_500+" 500w, "+img_800+" 800w, "+sImage+" 2000w' style='width: 100%' alt=''>";
  const sImage = "<img src='archive/img/archive_tables__300.jpg' srcset='archive/img/archive_tables__500.jpg 500w, archive/img/archive_tables__800.jpg 800w, archive/img/archive_tables.jpg 2000w' style='width: 100%' alt=''>";
  const aImg = [
    "archive/img/archive_tables.jpg",
    "archive/img/archive_tables__800.jpg",
    "archive/img/archive_tables__500.jpg",
    "archive/img/archive_tables__300.jpg",
  ];
  sGlobalTablesList = getTablesList(sImage);
  const sPage = createPage(sTemplate, sGlobalTablesList, sTablesTitle, aImg);
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
      const taglist = $('.taglist').eq(0)? getTaglist(s$('.taglist').eq(0).text()) : null;

      const img = $("img")? $("img").attr('src') : "archive/img/archive_articles.jpg";

      const img_300 = img.replace(".","__300.");
      const img_500 = img.replace(".","__500.");
      const img_800 = img.replace(".","__800.");
      const aImg = [img, img_800, img_500, img_300];
      if($("img").length > 0) {
        $("img").attr('src', img_300);
        $("img").attr('srcset', img_500+" 500w, "+img_800+" 800w");
      }

      const sGoback = "<p class='noRedString breadcrumps'>"+sGoToMain+sGoBackDelimiter+"<a href='/archive'>"+sArchiveTitle+"</a>"+sGoBackDelimiter+"<a href='/archive/articles'>"+sArticlesTitle+"</a>"+sGoBackDelimiter + title+"</p>";

      $("p").first().before(sGoback);
      $("p").last().after("<hr>"+sGoback);
      const content = $.html()+taglist;


      const page = createPage(sTemplate, content, title, aImg, true, true);
      savePage(page, sOutputPath + "/" + fileName, "sinc");

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
      const taglist = $('.taglist').eq(0)? $('.taglist').eq(0).text() : null;
      //console.dir($('h1').text());
      result.push({
        title: fileTitle,
        name: file,
        description: description,
        taglist: taglist
      });
    }
  });
  const sImage = "<img src='archive/img/archive_articles__300.jpg' srcset='archive/img/archive_articles__500.jpg 500w, archive/img/archive_articles__800.jpg 800w, archive/img/archive_articles.jpg 2000w' style='width: 100%' alt=''>";
  const aImg = [
    "archive/img/archive_articles.jpg",
    "archive/img/archive_articles__800.jpg",
    "archive/img/archive_articles__500.jpg",
    "archive/img/archive_articles__300.jpg",
  ];
  sGlobalTextsList = getTextsList(result, sImage);
  const sPage = createPage(sTemplate, sGlobalTextsList, sArticlesTitle, aImg);
  savePage(sPage, sPathToTextOutput + "/index.html");
}

// loop to creat the page to each ther article
function createOthers(sSourcePath, sOutputPath) {
  console.log("Render other's articles");
  fs.readdirSync(sSourcePath).forEach(file => {
    if (path.extname(file) === htmlExt) {
      const fileName = path.basename(file);
      const fileContent = fs.readFileSync(path.join(sSourcePath, file));
      const $ = cheerio.load(fileContent.toString());
      const title = $("h1").text();
      const taglist = $('.taglist').eq(0)? getTaglist(s$('.taglist').eq(0).text()) : null;
      //console.log(title);
      const img = $("img")? $("img").attr('src') : "archive/img/archive_other.jpg";

      let aImg = [];
      for(var i=0; i<$("img").length; i++) {
        aImg.push($("img").eq(i).attr('src'));

        let sImgURL = $("img").eq(i).attr("src");
        let sImgObj = $("img").eq(i);
        //console.dir(sImgObj);
        $("img").eq(i).replaceWith("<a href='"+sImgURL+"'>"+sImgObj+"</a>");
      }
      //console.dir(aImg);

      const sGoback = "<p class='noRedString breadcrumps'>"+sGoToMain+sGoBackDelimiter+"<a href='/archive'>"+sArchiveTitle+"</a>"+sGoBackDelimiter+"<a href='/archive/other'>"+sOthersTitle+"</a>"+sGoBackDelimiter + title+"</p>";
      $("h1").first().after(sGoback);
      $("p").last().after("<hr>"+sGoback);
      const content = $.html() + taglist;
      //console.dir(content);

      const page = createPage(sTemplate, content, title, aImg, true, true);
      savePage(page, sOutputPath + "/" + fileName, "sinc");
    }
  });
}

// create list of texts articles
function createOtherList(sSourcePath, sOutputPath) {

  let result = [];
  fs.readdirSync(sSourcePath).forEach(file => {
    if (path.extname(file) === htmlExt && file != 'index.html') {
      const fileName = path.basename(file);
      const fileContent = fs.readFileSync(path.join(sSourcePath, file));
      const sBody = fileContent.toString();
      const $ = cheerio.load(sBody, {decodeEntities: false});
      const fileTitle = $('h1').text();
      const description = $('.description').eq(0)? $('.description').eq(0).text() : null;
      const taglist = $('.taglist').eq(0)? $('.taglist').eq(0).text() : null;
      //console.dir($('h1').text());
      result.push({
        title: fileTitle,
        name: file,
        description: description,
        taglist: taglist
      });
    }
  });
  const sImage = "<img src='archive/img/archive_other__300.jpg' srcset='archive/img/archive_other__500.jpg 500w, archive/img/archive_other__800.jpg 800w, archive/img/archive_other.jpg 2000w' style='width: 100%' alt=''>";
  const aImg = [
    "archive/img/archive_other.jpg",
    "archive/img/archive_other__800.jpg",
    "archive/img/archive_other__500.jpg",
    "archive/img/archive_other__300.jpg",
  ];
  sGlobalOthersList = getOthersList(result, sImage);
  const sPage = createPage(sTemplate, sGlobalOthersList, sOthersTitle, aImg);
  savePage(sPage, sOutputPath + "/index.html");
}

// creata main page for article part of site with list of all articles
function createIndexPage() {
  const sPage = createPage(sTemplate, sGlobalTablesList + sGlobalTextsList + sGlobalOthersList);
  savePage(sPage, "../index.html");
}

// table's list
createTableList();

// create text articles from source
createTexts(sPathToTextSource, sPathToTextOutput);

// text's list
createTextList(sPathToTextOutput, sPathToTextOutput);

// create other articles from source
createOthers(sPathToOtherSource, sPathToOtherOutput);
// other's list
createOtherList(sPathToOtherOutput, sPathToOtherOutput);

// articles main page
createIndexPage();
