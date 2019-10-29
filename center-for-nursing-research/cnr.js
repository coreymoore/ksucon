jQuery(document).ready(function($){
    if($('body').hasClass('page-node-788156')){
      $('.body .pane-node article.node-page').each(function(){
       $(this).find('.media-p').detach().prependTo(this).addClass('image-left');
       $(this).find('.field-name-field-basic-page-sub-title').detach().insertAfter($(this).parents('.pane-node').find('h2.pane-title')).addClass('researcher-title');
     });
    }
    if($('body').hasClass('node-type-academic-group-par')){
      $('.article-copy a').each(function(){
        $(this).attr('href', '/node/788156');
      });
    }     
});