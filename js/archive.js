$(window).load(function(){  

  /*
   * get hash 
   */
  function getHash(){
    $('html, body').animate({scrollTop:0}, 'fast');
    var sHash = window.location.hash.slice(1); // /archive#q=hashtag
    if(sHash && !/[^\w\d\/_=-]/.test(sHash)) {
      var sTags = sHash.match(/q=([\w\d]+)/);
      if(sTags[1]) {
        filterLists("#"+sTags[1]);
        showClerFilter();
      }
    } else {
      removeHash();
      hideClerFilter();
    }     
  }
  
  function removeHash() { 
    history.pushState("", document.title, window.location.pathname + window.location.search);
    return false;
  }
  function showClerFilter(){
    $("h1").each(function(){
      if($(this).find("a.clearFilter").length < 1) {
        $(this).append("<a href='/archive' class='clearFilter'>Очистить фильтр</a>")
      } else {
        $(this).find("a.clearFilter").show();
      }
    });
  }
  function hideClerFilter(){
    $("h1 a.clearFilter").hide();
  }
  
  function filterLists(sTag){
    if(sTag==''){
      $("#content li").show();
      return false;
    }
    $("#content li").each(function(li){
      var aTags = [];
      $(this).find('.taglist a').each(function(el){aTags.push($(this).text())});
      $(this).hide();
      if(aTags.indexOf(sTag)>-1) {
        $(this).show();
      }
    });
  }
   
  $(".clearFilter").live('click', function(){
    removeHash();
    filterLists("");
    hideClerFilter();
    return false;
  });
  $(".tag").live('click', function(){
    var sURL = window.location.href; // "https://tentaculus.ru/archive/#q=DnD
    var sHash =  /#([\w\d_=,&-]+)/.exec($(this).attr('href'))[1];
    if(!/\/archive\/[\w\d_]+/.testsURL) {
      var sTag = $(this).text();

      //filterLists(sTag);
      //showClerFilter();
      window.location.hash = sHash;
      return false;
    }
  });
  
  window.onhashchange = getHash;
  getHash();
});