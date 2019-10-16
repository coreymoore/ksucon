jQuery(document).ready(function($){
    // temporarily hide the utility bar for development
    $('#block-kent-state-og-user-utility-bar').remove();
    $('body div[role="document"]').css('margin-top', '0');

    /** 
      * Create wrapped sections from section header.
      * We must do this with JavaScript
      * because the page is constructed with
      * a bunch of nested panel panes
    */
    // Remove the panel-seperator divs
    $('.panel-separator').remove();
    // Define the parent pane based on if the user is logged in (to account for page structural differences with Panels in Place editor)
    if($('body').hasClass('logged-in')){
        var pane = '.body .panels-ipe-portlet-wrapper';
    } else {
        var pane = '.body .panel-pane';
    }
    // Loop through each pane
    $(pane).each(function(){
        // Identify if the pane includes a section header (title)
        if($(this).has('.h2-section-header').length){
            // If it does, get the ID of the section header (title)
            var sectionId = $(this).find('.h2-section-header').attr('id');
            // Wrap the title pane and every subsequent pane (until the next title pane) in a single section with the ID of the title. This allows for the navigation to identify where the user is on the page
            $($(this).nextUntil($(pane).has('.h2-section-header')).addBack()).wrapAll('<section class="page-section" id="' + sectionId + '"></section>');
        }
    });
    // Remove the ID attribute from the section headers, as those have been moved to the corresponding page sections
    $('.body .h2-section-header').removeAttr('id');
    // Loop through each section
    $('.body section').each(function(i,v){
        // Some nested elements (such as accordions) are wrapped in sections during the previous loop but should not be. This line unwraps those sections
        $(this).find('section:not(:eq(0))').unwrap();
        // Add a horizontal rule to the end of each section EXCEPT the last section
        if(i != $('.body section').length - 1){
            $(this).append('<hr>');
        }
    });

    /** 
      * Create a sticky navigation and sticky RFI form
    */
    var sideNav = $('.side-navigation');
    // Make an empty placeholder for the navigation for when it moves to the top of the page so the other sidebar content does not shift up
    $navPlaceholder = '<div id="nav-placeholder" aria-hidden="true"></div>';
    // Get the height of the side-navigation div
    $sidenavHeight = $('.side-navigation').height();
    // Get the outer height of the page header
    var hheight = $('header.l-header').outerHeight();
    // Create an empty array to store the page navigation links
    var navLinksArr = [];
    
    // Get the RFI form
    var rfi = $('#node-656226');
    // Make an empty placeholder for the RFI
    $rfiPlaceholder = '<div id="rfi-placeholder" aria-hidden="true"></div>';
    $rfiHeight = ''; 
    $bodyColHeight = '';
    $(window).load(function() {
        // Get the height of the RFI form div
        $rfiHeight = $(rfi).height();
        // Get the height of the .body column
        $bodyColHeight = $('.columns .body').innerHeight();
    });

    $.fn.getNavLinkAttrs = function () {
        // The navLinks are each "a" element in the navbar-nav element
        $navLinks = $('.navbar-nav a');
        // Loop through each of these links
        $navLinks.each(function() {
            // Get the hash from the link
            $linkHash = $(this).attr('href');
            // Get the left offset position of the link
            $leftPos = $(this).offset().left;
            // Push these into the navLinksArr
            navLinksArr.push({
                'hash': $linkHash,
                'left': $leftPos,
            });
        });
        return this;
    }
    // Identify if the user is browsing on a mobile (non-tablet) device
    $mobile = window.matchMedia("only screen and (max-width: 40em)").matches;
    // If they are on a mobile device
    if($mobile){
        // Wrap the CTA buttons in mobile-navs div
        $('#cta-buttons').wrapAll('<div id="mobile-navs"></div>');
        // Add the mobile class to the side navigation
        $(sideNav).addClass('mobile');
        // Temporarily add the sticky class to get the sticky link attributes with the getNavLinkAttrs function
        $(sideNav).addClass('sticky').promise().done(function(){
            $(sideNav).getNavLinkAttrs().promise().done(function() {
                // Then remove the sticky class.
                $(sideNav).removeClass('sticky').promise().done(function(){
                    $('.side-navigation').detach().prependTo('#mobile-navs').promise().done(function(){
                        // Load the YouTube video near the end to speed up initial load
                        $('#introvideo').attr('src', 'https://www.youtube.com/embed/2Gj6dy4KCDc');
                    });
                });
            });
        });
    // If they are not on a mobile device
    } else {
        // Add the non-mobile class
        $('.side-navigation').addClass('non-mobile');
        $('#introvideo').attr('src', 'https://www.youtube.com/embed/2Gj6dy4KCDc');
    }
    
    // Use optimized scroll tracking technique so the page is not bogged down
    // Reference: http://www.html5rocks.com/en/tutorials/speed/animations/
    // https://developer.mozilla.org/en-US/docs/Web/Events/scroll
    let last_known_scroll_position = 0;
    let ticking = false;
    $sections = $('.page-section');
    $sections.each(function() {
        $top = $(this).offset().top - hheight;
        $bottom = $(this).outerHeight(true) + $top;
    });
    // Scroll functionailty on desktop and tablet devices
    function desktopScroll(scroll_pos) {
        // Once the side navigation is outside of the viewport
        if(!$('.side-navigation.unsticky').is(':in-viewport')){
            // Move the navigation to the top of the page and make it sticky
            $('.side-navigation').removeClass('unsticky').addClass('sticky').addClass('animated').addClass('slideInDown').css('top', '0');
            // Also, prepend the navPlaceholder to the sidebar and set it to the same height as the side navigation was in its original position
            if($('#nav-placeholder').height() != $sidenavHeight){
                $('.sidebar').prepend($navPlaceholder)
                $('#nav-placeholder').css('height', $sidenavHeight);
            }
        }
        // If the user has scrolled to where the side navigation was located 
        if($('#nav-placeholder').is(':in-viewport')){
            // Move the navigation back to the side of the page
            $('.side-navigation').removeClass('sticky').addClass('unsticky').removeClass('slideInDown');
            // Remove the navigation placeholder
            $('#nav-placeholder').remove();
        }
        // When the navigation is sticky
        if($('.side-navigation').hasClass('sticky')){
            // Do some calculations for each page section
            $sections.each(function() {
                // Get the top and bottom of the section
                $top = $(this).offset().top - (hheight - 50);
                $bottom = $(this).outerHeight(true) + $top + 20;
                // Once the user has scrolled to a new section
                if ((scroll_pos >= $top) && (scroll_pos <= $bottom)) {
                    // Indicate the new section in the sticky navigation
                    $('.side-navigation li a[href~="#' + this.id + '"]').addClass('active');
                    // Add the section to the user's browser history
                    history.replaceState(null,null,'#' + this.id);    
                } else {
                    // Remove the indication from the sections that are no longer in the viewport
                    $('.side-navigation li a[href~="#' + this.id + '"]').not().removeClass('active');
                }
            });
        }

        
        
        // Once the sidebar is outside of the viewport
        if(!$('.sidebar').is(':in-viewport')){
            if(window.scrollY - 100 > $bodyColHeight){
                $(rfi).css({
                    'position': 'absolute',
                    'top': 200 + $('.body').height() - $(rfi).height() - $('.sidebar').height()
                });
                console.log("Body:" + $('.body').height() + "\n RFI: " + $(rfi).height() + "\n Sidebar: " + $('.sidebar').height());
            } else {
                // Make it sticky to the side of the page
                $(rfi).css({
                    'animation-duration': '2s',
                    'position': 'fixed',
                    'top': '50px',
                    'width': $('.sidebar').width()
                }).addClass('fadeIn');
                // Also, prepend the rfiPlaceholder to the sidebar and set it to the same height as the RFI form was in its original position
                if($('#rfi-placeholder').height() != $rfiHeight){
                    $('.sidebar').prepend($rfiPlaceholder)
                    $('#rfi-placeholder').css('height', $rfiHeight);
                }
            }
        } else {
            $(rfi).css({
                'position': 'relative',
                'top': '0'
            }).removeClass('fadeIn');
            // Remove the RFI placeholder
            $('#rfi-placeholder').remove();
        }
        // Close RFI modal if it exits viewport
        if(!$('#rfiModal').is(':in-viewport')){
            $('#rfiModal').foundation('reveal', 'close');
        }
    }
    // Scroll functionality for mobile devices
    function mobileScroll(scroll_pos) {
        // Once the page header is no longer in the viewport
        if(scroll_pos >= hheight){
            // Make the navigation sticky
            $('.side-navigation').addClass('sticky').removeClass('unsticky').hideMobileAffordance();
        } else {
            // Make it unsticky when the header is in the viewport
            $('.side-navigation').removeClass('sticky').addClass('unsticky');
        }
        // When the navigation is sticky
        if($('.side-navigation').hasClass('sticky')){
            // Do some calculations for each page section
            $sections.each(function() {
                // Get the top and bottom of the section
                $top = $(this).offset().top - hheight;
                $bottom = $(this).outerHeight(true) + $top;
                // Once the user has scrolled to a new section
                if ((scroll_pos >= $top) && (scroll_pos <= $bottom)) {
                    // Get the active element from the navigation (indicates which section the user is on)
                    var activeElement = $('.side-navigation li a[href~="#' + this.id + '"]');
                    // If the active element is not indicated as active in the navigation
                    if(!$(activeElement).hasClass('active')){
                        // Indicate it as such
                        $('.side-navigation li a[href~="#' + this.id + '"]').addClass('active');
                        // Generate the link hash from the current page section
                        var hash = '#' + this.id;
                        // Let the leftOffset be the offset of the navigation link that corresponds to the active page section
                        let leftOffset = navLinksArr.find(ele => ele.hash === hash).left;
                        // Scroll the navigation bar left in the number of pixels of the offeset set above
                        $('.navbar-nav').scrollLeft(leftOffset - 100);
                        // Animate the scroll
                        $('.navbar-nav').animate( { scrollLeft: '+=' + leftOffset} );
                        // Add the section to the user's browser history
                        history.replaceState(null,null,'#' + this.id);
                    }
                } else {
                    // Remove the indication from the sections that are no longer in the viewport
                    $('.side-navigation li a[href~="#' + this.id + '"]').not().removeClass('active');
                }
            });
        }
    }

    $.fn.hideMobileAffordance = function(){
        // Fade out the mobile affordance (the animated icon on the right side) after 5 seconds
        $('.m-affordance').fadeOut(5000);
        return this;
    };
    // If the user is on a desktop/tablet
    if(!$mobile){
        // Don't display the mobile affordance
        $('.m-affordance').css('display', 'none');
        // Add a scroll event listener and call the desktopScroll function on scroll
        window.addEventListener('scroll', function(e) {
            last_known_scroll_position = window.scrollY;
            if (!ticking) {
                window.requestAnimationFrame(function() {
                desktopScroll(last_known_scroll_position);
                ticking = false;
                });
                ticking = true;
            }
        });
    }
    // If the user is on a mobile device
    if($mobile){
        // Add a scroll event listener and call the mobileScroll function on scroll
        window.addEventListener('scroll', function(e) {
            last_known_scroll_position = window.scrollY;
            if (!ticking) {
                window.requestAnimationFrame(function() {
                mobileScroll(last_known_scroll_position);
                ticking = false;
                });
                ticking = true;
            }
        });
    }
    // Smooth scroll to the page sections when the navigation links are clicked
    $('.side-navigation a').not('.apply-now').on("click", function(e){
        e.preventDefault();
        // Get the active section
        var activeSection = $(this).attr('href');
        activeSection = $( activeSection );
        // If the navigation is sticky
        if($(sideNav).hasClass("sticky")){
            $('html, body').animate({
                scrollTop: $(activeSection).offset().top - 80
            }, 750);
        // If the navigation is not sticky (mobile)
        } else if($(sideNav).hasClass("mobile") && $(sideNav).hasClass("unsticky")) {
            $('html, body').animate({
                scrollTop: $(activeSection).offset().top - 60
            }, 750);
        // If the navigation is not sticky
        } else {
            $('html, body').animate({
                scrollTop: $(activeSection).offset().top + 100
            }, 750);
        }
    });

    /**
     * Change all uppercase instances of Ph.D. in headers to capital case
     */
    $(':header').each(function(){
        $(this).html($(this).html().replace(/(Ph.D.)/g,'<span style="text-transform: capitalize;">$1</span>'));
    });

    /**
     * Request Information modal
     */
    // Create modal div, but do not display it
    var modalBody = '<div aria-labelledby="rfiModalInner" class="reveal-modal tiny" data-reveal="" id="rfiModal" role="article" tabindex="-1" style="display: none;"><div id="rfiModalInner"></div></div>';
    $('body').append(modalBody);
    var dialogOpen = false;

    // When the RFI button is clicked
    $('.rfi-button').click(function(e){
        e.preventDefault();
        if(dialogOpen == false){
            dialogOpen = true;
            $('#node-656226').css({
                'position': 'relative',
                'top': '0',
                'width': 'initial'
            });
            $('#rfiModalInner').html(rfi).prepend('<a aria-label="Close" class="close-reveal-modal" role="button" tabindex="0">×</a>');
            $("#rfiModal").foundation('reveal', 'open').focus();
        }
    });
    $(document).on('opened.fndtn.', '[data-reveal]', function () {
        $('#rfiModal').focus();
        $('#rfiModalInner .hs_nursing_degree_types').focus();
    });
    $(document).on('close.fndtn.', '[data-reveal]', function () {
        $(rfi).insertAfter($('.side-navigation').parents('.pane-node'));
        $('#rfiModalInner').html("");
        dialogOpen = false;
    });
    $("a.close-reveal-modal").keypress(function(e) {
        if(e.which == 13) {
            $("#rfiModal").foundation('reveal', 'close');    
        }
    });
    document.addEventListener("focus", function(event) {
        var dialog = document.getElementById("rfiModal");
        if (dialogOpen && !dialog.contains(event.target)) {
            event.stopPropagation();
            dialog.focus();
        }
    }, true);
    
 });
 