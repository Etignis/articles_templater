'use strict';

const fs = require('fs');
const argv = require('yargs').argv;
const cheerio = require('cheerio');
const path = require('path');
const showdown  = require('showdown');
const MD2HTMLconverter = new showdown.Converter();
MD2HTMLconverter.setOption('strikethrough', true); // ~~ stroken ~~
MD2HTMLconverter.setOption('customizedHeaderId', true); // ## Sample header {real-id}     will use real-id as id
// MD2HTMLconverter.setOption('rawHeaderId', true); // Remove only spaces, ' and " from generated header ids
// MD2HTMLconverter.setOption('ghCompatibleHeaderId', true); // Generate header ids compatible with github style

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
const mdExt = '.md';
const sPathToOutput = '../';
const SiteURL = "https://tentaculus.ru";
const SiteName = "Dr.Tentaculus";
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
const sPubDate = "Дата публикации: ";

let sGlobalTablesList, sGlobalTextsList, sGlobalOthersList;

function tagnum(sTag, nMaxColor) {
  const codesSum = sTag.split('').map(c => c.charCodeAt(0)).reduce((acc, i) => acc + i);

  return codesSum % nMaxColor;
};

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
  if(!sTagline || sTagline=='' || sTagline==undefined || sTagline==null){
    return "";
  }

  const aTags = sTagline.split(/\s*[;,]\s*/);
  const sTags = aTags.map(function(tag){
    const tagcolor = tagnum(tag, 10); //  - tag.charCodeAt(0) + tag.charCodeAt(tag.length-1)
    return "<a href='/archive#q="+tag+"' class='tag c"+tagcolor+"'>"+tag+"</a>";
  }).join(" ");
  return "\n<p class='taglist noRedString' style='margin-top: .1em'>" + sTags + "</p>";
    //return "\n<br><span class='taglist'>#" + sTagline + "</span>";

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

        var sDescription = RandomItems.l[i].list[j].description? "\n<br><span class='desc'>"+RandomItems.l[i].list[j].description+"</span>" : "";
        var sTagList = RandomItems.l[i].list[j].tags? getTaglist(RandomItems.l[i].list[j].tags) : "-";

        aRows.push("<li><a href='/archive/tables/"+sName+".html'>"+sTitle+"</a>"+sDescription+sTagList+"</li>")

      }
    }
    if(aRows.length>0){
      aList.push(sPartTitle+"<ul class='tagable noBullets'>"+aRows.join("")+"</ul>");
    }
  }
  var sSectionTitle = "<h1 id='tables_section'>"+sTablesTitle+"</h1>";
  return sSectionTitle+sImage+aList.join("");
}

// get list of articles with text
function getTextsList(aSource, sImage) {
  let aRows = [];
  if(sImage == undefined)
     sImage="";
  for(var j=0; aSource[j]; j++) {
    var sTitle = aSource[j].title;
    var sName = aSource[j].name;//.replace(".html", "");
    var sDescription = aSource[j].description? "\n<br><span class='desc'>"+aSource[j].description+"</span>" : "";
    var sTags =aSource[j].taglist? getTaglist(aSource[j].taglist) : "";
    //console.log("hidden: "+aSource[j].hiddenClass);
    if(aSource[j].date){
      const sDate = (aSource[j].date)? aSource[j].date.getFullYear() +"."+ aSource[j].date.getMonth() +"."+ aSource[j].date.getDate():"";
      const sHiddenClass = (aSource[j].hiddenClass)? " class='hidden' data-date='"+sDate+"'" : "";
      aRows.push("<li"+sHiddenClass+"><a href='archive/articles/"+sName+"'>"+sTitle+"</a>"+sDescription+sTags+"</li>\n\t");
    }
  }

  var sTitle = "<h1 id='articles_section'>"+sArticlesTitle+"</h1>";
  return sTitle+sImage+"<ul class='tagable noBullets'>\n\t"+aRows.join("")+"</ul>\n\t";
}
// get list of other articles
function getOthersList(aSource, sImage) {
  let aRows = [];
  if(sImage == undefined)
     sImage="";
  for(var j=0; aSource[j]; j++) {
    var sTitle = aSource[j].title;
    var sName = aSource[j].name;//.replace(".html", "");;
    var sDescription = aSource[j].description? "\n<br><span class='desc'>"+aSource[j].description+"</span>" : "";
    var sTags =aSource[j].taglist? getTaglist(aSource[j].taglist) : "";

    aRows.push("<li><a href='archive/other/"+sName+"'>"+sTitle+"</a>"+sDescription+sTags+"</li>\n");

  }

  var sTitle = "<h1 id='othes_section'>"+sOthersTitle+"</h1>\n";
  return sTitle+sImage+"<ul class='tagable noBullets'>\n"+aRows.join("")+"</ul>\n";
}

/*
 *  Insert page content into page element (template)
 */

function createPage(sTemplate, sContent, oParams) { // sTitle, oImage, isComments, isLikes
  var oTemplate = cheerio.load(sTemplate, {decodeEntities: false});
  if(oParams) {
    const pageLink = (oParams.pageLink)?", pageUrl: \""+oParams.pageLink+"\"" : "";
    const pageID = (oParams.pageLink)?", \""+oParams.pageLink+"\"" : "";
    const pageTitle = (oParams.sTitle)?", pageTitle: \""+SiteName+" - "+oParams.sTitle+"\"" : "";
    let pageImg = "";
    if(oParams.oImage){
      if(typeof oParams.oImage == "string") {
        pageImg = ", pageImage: \""+SiteURL+"/"+oParams.sImage + "\"";
      }else if(Array.isArray(oParams.oImage)) {
        pageImg = ", pageImage: \""+SiteURL+"/"+oParams.oImage[0] + "\"";
      }
    }
    if(oParams.isLikes) {
      sContent += '\n<p class="noRedString"><div id="vk_like"></div></p><script type="text/javascript">VK.Widgets.Like("vk_like", {type: "full"'+pageLink+pageTitle+pageImg+'}'+pageID+');</script>';
    }
    if(oParams.isComments) {
      sContent += '\n<div id="vk_comments" style="position: relative"><span style="color: #bbb; position: absolute; left: .4em; z-index: -1">Если у вас не отображаются комментарии, значит либо запрещен доступ к сайту vk.com, либо стоит блокировщик всякого такого.</span></div></p><script type="text/javascript">VK.Widgets.Comments("vk_comments", {limit: 10, attach: "*"'+pageLink+'}'+pageID+');</script>';
    }

    if(oParams.sTitle){
      oTemplate("title").text(oParams.sTitle);
      oTemplate("meta[property='og:title']").attr('content', oParams.sTitle);
      oTemplate("meta[property='og:description']").attr('content', oParams.sTitle);
    }
    if(oParams.oImage){
      if(typeof oParams.oImage == "string") {
        oTemplate("meta[property='og:image']").attr('content', oParams.sImage);
      } else if(Array.isArray(oParams.oImage)) {
        oParams.oImage.forEach(function(img, i){
          insertMetaImage(oTemplate, img, i);
        });
      }
    }
    if(oParams.ifFilteScript) {
      oTemplate("body").append("<script type='text/javascript' src='archive/js/archive.js'></sript>")
    }
  }

  oTemplate("#content").html("<article>"+sContent+"</article>");
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
      console.log("The file was saved! \""+sPath+"\"");
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
    return "<ul class='tagable'>" + aTableRows.map(function(el){return "<li>" + el + "</li>"}).join("") + "</ul>";
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
    return "<ul class='tagable'>" + aTableRows.map(function(el){return "<li>" + el + "</li>"}).join("") + "</ul>";
}

// add title, image etc to table to create content for page
function createTablePage(oSrc, sMod) {
    var sTitle = oSrc.title;
    var sImage = oSrc.img? "archive/img/tables/"+oSrc.img : "archive/img/archive_tables.jpg";
    var sSource = oSrc.tooltip;

    var sDescription = oSrc.description? "\n<p>"+oSrc.description+"</p>" : "";
    var sDescriptionMore = oSrc.descriptionMore? "\n<p>"+oSrc.descriptionMore+"</p>" : "";
    var sURL = oSrc.url;
    var sRandom = oSrc.name;
    var aTables = [];
    var aSchemes = oSrc.schemes;
    var aSrc = oSrc.src;
    const taglist = oSrc.tags? getTaglist(oSrc.tags) : null;

    aSrc.forEach(function(el){
      var sTable = el.l;
      var sTableTitle = el.title? el.title : sResultTableTitle;
      aTables.push(createTable(sTable, "numericTable", sTableTitle));
    });

    var sLink = (sURL)? "<a href='"+sURL+"'>"+sSource+"</a>": sSource;

    var sRandomizer = "<a href='https://tentaculus.ru/random/#item="+sRandom+"'>🎲 "+sRandomizator+"</a>";
    var sGoback = "\n<p class='noRedString breadcrumps'>" + sGoToMain +sGoBackDelimiter+"<a href='/archive'>"+sArchiveTitle+"</a>"+sGoBackDelimiter+"<a href='/archive/tables'>"+sTablesTitle+"</a>"+sGoBackDelimiter + sTitle+"</p>";

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
                   "\n<p class='noRedString'>"+sSourceTitle+": "+sLink+"</p>" +
                   "\n<p class='noRedString'>"+sRandomizer+"</p>" +
                   "<hr>"+
                   sGoback +
                   taglist;

    let sPage = createPage(sTemplate, sContent, {sTitle: sTitle, oImage: aImg, isComments: true, isLikes: true, pageLink: SiteURL+"/tables/"+sRandom+".html"});

    savePage(sPage, sPathToTablestOutput + "/"+sRandom+".html");
}

// just loop to create article's pages with tables
function createTables() {
  console.log("Render table's articles");
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
  const sGoback = "\n<p class='noRedString breadcrumps'>"+sGoToMain+sGoBackDelimiter+"<a href='/archive'>"+sArchiveTitle+"</a>"+sGoBackDelimiter+sTablesTitle+"</p>";
  const $Page = cheerio.load(sGlobalTablesList);
  $Page("h1").after(sGoback);
  const sPage = createPage(sTemplate, $Page.html(), {sTitle: sTablesTitle, oImage: aImg, ifFilteScript: false});
  savePage(sPage, sPathToTablestOutput + "/index.html");
  //savePage(sPage, "../tables.html");
}

// loop to creat the page to each text article
function createTexts(sSourcePath, sOutputPath) {
  console.log("Render text's articles");
  fs.readdirSync(sSourcePath).forEach(file => {
    if (path.extname(file) === htmlExt || path.extname(file) === mdExt) {
      const fileName = path.basename(file).split(".")[0] + ".html";
      const fileContent = fs.readFileSync(path.join(sSourcePath, file));
      let sourceText = fileContent.toString();
      const bNotReady = /[\s\t\r\n]*notready!/.test(sourceText);
      if(bNotReady) {
          sourceText = sourceText.replace(/[\s\t\r\n]*notready![\s\r\n\t]*/, "");
      }
      const bHidTillDate = /[\s\t\r\n]*hidetilldate!/.test(sourceText);
      if(bHidTillDate) {
          sourceText = sourceText.replace(/[\s\t\r\n]*hidetilldate![\s\r\n\t]*/, "");
      }
      // md 2 html
      if (path.extname(file) === mdExt) {
        sourceText = MD2HTMLconverter.makeHtml(sourceText);
      }
      // /md 2 html

      const $ = cheerio.load(sourceText);
     // if(!$(".notready").length>0){
        if(bNotReady) {
          $("h1").eq(0).addClass("notready");
        }
        if(bHidTillDate) {
          $("h1").eq(0).addClass("hidetilldate");
        }
        const title = $("h1").eq(0).text();
        const taglist = $('.hashtags').eq(0)? getTaglist($('.hashtags').eq(0).text()) : "";
        
        let dateString = $('.date').eq(0)? $('.date').eq(0).text() : "";
        if(dateString) {
          const aDate = dateString.split(".");
          const sDay = aDate[0];
          const sMonth = aDate[1];
          const sYear = aDate[2];
          //dateString = new Date(sYear, sMonth, sDay);
          dateString = sPubDate + "<time pubdate datetime='"+sYear+"-"+sMonth+"-"+sDay+"' >"+dateString+"</time>";
          $('.date').eq(0).html(dateString);
        }

        const img = ($("img") && $("img").eq(0).attr('src'))? $("img").eq(0).attr('src') : "archive/img/archive_articles.jpg";

        $("img").each(function(i, el){
            $(this).parent("p").addClass("noRedString");
        });
        console.log(img);
        const img_300 = img.replace(".","__300.");
        const img_500 = img.replace(".","__500.");
        const img_800 = img.replace(".","__800.");
        const aImg = [img, img_800, img_500, img_300];
        if($("img").length > 0) {
          $("img").attr('src', img_300);
          $("img").attr('srcset', img_500+" 500w, "+img_800+" 800w");
        }

        const sGoback = "\n<p class='noRedString breadcrumps'>"+sGoToMain+sGoBackDelimiter+"<a href='/archive'>"+sArchiveTitle+"</a>"+sGoBackDelimiter+"<a href='/archive/articles'>"+sArticlesTitle+"</a>"+sGoBackDelimiter + title+"</p>";

        $("h1").first().after(sGoback);
        $("p").last().after("<hr>"+sGoback);
        const content = $.html()+taglist;


        const page = createPage(sTemplate, content, {sTitle: title, oImage: aImg, isComments: true, isLikes: true, pageLink: SiteURL+"/articles/"+fileName});
        savePage(page, sOutputPath + "/" + fileName, "sinc");
      //}
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
      const sHiddenClass = ($(".hidetilldate").length>0)? true: false;
      if(!$(".notready").length>0){
        const fileTitle = $('h1').text();
        const description = ($('.description').eq(0) && $('.description').eq(0).html() != null)? $('.description').eq(0).html() : $("#content img").eq(0).parent().next("p").text();
        
        const taglist = $('.hashtags').eq(0)? $('.hashtags').eq(0).text() : "";
        let dateString = $('.date').eq(0)? $('.date').eq(0).text() : "";
        if(dateString) {
          const aDate = dateString.split(".");
          const sDay = aDate[0];
          const sMonth = aDate[1];
          const sYear = aDate[2];
          dateString = new Date(sYear, sMonth, sDay);
        }
        //console.dir($('h1').text());
        result.push({
          title: fileTitle,
          name: file,
          description: description,
          taglist: taglist,
          date: dateString,
          hiddenClass: sHiddenClass
        });
      }
    }
  });
  const sImage = "<img src='archive/img/archive_articles__300.jpg' srcset='archive/img/archive_articles__500.jpg 500w, archive/img/archive_articles__800.jpg 800w, archive/img/archive_articles.jpg 2000w' style='width: 100%' alt=''>";
  const aImg = [
    "archive/img/archive_articles.jpg",
    "archive/img/archive_articles__800.jpg",
    "archive/img/archive_articles__500.jpg",
    "archive/img/archive_articles__300.jpg",
  ];
  result = result.sort(function(a,b){
    if (a.date < b.date)
      return -1;
    if (a.date > b.date)
      return 1;
    return 0;
  });
  sGlobalTextsList = getTextsList(result, sImage);
  const sGoback = "\n<p class='noRedString breadcrumps'>"+sGoToMain+sGoBackDelimiter+"<a href='/archive'>"+sArchiveTitle+"</a>"+sGoBackDelimiter+sArticlesTitle+"</p>";
  const $Page = cheerio.load(sGlobalTextsList);
  $Page("h1").after(sGoback);
  const sPage = createPage(sTemplate, $Page.html(), {sTitle: sArticlesTitle, oImage: aImg, ifFilteScript: false});
  savePage(sPage, sPathToTextOutput + "/index.html");
  //savePage(sPage, "../articles.html");
}

//TODO to do it...
function createInnerContent(sSourcePath, sOutputPath, oParams){
  if(oParams && oParams.consoleStart) console.log(oParams.consoleStart);
  fs.readdirSync(sSourcePath).forEach(file => {
    if (path.extname(file) === htmlExt || path.extname(file) === mdExt) {
      const fileName = path.basename(file).split(".")[0] + ".html";
      const fileContent = fs.readFileSync(path.join(sSourcePath, file));
      let sourceText = fileContent.toString();
      const bNotReady = /^[\s\t\r\n]*notready!/.test(sourceText);
      if(bNotReady) {
          sourceText.replace(/^[\s\t\r\n]*notready![\s\r\n\t]*/, "");
      }
      // md 2 html
      if (path.extname(file) === mdExt) {
        sourceText = MD2HTMLconverter.makeHtml(sourceText);
      }
      // /md 2 html

      const $ = cheerio.load(sourceText);
     // if(!$(".notready").length>0){
        if(bNotReady) {
          $("h1").eq(0).addClass("notready");
        }
        const title = $("h1").eq(0).text();
        const taglist = $('.hashtags').eq(0)? getTaglist($('.hashtags').eq(0).text()) : "";

        const img = $("img")? $("img").eq(0).attr('src') : ((oParams && oParams.placeholderImage)? oParams.placeholderImage : "../../_img/og_huge.jpg");

        $("img").each(function(i, el){
            $(this).parent("p").addClass("noRedString");
        });
        if(oParams && oParams.bImagesSizes){
          const img_300 = img.replace(".","__300.");
          const img_500 = img.replace(".","__500.");
          const img_800 = img.replace(".","__800.");
          const aImg = [img, img_800, img_500, img_300];
          if($("img").length > 0) {
            $("img").attr('src', img_300);
            $("img").attr('srcset', img_500+" 500w, "+img_800+" 800w");
          }
        } else {
          const aImg = [img];
        }


        const sGoback = "\n<p class='noRedString breadcrumps'>"+sGoToMain+sGoBackDelimiter+"<a href='/archive'>"+sArchiveTitle+"</a>"+sGoBackDelimiter+"<a href='/archive/articles'>"+sArticlesTitle+"</a>"+sGoBackDelimiter + title+"</p>";

        $("h1").first().after(sGoback);
        $("p").last().after("<hr>"+sGoback);
        const content = $.html()+taglist;


        const page = createPage(sTemplate, content, {sTitle: title, oImage: aImg, isComments: true, isLikes: true, pageLink: SiteURL+"/articles/"+fileName});
        savePage(page, sOutputPath + "/" + fileName, "sinc");
      //}
    }
  });
}

// loop to creat the page to each ther article
function createOthers(sSourcePath, sOutputPath) {
  console.log("Render other's articles");
  fs.readdirSync(sSourcePath).forEach(file => {
    if (path.extname(file) === htmlExt || path.extname(file) === mdExt) {
      const fileName = path.basename(file).split(".")[0] + ".html";
      const fileContent = fs.readFileSync(path.join(sSourcePath, file));
      let sourceText = fileContent.toString();
      // md 2 html
      if (path.extname(file) === mdExt) {
        sourceText = MD2HTMLconverter.makeHtml(sourceText);
      }
      // /md 2 html

      const $ = cheerio.load(sourceText);
      const title = $("h1").eq(0).text();
      const taglist = $('.hashtags').eq(0)? getTaglist($('.hashtags').eq(0).text()) : "";
      //console.log(title);
      const img = $("img")? $("img").attr('src') : "archive/img/archive_other.jpg";

      let dateString = $('.date').eq(0)? $('.date').eq(0).text() : "";
      if(dateString) {
        const aDate = dateString.split(".");
        const sDay = aDate[0];
        const sMonth = aDate[1];
        const sYear = aDate[2];
        //dateString = new Date(sYear, sMonth, sDay);
        dateString = sPubDate + "<time pubdate datetime='"+sYear+"-"+sMonth+"-"+sDay+"' >"+dateString+"</time>";
        $('.date').eq(0).html(dateString);
      }
      
      let aImg = [];
      for(var i=0; i<$("img").length; i++) {
        aImg.push($("img").eq(i).attr('src'));

        let sImgURL = $("img").eq(i).attr("src");
        let sImgObj = $("img").eq(i);
        //console.dir(sImgObj);
        $("img").eq(i).replaceWith("<a href='"+sImgURL+"'>"+sImgObj+"</a>");
      }
      //console.dir(aImg);

      const sGoback = "\n<p class='noRedString breadcrumps'>"+sGoToMain+sGoBackDelimiter+"<a href='/archive'>"+sArchiveTitle+"</a>"+sGoBackDelimiter+"<a href='/archive/other'>"+sOthersTitle+"</a>"+sGoBackDelimiter + title+"</p>";
      $("h1").first().after(sGoback);
      $("p").last().after("<hr>"+sGoback);
      const content = $.html() + taglist;
      //console.dir(content);

      const page = createPage(sTemplate, content, {sTitle: title, oImage: aImg, isComments: true, isLikes: true, pageLink: SiteURL+"/other/"+fileName});
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
      const description = $('.description').eq(0)? $('.description').eq(0).html() : (($("p").length>0)? $("p").eq(0).html() : "");
      const taglist = $('.hashtags').eq(0)? $('.hashtags').eq(0).text() : "";
      let dateString = $('.date').eq(0)? $('.date').eq(0).text() : "";
      if(dateString) {
        const aDate = dateString.split(".");
        const sDay = aDate[0];
        const sMonth = aDate[1];
        const sYear = aDate[2];
        dateString = new Date(sYear, sMonth, sDay);
      }
      //console.dir($('h1').text());
      result.push({
        title: fileTitle,
        name: file,
        description: description,
        taglist: taglist,
        date: dateString
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
  result = result.sort(function(a,b){
    if (a.date < b.date)
      return -1;
    if (a.date > b.date)
      return 1;
    return 0;
  });
  sGlobalOthersList = getOthersList(result, sImage);
  const sGoback = "\n<p class='noRedString breadcrumps'>"+sGoToMain+sGoBackDelimiter+"<a href='/archive'>"+sArchiveTitle+"</a>"+sGoBackDelimiter+sOthersTitle+"</p>";
  const $Page = cheerio.load(sGlobalOthersList);
  $Page("h1").after(sGoback);
  const sPage = createPage(sTemplate, $Page.html(), { sTitle: sOthersTitle, oImage:aImg, ifFilteScript: false});
  savePage(sPage, sOutputPath + "/index.html");
  //savePage(sPage, "../other.html");
}

// creata main page for article part of site with list of all articles
function createIndexPage() {
  console.log("Render index page");

  const sHeader = "<h1>Архив</h1>";
  const sPrevText = "<p class='noRedString'>В этом разделе собраны материалы, распределенные по нескольким категориям.\n<ul class='noBullets'>\n<li> <a class='section_link' href='archive#tables_section'>Таблицы</a> - Таблицы случайных вещей, сокровищ, событий, слухов и прочего.</li>\n<li> <a class='section_link' href='archive#articles_section'>Статьи</a> - Статьи и заметки с советами по проведению Настольных Ролевых Игр.</li>\n<li> <a class='section_link' href='archive#othes_section'>Разное</a> - Все остальные материалы.</li>\n</ul>\n</p>";
  // replace Hn -> Hn-1
  const sStartContent = sGlobalTablesList + sGlobalTextsList + sGlobalOthersList;
  const sFinishContent = sStartContent.replace(/\bh2\b/gi, "h3").replace(/\bh1\b/gi, "h2");

  const sPage = createPage(sTemplate, sHeader + sPrevText + sFinishContent, {ifFilteScript: true});
  savePage(sPage, "../index.html");
  //savePage(sPage, "../../archive.html");
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
