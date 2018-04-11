'use strict';

const fs = require('fs');
const argv = require('yargs').argv;
const cheerio = require('cheerio');
const path = require('path');
const showdown  = require('showdown');
const request = require('request');
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

function getDataFromTelegram(sLink){
	sLink = "https://"+sLink;
	//console.log("Start: "+sLink);
	var p1 = new Promise((resolve, reject) => { 
		request(sLink, function (err, res, body) {
			if (err) { 
				console.dir("error while 'request'" + err);
				return reject("");
			}
			try{
				const $ = cheerio.load(body.toString(), {decodeEntities: false});
				const sTitle = $(".tgme_page_title").eq(0).text().trim().replace(/[\n\r]+/ig, "");
				const sInfo = $(".tgme_page_description").eq(0).html() || "";
				const sA = $(".tgme_action_button_new").eq(0).attr("href");
				let sRet = "<b>"+sTitle+":</b> " + sLink + "<br>" + sInfo;
				//sRet = sRet.replace(/([a-zа-яё])\.([а-яё])/ig, "$1. $2");
				sRet = sRet.replace(/(bit\.ly\/[\w\d]+)/, " http://$1 ");
				//sRet = sRet.replace(/@([\w\d]+)/ig, "https://t.me/$1");
				//sRet = sRet.replace(/tg:\/\/join\?invite=([\w\d]+)/ig, "https://t.me/joinchat/$1");
				sRet = sRet.replace(/(https?:\/\/[\w\d\/\._-]+)/ig, " <a href='$1'>$1</a> ");
				//console.log(sRet);
				var o = {
					"link": sLink,
					"text": sRet
				};
				//o[sLink] = sRet;
				return resolve(o);
			} catch (err) {
				console.dir("[ERROR]: "+err);
				return reject("");
			}
			
		});
		//setTimeout(resolve, 1000, "one"); 
	}); 
	
	return p1;
}
function parceTeleFile(sData){
	var aTeleLinks = [
		"https://t.me/fatecore",
		"https://t.me/pathfinder_ru",
		"https://t.me/PoweredByTheApocalypse",
		"https://t.me/Unknown_Armies",
		"https://t.me/makerpg",
		"https://t.me/livingroomstudio"
		];
	/*/
	var oRet = {
		"https://t.me/fatecore": "<b>Fate Core:</b> <a href='https://t.me/fatecore'>https://t.me/fatecore</a><br>Обсуждаем здесь Fate Core и другие ролевые игры (иногда). На отвлеченных темах не застреваем. Ведем себя прилично.",
		"https://t.me/pathfinder_ru": "<b>Pathfinder:</b> <a href='https://t.me/pathfinder_ru'>https://t.me/pathfinder_ru</a><br> Канал посвященный обсуждению Pathfinder RPG и Pathfinder Society на русском языке.",
		"https://t.me/PoweredByTheApocalypse": "<b>PbtA:</b> <a href='https://t.me/PoweredByTheApocalypse'>https://t.me/PoweredByTheApocalypse</a><br> Чат для обсуждения игр на движке ПбтА. Вопрос-ответ, новые хаки, советы, обсуждения.",
		"https://t.me/Unknown_Armies": "<b>Unknown Armies:</b> <a href='https://t.me/Unknown_Armies'>https://t.me/Unknown_Armies</a><br> Оккультный андеграунд, идеи и помощь поклонникам Неизвестных Армий.",
		"https://t.me/makerpg": "<b>Лаборатория НРИ:</b> <a href='https://t.me/makerpg '>https://t.me/makerpg </a><br>Настольные ролевые игры на русском языке. Обсуждение, ответы на вопросы, создание, тестирование.",
		"https://t.me/livingroomstudio": "<b>LivingRoomStudio:</b> <a href='https://t.me/livingroomstudio'>https://t.me/livingroomstudio</a><br> Данный чат создан командой LivingRoomStudio (LRS) и посвящён обсуждению её творчества и настольной ролевой игре (НРИ) Dungeons&Dragons."
	};
	/**/

	var aMessages = sData.split("===");
	var aLinks = [],
			oLinks = {"t.me/livingroomstudio": ""};
	aMessages.forEach(function(el){
		/*/
			tg://join?invite=AHXLIkLPWzI3tiVXDelbLQ  -> https://t.me/joinchat/AHXLIkLPWzI3tiVXDelbLQ
			https://t.me/joinchat/AHXLIkLPWzI3tiVXDelbLQ
			https://t.me/fatecore
			@Unknown_Armies
			t.me/gde_tusa4_spb
		/**/
		el = el.replace(/tg:\/\/join\?invite=([\w\d]+)/ig, "https://t.me/joinchat/$1");
		el = el.replace(/@([\w\d]+)/ig, "https://t.me/$1");
		
		var aExtractedLinks = el.match(/t\.me\/[^\s\t\n\r]+/gi);
		if(aExtractedLinks && aExtractedLinks.length>0) {
			aExtractedLinks.forEach(function(item) {
				if(item.indexOf("GoblinQueen") == -1) {
					oLinks[item] = "";
				}
			});
		}
		
		
		
		
		/*/
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
				var sText = (sName + "<a href='"+sLink+"'>"+sLink+"</a> "+sOther).replace(/\|+/g, "<br>").replace(/@([\w\d_-]+)/g, "<a href='https://telegram.me/$1'>telegram.me/$1</a>");
				//aRet.push(sText);
				if(!oRet.hasOwnProperty(sLink))
					oRet[sLink] = sText;
			} else {
				if(el.indexOf("t.me/")>-1) {
					aRet.push(linkify(el).replace(/\|+/g, "<br>").replace(/@([\w\d_-]+)/g, "<a href='https://telegram.me/$1'>telegram.me/$1</a>"));
				}
			}
		/**/
	});
	//console.dir(oLinks);
	//aDefer.push(getDataFromTelegram("t.me/joinchat/AHXLIkLPWzI3tiVXDelbLQ"));
	var aDefer=[];
	/**/
	for (var i in oLinks) {
		aDefer.push(getDataFromTelegram(i));
	}
	/**/
	Promise.all(aDefer).then(function(aChats){
		var aRet = [];
		var oChats = {};
		aChats.forEach(function(el){
			//console.dir(el);
			oChats[el.link] = el.text;			
		});
		//console.dir(oChats);
		/**/
		var aRet = [];
		aTeleLinks.forEach(function(el){
			//console.log(el);
			if(oChats[el]){
				//console.log(el + " === " + aChats[el])
				aRet.push(oChats[el]);
				delete oChats[el];
			}
		});
		for (var i in oChats) {
			aRet.push(oChats[i]);
		}
		//console.dir(ret);
		makePage(aRet)
		/**/
	});
	//return {a: aRet, o: oRet};
}
function makePage(aContent){
	var d=new Date();
	var sDate = d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear() + " " + d.getHours() + ":" + d.getMinutes();
	var sNum = "<p class='noRedString'><small> Всего найдено чатов: " + aContent.length + " | Обновлено "+sDate+"</small></p>";
	//console.log(sNum);
	var aList = aContent.map(function(el){
		return "<p class='noRedString'>"+el+"</p>";
	});
	var sImg = '<img src="_img/telegram_300.jpg" srcset="_img/telegram_500.jpg 500w, _img/telegram_800.jpg 800w" style="width: 100%" alt="">';
	var aImg = [
		"_img/telegram_800.jpg",
		"_img/telegram_500.jpg",
		"_img/telegram_300.jpg"
	];
	var sTitle = "Каналы и чаты телеграма, где есть ролевики";
	var sContent = "<h1>"+sTitle+"</h1><p class='noRedString'>"+sImg+"</p>"+sNum+aList.join("<hr>");
	var sDescription = "Список каналов и чатов телеграма ролевой направленности";
	let sPage = createPage(sTemplate, sContent, {sDescription: sDescription, sTitle: sTitle, oImage: aImg});
	savePage(sPage, "../../telegram.html");
}
function getTelegramChats(){
	console.log("\nStart Telegram grabber");
	var spawn = require("child_process").spawn;
	var pythonProcess = spawn('python',["../python/telegram.py"]);
	
	pythonProcess.stdout.on('data', function (data){
		//console.log(data.toString());
		console.log("Python finished");
		/**/
		//var aList = parceTeleFile(readTeleFile()).map(function(el) {return "<p class='noRedString'>"+el+"</p>"});
		var oChats = parceTeleFile(readTeleFile());
		//console.dir(oChats.o);
		/*/
		var aList = [];
		for (var i in oChats.o) {
			// console.log(oChats.o);
			// console.log(oChats.o.i);
			// console.log();
			aList.push("<p class='noRedString'>"+oChats.o[i]+"</p>");
		}
		var aList = aList.concat(oChats.a.map(function(el) {return "<p class='noRedString'>"+el+"</p>"}));
		var sImg = '<img src="_img/telegram_300.jpg" srcset="_img/telegram_500.jpg 500w, _img/telegram_800.jpg 800w" style="width: 100%" alt="">';
		var aImg = [
			"_img/telegram_800.jpg",
			"_img/telegram_500.jpg",
			"_img/telegram_300.jpg"
		];
		var sTitle = "Каналы и чаты телеграма, где есть ролевики";
		var sContent = "<h1>"+sTitle+"</h1><p class='noRedString'>"+sImg+"</p>"+aList.join("<hr>");
		var sDescription = "Список каналов и чатов телеграма ролевой направленности";
		let sPage = createPage(sTemplate, sContent, {sDescription: sDescription, sTitle: sTitle, oImage: aImg});
		savePage(sPage, "../../telegram.html");
		/**/
		return false;
	});
	
	pythonProcess.stderr.on('data', (data) => {
	  console.log(`stderr: ${data}`);
	});
	pythonProcess.on('close', (code) => {
	  console.log(`child process exited with code ${code}`);
	});
}
function createTelegramList(){
	process.on('unhandledRejection', error => {
		// Will print "unhandledRejection err is not defined"
		console.log('unhandledRejection', error.message);
	});
	getTelegramChats();
}


createTelegramList()
