'use strict';
jQuery(document).ready(function($) {
    var $grid = $('#grid').masonry({
        columnWidth: '.grid-sizer',
        itemSelector : '.grid-item',
        percentPosition: true,
        gutter: 30
    });

    $grid.on('layoutComplete',
    Foundation.utils.debounce(function() {
        $('.spinner').fadeOut().css('position', 'fixed');
        $.each($('.grid-item'), function(){
            if(!$(this).hasClass('faded')){
                $(this).addClass('faded').css({visibility:"visible", opacity: 0.0}).animate({opacity: 1.0},500);
            }
        });
    }, 500));

    var contents = [];
    var articles = [];
    var events = [];
    var blogs = [];
    var tweets = [];
    var instas = [];
    var ajaxTries = 3;
    // Articles
    $('.featured-story').not('.slick-cloned').each(function(i){
        if(i === 0){
            var firstBool = true; 
        } else {
            var firstBool = false;
        }
        var data = {
            'type': 'article',
            'id': $(this).find('h3').parent('a').attr('href'),
            'title': $(this).find('h3').text().trim(),
            'description': $(this).find('.field-type-text-with-summary').text(),
            'image': $(this).find('.article-photo img').attr('src'),
            'image_alt': $(this).find('.article-photo img').attr('alt'),
            'first': firstBool
        }
        articles.push(data);       
    }).end();

    // Events
   $('.view-display-id-promoted_events .views-row').each(function(){
        var data = {
            'type': 'event',
            'content': this
        }
        events.push(data);
   });

        var requests = [
           $.ajax('https://nursing.kent.edu/nursingkentedu/frontcontent.rss', { accepts: { xml: 'application/rss+xml'}, dataType: 'xml', success:function(data) { addToContents(data); }, error:function() { if (ajaxTries > 0) {$.ajax(this); ajaxTries--;}}})
        ];

        var doRequests = function(){
            $.when.apply($,requests).done(function(){
                // Construct events 
                var eventsBlock = constructEventsBlock(events);
                // Reduce the number of items in tweets and instas arrays to 10
                tweets.length = 10;
                instas.length = 10;
    
                // Order contents
                contents = [articles, tweets, blogs, instas].reduce(function(r, a) {
                    return (a.forEach(function(a, i) {
                        return (r[i] = r[i] || []).push(a);
                    }), r);
                }, []).reduce(function(a, b) {
                    return a.concat(b);
                });
    
                eventsBlock = {
                    'type': 'eventsBlock',
                    'content': eventsBlock
                }
                
                // Make events block the second item in contents
                contents.splice(1, 0, eventsBlock);
    
                // Render the first 9 items
                renderLoop(9);
                // Null the arrays to reduce memory leaks
                articles = null;
                tweets = null;
                blogs = null;
                instas = null;
                events = null;  
                // Remove the slideshow and events blocks to eliminate confusion for screen reader users
                $('.paragraphs-item-100-promoted-content').remove();
                $('.feature-stories-container').remove();
                // Add featured-item class to first grid item
                $('.grid-item:first').addClass('featured-item');
                $grid.imagesLoaded().progress( function() {
                    $grid.masonry('layout');
                    
                });
            }).fail(function(request){
                // If the request fails, just skip it - 
                requests.splice(requests.indexOf(request), 1);
                doRequests();
            });
        }
        doRequests();        
    
    function constructEventsBlock(events){
        var eventsBlock = '<div class="grid-item events-block"><h3 class="h2-section-header">Upcoming Events</h3><div class="view-display-id-promoted_events"><div class="view-content">';
        $(events).each(function(){
            eventsBlock += '<div class="views-row">' + this.content.innerHTML + '</div>'
        });
        eventsBlock += '</div><div class="more-events-link"><a href="/nursing/events">View more events »</a></div></div>';
        return eventsBlock;
    }

    function addToContents(data){
            $(data).find("item").each(function () { 
                var fsource = $(this).find('category').text().toLowerCase();
                var id = $(this).find('link').text();
                var pubDate = new Date($(this).find("pubDate").text()).getTime();
                switch(fsource){
                    case "blog":
                        blogs.push({
                            'type': fsource,
                            'id': id,
                            'title': $(this).find('title').text(),
                            'author': $(this).find('author').text(),
                            'pubDate': pubDate,
                            'description': $(this).find('description').text().split('[...]')[0],
                            'image': $(this).find('enclosure').attr('url'),
                            'image_alt': $(this).find('enclosure').attr('alt'),
                        });
                        break;
                    case "twitter":
                        if(!$(this).find("description").text().includes('RT @')){
                            tweets.push({
                                'type': fsource,
                                'id': id,
                                'pubDate': pubDate,
                                'description': $(this).find('description').text()
                            });
                        }
                        break;                     
                    case "instagram":
                        instas.push({
                            'type': fsource,
                            'id': id,
                            'pubDate': pubDate,
                            'description': $(this).find('description').text(),
                            'image': $(this).find('enclosure').attr('url')
                        });
                };
            });
        return data;
    }

    function renderLoop(items){
        $.each(contents, function(i, content){
                if(i <= items){
                    switch(content.type){
                        case "twitter":
                        case "instagram":
                            renderSocial(content);
                            break;
                        case "blog":
                            renderBlog(content);
                            break;
                        case "article":
                            renderArticle(content);
                            break;
                        case "eventsBlock":
                            var $eventsBlock = $ ( content.content );
                            $grid.append($eventsBlock).masonry('appended', $eventsBlock);
                            break;
                        default:
                            break;
                    }
                }                        
            });
            contents.splice(0, items + 1);
            
        return;
    }

    function renderSocial(content){
        if(content.type === "instagram" && content.image === undefined){
            return;
        }
        var convPubDate = new Date(content.pubDate).toLocaleDateString("en-US");
        var postText = content.description;
        // Remove link to tweet without removing any CTA links/remove any bit.ly link in Insta post
        var postLinks = postText.match(/(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi);
        if(postLinks != null){
            var lastLink = postLinks[postLinks.length-1];
            postText = postText.replace(lastLink, "");
            postLinks.splice(2, 1);
        }       
        if(postLinks && postLinks.length > 0){
            // Generate links for remainding URLs
            postLinks.forEach(function(ele){
                postText = postText.replace(ele, '<a href="' + ele + '" target="_blank">' + ele + '</a>');
            });
        }
        // Add links to hashtags
        var hashtags = postText.match(/\B(\#[a-zA-Z0-9]+\b)/g);
        if(hashtags){
                hashtags.forEach(function(ele){
                    if(content.type === "twitter"){
                        postText = postText.replace(ele, '<a href="https://twitter.com/hashtag/' + ele.replace("#", "") + '?src=hash" target="_blank">' + ele + '</a>');
                    }
                    if(content.type === "instagram"){
                        postText = postText.replace(ele, '<a href="https://www.instagram.com/explore/tags/' + ele.replace("#", "") + '" target="_blank">' + ele + '</a>');
                    }
                });
            }
        // Add links to Twitter usernames
        var atMes = postText.match(/\B(\@[a-zA-Z0-9]+\b)/g);
        if(atMes){
            atMes.forEach(function(ele){
                postText = postText.replace(ele, '<a href="https://' + content.type + '.com/' + ele.replace("@", "") + '" target="_blank">' + ele + '</a>');
            });
        }
        if(content.image){
            var socialPost = '<div class="grid-item social-post ' + content.type +'-post"><div class="grid-item-inner"><div class="social-image"><a href="' + content.id + '" target="_blank"><img src="' + content.image + '" alt="' + content.description + '"></a></div><h3 class="social-header" aria-label="Kent State Nursing ' + content.type + ' post"><span aria-hidden="true"><i class="fab fa-' + content.type + '" aria-hidden="true"></i> <strong>Kent State Nursing</strong> <br/><a href="https://' + content.type + '.com/kentnursing" target="_blank">@kentnursing</a></span></h3><div class="social-text">' + postText + '</div><div class="post-date" aria-label="Posted on ">' + convPubDate + '</div></div></div>';
        } else {
            var socialPost = '<div class="grid-item social-post ' + content.type +'-post"><div class="grid-item-inner"><h3 class="social-header" aria-label="Kent State Nursing ' + content.type + ' post"><span aria-hidden="true"><i class="fab fa-' + content.type + '" aria-hidden="true"></i> <strong>Kent State Nursing</strong> <br/><a href="https://' + content.type + '.com/kentnursing" target="_blank">@kentnursing</a></span></h3><div class="social-text">' + postText + '</div><div class="post-date" aria-label="Posted on">' + convPubDate + '</div></div></div>';
        }
        
        var $socialPost = $ ( socialPost );
        $grid.append($socialPost).masonry('appended', $socialPost);
    }

    function renderArticle(content){
        if(content.image_alt){
            if(content.first === true){
                var html = '<div class="grid-item ' + content.type + '-item"><div class="grid-item-inner"><div class="grid-item-image large-5 medium-4 small-12 columns"><a href="' + content.id + '"><img src="' + content.image + '" alt="' + content.image_alt + '"></img></a></div><div class="grid-item-copy large-7 medium-8 small-12 columns"><h3><a href="' + content.id + '">' + content.title + '</a></h3><p>' + content.description + '</p><div><a class="button text-button" href="' + content.id + '" aria-label="Read more: ' + content.title + '" data-name="' + content.title + '">Read More</a></div></div></div></div>';
            } else {
                var html = '<div class="grid-item ' + content.type + '-item"><div class="grid-item-inner"><div class="grid-item-image"><a href="' + content.id + '"><img src="' + content.image + '" alt="' + content.image_alt + '"></img></a></div><div class="grid-item-copy"><h3><a href="' + content.id + '">' + content.title + '</a></h3><div><a class="button text-button" href="' + content.id + '" aria-label="Read more: ' + content.title + '" data-name="' + content.title + '">Read More</a></div></div></div></div>';
            }            
        } else {
            var html = '<div class="grid-item ' + content.type + '-item"><div class="grid-item-inner"><h3><a href="' + content.id + '">' + content.title + '</a></h3><p>' + content.description + '</p><div><a class="button text-button" href="' + content.id + '" aria-label="Read more: ' + content.title + '" data-name="' + content.title + '">Read More</a></div></div></div>';
        }
        var $html = $( html );
        $grid.append($html).masonry('appended', $html);
    }

    function renderBlog(content){
        var convPubDate = new Date(content.pubDate).toLocaleDateString("en-US");

        if(content.image){
            var html = '<div class="grid-item ' + content.type + '-item"><div class="grid-item-inner"><div class="grid-item-image"><a href="' + content.id + '"><img src="' + content.image + '" alt="' + content.image_alt + '"></img></a></div><div class="grid-item-copy"><h3><a href="' + content.id + '">' + content.title + '</a></h3><p class="byline">' + convPubDate + ' | ' + content.author + '</p><p>' + content.description + '&#8230;</p><div><a class="button text-button" href="' + content.id + '" aria-label="Read more: ' + content.title + '" data-name="' + content.title + '">Read More</a></div></div></div></div>';
        } else {
            var html = '<div class="grid-item ' + content.type + '-item"><div class="grid-item-inner"><h3><a href="' + content.id + '">' + content.title + '</a></h3><p class="byline">' + convPubDate + ' | ' + content.author + '</p><p>' + content.description + '&#8230;</p><div><a class="button text-button" href="' + content.id + '" aria-label="Read more: ' + content.title + '" data-name="' + content.title + '">Read More</a></div></div></div>';
        }

        var $html = $( html );
        $grid.append($html).masonry('appended', $html);
    }

    $('.load-more').on("click", function(e){
        e.preventDefault();
        $('.spinner').fadeIn();
        // Render the next 10 items
        renderLoop(10);
        $grid.imagesLoaded().progress( function() {
            $grid.masonry('layout');
            if(contents.length === 0){
                $('.load-more').fadeOut();
                $('.all-done').fadeIn();
            }
        });
    });
    // includes polyfill for IE
    if (!String.prototype.includes) {
        String.prototype.includes = function(search, start) {
          'use strict';
          if (typeof start !== 'number') {
            start = 0;
          }
      
          if (start + search.length > this.length) {
            return false;
          } else {
            return this.indexOf(search, start) !== -1;
          }
        };
      }
});