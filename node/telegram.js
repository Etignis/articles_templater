'use strict';

const fs = require('fs');
const argv = require('yargs').argv;
const cheerio = require('cheerio');
const path = require('path');
const showdown  = require('showdown');
const MD2HTMLconverter = new showdown.Converter();
MD2HTMLconverter.setOption('strikethrough', true); // ~~ stroken ~~
MD2HTMLconverter.setOption('customizedHeaderId', true); // ## Sample header {real-id}     will use real-id as id
MD2HTMLconverter.setOption('rawHeaderId', true); // Remove only spaces, ' and " from generated header ids
// MD2HTMLconverter.setOption('ghCompatibleHeaderId', true); // Generate header ids compatible with github style


const sPathToTmp = '../../index.html';
const sPathToTeleChannels = 'TeleChannels.txt';
const htmlExt = '.html';
const mdExt = '.md';
const sPathToOutput = '../';
const SiteURL = "https://tentaculus.ru";
const SiteURL2 = "https://dr-tentaculus.github.io";
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
  
  $("link [rel='canonical']").remove();
  $("link [rel='alternate']").remove()
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

function fixDate(sDt) {
  return (Number(sDt)<10)? "0"+sDt: sDt;
}

/*
 *  Insert page content into page element (template)
 */

function createPage(sTemplate, sContent, oParams) { // sTitle, oImage, isComments, isLikes
  var oTemplate = cheerio.load(sTemplate, {decodeEntities: false});
  if(oParams) {
    const pageLink = (oParams.pageLink)?", pageUrl: \""+ SiteURL + oParams.pageLink+"\"" : "";
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
      sContent += '\n<p class="noRedString"><div id="vk_like"></div></p><!--script type="text/javascript">VK.Widgets.Like("vk_like", {type: "full"'+pageLink+pageTitle+pageImg+'}'+pageID+');</script-->';
    }
    if(oParams.isComments) {
      sContent += '\n<div id="vk_comments" style="position: relative; min-height: 2rem;"><span style="color: #bbb; position: absolute; left: .4em; z-index: -1">Если у вас не отображаются комментарии, значит либо запрещен доступ к сайту vk.com, либо стоит блокировщик всякого такого.</span></div></p><!--script type="text/javascript">VK.Widgets.Comments("vk_comments", {limit: 10, attach: "*"'+pageLink+'}'+pageID+');</script-->';
    }

    if(oParams.sTitle){
      oTemplate("title").text(oParams.sTitle);
      oTemplate("meta[property='og:title']").attr('content', oParams.sTitle);
      oTemplate("meta[property='og:description']").attr('content', oParams.sTitle);
    }
    if(oParams.sDescription) {
        let sDescription = oParams.sDescription.replace(/"/g, "'");  
        sDescription = sDescription.replace(/[\r\n]+/g, "").trim(); 
      //console.log("  - descript");
      oTemplate("meta[name=description]").attr('content', sDescription);
      oTemplate("meta[property='og:description']").attr('content', sDescription);
    }
    if(oParams.pageLink){
      oTemplate("link[rel=canonical]").attr('href', SiteURL + oParams.pageLink);
      oTemplate("link[rel=alternate]").attr('href', SiteURL2 + oParams.pageLink);
      oTemplate("meta[property='og:url']").attr('content', SiteURL + oParams.pageLink);
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
      oTemplate("body").append("<script type='text/javascript' src='archive/js/archive.js'></script>")
    }
  }

  oTemplate("#content").html("<article>"+sContent+"</article>");
  return oTemplate.html();
}

// check & add OG images
function insertMetaImage($, sPath, nIndex){
  if($("meta[property='og:image']").eq(nIndex).length > 0) {
    $("meta[property='og:image']").eq(nIndex).attr('content', SiteURL+"/"+sPath);
  } else {
    $("meta[property='og:type']").before('<meta property="og:image" content="'+SiteURL+"/"+sPath+'">\n');
  }
    $("meta[property='og:type']").before('<meta property="og:image" content="'+SiteURL2+"/"+sPath+'">\n');
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

function setName(sName) {
	if(sName) {
		sName = sName.charAt(0).toUpperCase() + sName.substr(1)+"</b>";
		sName += ": ";
	}
	return "<b>"+sName+"</b>";
}
function readTeleFile(){
	const fileContent = fs.readFileSync("D:/Cloud/0 Мои файлы/Сайты/_tentaculus/site/archive/node/TeleChannels.txt");
	return fileContent.toString();
}
function linkify(text) { 
	if(text.indexOf("|") == 1) { 
		text = text.replace("|", "");
	}
	if(text.indexOf("http")>-1) {
		text = text.replace(/(\bhttps?:\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, "<a href='$1'>$1</a>");
	} else {
		text = text.replace(/(\bt.me\/[\w\d_-]+)/ig, "<a href='https://$1'>$1</a>");
	}
    
	return text;
}
function parceTeleFile(sData){
	var aRet = [];
	var aMessages = sData.split("===");
	aMessages.forEach(function(el){
		if(el.indexOf("t.me/")>-1) {
			el = el.replace(/[\r\n]+/g, "|").replace("<MessageMediaWebPage> ", "");
		const oParams = /(([\wА-Яа-яЁё\s]+):?)?[\s|]*(https:\/\/t.me\/[^|\s]+)([\r\n\t\s]*.+)?/.exec(el);
			let sName = (oParams && oParams[2] || "").trim();
			const sLink = (oParams && oParams[3] || "").trim();
			if(sLink) {
				if(sName.indexOf(" и РИ")>-1) {
					sName = sName.replace(/и РИ.+/, "и РИ");
				}
				sName = setName(sName);
				const sOther = (oParams && oParams[4] || "").trim();
				aRet.push((sName + "<a href='"+sLink+"'>"+sLink+"</a> "+sOther).replace(/\|+/g, "<br>").replace(/@([\w\d_-]+)/g, "<a href='https://telegram.me/$1'>telegram.me/$1</a>"));
			} else {
				if(el.indexOf("t.me/")>-1) {
					aRet.push(linkify(el).replace(/\|+/g, "<br>").replace(/@([\w\d_-]+)/g, "<a href='https://telegram.me/$1'>telegram.me/$1</a>"));
				}
			}
		}
	});
	return aRet;
}
function getTelegramChats(){
	console.log("\nStart Telegram grabber");
	var spawn = require("child_process").spawn;
	var pythonProcess = spawn('python',["../python/telegram.py"]);
	
	pythonProcess.stdout.on('data', function (data){
		//console.log(data.toString());
		console.log("Python finished");
		//readTeleFile();
		//getTelegramChats();
		var aList = parceTeleFile(readTeleFile()).map(function(el) {return "<p class='noRedString'>"+el+"</p>"});
		var sImg = '<img src="_img/telegram_300.jpg" srcset="_img/telegram_500.jpg 500w, _img/telegram_800.jpg 800w" style="width: 100%" alt="">';
		var aImg = [
			"_img/telegram_800.jpg",
			"_img/telegram_500.jpg",
			"_img/telegram_300.jpg"
		];
		var sTitle = "Каналы и чаты телеграма ролевой направленности";
		var sContent = "<h1>"+sTitle+"</h1><p class='noRedString'>"+sImg+"</p>"+aList.join("<hr>");
		var sDescription = "Список каналов и чатов телеграма ролевой направленности";
		let sPage = createPage(sTemplate, sContent, {sDescription: sDescription, sTitle: sTitle, oImage: aImg});
		savePage(sPage, "../../telegram.html");
		return false;
	});
}
function createTelegramList(){
	getTelegramChats();
}


createTelegramList()
