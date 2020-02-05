jQuery(document).ready(function ($) {
    /** 
      * Create wrapped sections from section header.
      * We must do this with JavaScript
      * because the page is constructed with
      * a bunch of nested panel panes
    */
    // Remove the panel-seperator divs
    $('.panel-separator').remove();
    // Define the parent pane based on if the user is logged in (to account for page structural differences with Panels in Place editor)
    if ($('body').hasClass('logged-in')) {
        var pane = $('.body .panels-ipe-portlet-wrapper');
    } else {
        var pane = $('.body .panel-pane');
    }
    // Loop through each pane
    pane.each(function () {
        // Identify if the pane includes a section header (title)
        if ($(this).has('.h2-section-header').length) {
            // If it does, get the ID of the section header (title)
            var sectionId = $(this).find('.h2-section-header').attr('id');
            // Wrap the title pane and every subsequent pane (until the next title pane) in a single section with the ID of the title. This allows for the navigation to identify where the user is on the page
            $($(this).nextUntil(pane.has('.h2-section-header')).addBack()).wrapAll('<section class="page-section" id="' + sectionId + '"></section>');
        }
    });
    // Remove the ID attribute from the section headers, as those have been moved to the corresponding page sections
    $('.body .h2-section-header').removeAttr('id');
    // Loop through each section
    $('.body section').each(function (i, v) {
        // Some nested elements (such as accordions) are wrapped in sections during the previous loop but should not be. This line unwraps those sections
        $(this).find('section:not(:eq(0))').unwrap();
        // Add a horizontal rule to the end of each section EXCEPT the last section
        if (i != $('.body section').length - 1) {
            $(this).append('<hr>');
        }
    });

    /** 
      * Create a sticky navigation and sticky RFI form
    */
    var sideNav = $('.side-navigation');
    // Make an empty placeholder for the navigation for when it moves to the top of the page so the other sidebar content does not shift up
    var navPlaceholder = document.createElement('div');
    navPlaceholder.setAttribute('id', 'nav-placeholder');
    navPlaceholder.setAttribute('aria-hidden', 'true');
    // Create an empty array to store the page navigation links
    var navLinksArr = [];
    // Get the RFI form
    var rfi = $('#node-656226');
    // Make an empty placeholder for the RFI
    var rfiPlaceholder = document.createElement('div');
    rfiPlaceholder.setAttribute('id', 'rfi-placeholder');
    rfiPlaceholder.setAttribute('aria-hidden', 'true');

    $.fn.getNavLinkAttrs = function () {
        // The navLinks are each "a" element in the navbar-nav element
        var navLinks = $('.navbar-nav a');
        // Loop through each of these links
        navLinks.each(function () {
            // Get the hash from the link
            var linkHash = $(this).attr('href');
            // Get the left offset position of the link
            var leftPos = $(this).offset().left;
            // Push these into the navLinksArr
            navLinksArr.push({
                'hash': linkHash,
                'left': leftPos,
            });
        });
        return this;
    }
    // Identify if the user is browsing on a mobile (non-tablet) device
    var mobile = window.matchMedia("only screen and (max-width: 40em)").matches;
    // If they are on a mobile device
    if (mobile) {
        // Wrap the CTA buttons in mobile-navs div
        $('#cta-buttons').wrapAll('<div id="mobile-navs"></div>');
        // Add the mobile class to the side navigation
        sideNav.addClass('mobile');
        // Temporarily add the sticky class to get the sticky link attributes with the getNavLinkAttrs function
        sideNav.addClass('sticky').promise().done(function () {
            sideNav.getNavLinkAttrs().promise().done(function () {
                // Then remove the sticky class.
                sideNav.removeClass('sticky').promise().done(function () {
                    sideNav.detach().prependTo('#mobile-navs').promise().done(function () {
                        $('#cta-buttons').css('display', 'block');
                    });
                });
            });
        });
        // If they are not on a mobile device
    } else {
        // Add the non-mobile class
        sideNav.addClass('non-mobile');
    }

    // Initialize variables
    var sections = $('.page-section');
    var rfiHeight;
    var sidenavHeight;
    var hheight;
    var sidebar = $('.sidebar');
    var sidebarWidth;
    var footer = $('#bottom-cta');
    var bodyDiv = $('.body');
    var navbarWidth;
    var navbarNav = $('.navbar-nav');
    var isNavPlaceholder = false;
    var isRfiPlaceholder = false;
    var rfiIsAttchBody = false;
    var rfiIsAttchSidebar = true;
    var topOfFooter;
    // Use optimized scroll tracking technique so the page is not bogged down
    // Reference: http://www.html5rocks.com/en/tutorials/speed/animations/
    // https://developer.mozilla.org/en-US/docs/Web/Events/scroll
    let last_known_scroll_position = 0;
    let ticking = false;

    // Cast static variables calculating the width and height of elements - called on window.load and window.resize
    function createStaticCalcs() {
        footerOffsetTop = footer.offset().top;
        topOfFooter = footerOffsetTop - footer.outerHeight() - 50;
        sidebarWidth = sidebar.width();
        rfiHeight = $(rfi).height();
        bodyColHeight = $('.columns .body').innerHeight();
        // Get the height of the side-navigation div
        sidenavHeight = $('.side-navigation').height();
        // Get the outer height of the page header
        hheight = $('header.l-header').outerHeight();
        navbarWidth = navbarNav.width();
        sections.each(function () {
            this.top = $(this).offset().top - hheight;
            this.bottom = $(this).outerHeight(true) + this.top;
        });
        return;
    }
    window.addEventListener('load', (event) => {
        createStaticCalcs();
    });
    window.addEventListener('resize', (event) => {
        createStaticCalcs();
    });
    $('dd.accordion-navigation a').on('click', function () {
        if ($(this).attr('aria-expanded') == 'false') {
            setTimeout(function () {
                createStaticCalcs();
            }, 100);
        }
    });

    // Scroll functionailty on desktop and tablet devices
    function desktopScroll(scroll_pos) {
        // Always make sure that the body has a zero margin top (overriding the KSU sticky header code)
        $('body').css('margin-top', '0px');
        // Once the side navigation is outside of the viewport
        if (!$('.side-navigation.unsticky').is(':in-viewport')) {
            // Move the navigation to the top of the page and make it sticky
            sideNav.removeClass('unsticky').addClass('sticky').addClass('animated').addClass('slideInDown').css('top', '0');
            // Also, prepend the navPlaceholder to the sidebar and set it to the same height as the side navigation was in its original position
            if (isNavPlaceholder === false) {
                sidebar.prepend(navPlaceholder);
                $('#nav-placeholder').css('height', sidenavHeight);
                isNavPlaceholder = true;
            }
        }
        // If the user has scrolled to where the side navigation was located 
        if ($('#nav-placeholder').is(':in-viewport')) {
            // Move the navigation back to the side of the page
            sideNav.removeClass('sticky').addClass('unsticky').removeClass('slideInDown');
            // Remove the navigation placeholder
            $('#nav-placeholder').remove();
            isNavPlaceholder = false;
        }
        // When the navigation is sticky
        if (sideNav.hasClass('sticky')) {
            // Do some calculations for each page section
            sections.each(function () {
                // Once the user has scrolled to a new section
                if ((scroll_pos >= this.top) && (scroll_pos <= this.bottom)) {
                    // Indicate the new section in the sticky navigation
                    var activeElement = $('.side-navigation li a[href~="#' + this.id + '"]');
                    // If the active element is not indicated as active in the navigation
                    if (!activeElement.hasClass('active')) {
                        activeElement.addClass('active');
                        // Add the section to the user's browser history
                        // Disabling this for now until reported accordion bug is fixed
                        //history.replaceState(null,null,'#' + this.id);   
                    }
                } else {
                    // Remove the indication from the sections that are no longer in the viewport
                    $('.side-navigation li a[href~="#' + this.id + '"]').not().removeClass('active');
                }
            });
        }

        // Once the sidebar is outside of the viewport
        if (!$('.sidebar').is(':in-viewport')) {
            if (window.scrollY >= topOfFooter) {
                if (rfiIsAttchSidebar === true) {
                    repositionRFIForm();
                    rfiIsAttchBody = true;
                    rfiIsAttchSidebar = false;
                }
            } else {
                if (rfiIsAttchBody === true) {
                    repositionRFIForm();
                    rfiIsAttchBody = false;
                    rfiIsAttchSidebar = true;
                }

                rfi.removeClass('bottom-stick-rfi default-rfi').addClass('floating-rfi').css({
                    'width': sidebarWidth,
                    'left': ''
                });

                if (!rfi.hasClass('faded')) {
                    rfi.addClass('fadeIn');
                }
                // Also, prepend the rfiPlaceholder to the sidebar and set it to the same height as the RFI form was in its original position
                if (isRfiPlaceholder === false) {
                    $(rfiPlaceholder).insertAfter(sideNav.parents('.pane-node'));
                    $('#rfi-placeholder').css('height', rfiHeight);
                    isRfiPlaceholder = true;
                }
            }
        } else {
            rfi.removeClass('fadeIn faded bottom-stick-rfi floating-rfi').addClass('default-rfi').css('left', '');
            // Remove the RFI placeholder
            $('#rfi-placeholder').replaceWith(rfi);
            isRfiPlaceholder = false;
        }
        // Close RFI modal if it exits viewport
        if (!$('#rfiModal').is(':in-viewport')) {
            $('#rfiModal').foundation('reveal', 'close');
        }
    }

    // Floating RFI Fix for when FAQ accordions are clicked
    if(!mobile){
        $('#faq dd.accordion-navigation a').on('click', function () {
            if (rfiIsAttchSidebar === true) {
                repositionRFIForm();
                rfiIsAttchBody = true;
                rfiIsAttchSidebar = false;
            }
            if (rfiIsAttchBody === true) {
                repositionRFIForm();
                rfiIsAttchBody = false;
                rfiIsAttchSidebar = true;
            }
        });
    }    

    // This logic needs fixed later - the RFI form will float under the footer if the space between the top of the viewport and the footer is less than the height of the RFI form
    function repositionRFIForm() {
        if (rfiIsAttchSidebar === true) {
            rfi.removeClass('fadeIn floating-rfi default-rfi').addClass('bottom-stick-rfi faded').detach().appendTo('.body').css('left', -(bodyDiv.offset().left - sidebar.offset().left - 15));
        }
        if (rfiIsAttchBody === true) {
            rfi.detach().appendTo('.sidebar');
            // Make it sticky to the side of the page
            rfi.removeClass('bottom-stick-rfi default-rfi').addClass('floating-rfi').css({
                'width': sidebarWidth,
                'left': ''
            });
        }
    }

    // Scroll functionality for mobile devices
    function mobileScroll(scroll_pos) {
        // Once the page header is no longer in the viewport
        if (scroll_pos >= hheight) {
            // Make the navigation sticky
            sideNav.addClass('sticky').removeClass('unsticky').hideMobileAffordance();
        } else {
            // Make it unsticky when the header is in the viewport
            sideNav.removeClass('sticky').addClass('unsticky');
        }
        // When the navigation is sticky
        if (sideNav.hasClass('sticky')) {
            // Do some calculations for each page section
            sections.each(function () {
                // Once the user has scrolled to a new section
                if ((scroll_pos >= this.top) && (scroll_pos <= this.bottom)) {
                    // Get the active element from the navigation (indicates which section the user is on)
                    var activeElement = $('.side-navigation li a[href~="#' + this.id + '"]');
                    // If the active element is not indicated as active in the navigation
                    if (!activeElement.hasClass('active')) {
                        // Indicate it as such
                        activeElement.addClass('active');
                        // Generate the link hash from the current page section
                        var hash = '#' + this.id;
                        // Let the leftOffset be the offset of the navigation link that corresponds to the active page section
                        let leftOffset = navLinksArr.find(ele => ele.hash === hash).left;
                        let linkWidth = $(activeElement).width();
                        // Scroll the navigation bar left in the number of pixels of the offeset set above                        
                        if (linkWidth + leftOffset > navbarWidth) {
                            // Animate the scroll
                            navbarNav.animate({ scrollLeft: '+=' + leftOffset + linkWidth });
                        } else {
                            navbarNav.animate({ scrollLeft: '-=' + leftOffset + linkWidth });
                        }
                        // Add the section to the user's browser history
                        // Disabling this for now until reported accordion bug is fixed
                        //history.replaceState(null,null,'#' + this.id);
                    }
                } else {
                    // Remove the indication from the sections that are no longer in the viewport
                    $('.side-navigation li a[href~="#' + this.id + '"]').not().removeClass('active');
                }
            });
        }
    }

    $.fn.hideMobileAffordance = function () {
        // Fade out the mobile affordance (the animated icon on the right side) after 5 seconds
        $('.m-affordance').fadeOut(5000);
        return this;
    };
    // If the user is on a desktop/tablet
    if (!mobile) {
        // Don't display the mobile affordance
        $('.m-affordance').css('display', 'none');
        // Add a scroll event listener and call the desktopScroll function on scroll
        window.addEventListener('scroll', function () {
            last_known_scroll_position = window.scrollY;
            if (!ticking) {
                window.requestAnimationFrame(function () {
                    desktopScroll(last_known_scroll_position);
                    ticking = false;
                });
                ticking = true;
            }
        });
    }
    // If the user is on a mobile device
    if (mobile) {
        // Add a scroll event listener and call the mobileScroll function on scroll
        window.addEventListener('scroll', function () {
            last_known_scroll_position = window.scrollY;
            if (!ticking) {
                window.requestAnimationFrame(function () {
                    mobileScroll(last_known_scroll_position);
                    ticking = false;
                });
                ticking = true;
            }
        });
    }
    // Smooth scroll to the page sections when the navigation links are clicked
    $('.side-navigation a').not('.apply-now').on("click", function (e) {
        e.preventDefault();
        // Get the active section
        var activeSection = $(this).attr('href');
        activeSection = $(activeSection);
        // If the navigation is sticky
        if (sideNav.hasClass("sticky")) {
            $('html, body').animate({
                scrollTop: activeSection.offset().top - 80
            }, 750);
            // If the navigation is not sticky (mobile)
        } else if (sideNav.hasClass("mobile") && sideNav.hasClass("unsticky")) {
            $('html, body').animate({
                scrollTop: activeSection.offset().top - 60
            }, 750);
            // If the navigation is not sticky
        } else {
            $('html, body').animate({
                scrollTop: activeSection.offset().top - 60
            }, 750);
        }
    });

    /**
     * Change all uppercase instances of Ph.D. in headers to capital case
     */
    $(':header').each(function () {
        $(this).html($(this).html().replace(/(Ph.D.)/g, '<span style="text-transform: capitalize;">$1</span>'));
    });

    /**
     * Request Information modal
     */
    // Create modal div, but do not display it
    if (!mobile) {
        var modalBody = '<div class="reveal-modal tiny" data-reveal="" id="rfiModal" role="dialog" aria-modal="true" tabindex="-1" style="display: none;"><div id="rfiModalInner"></div></div>';
        $('body').append(modalBody);
        var dialogOpen = false;

        // When the RFI button is clicked
        $('.rfi-button').click(function (e) {
            e.preventDefault();
            if (dialogOpen == false) {
                dialogOpen = true;
                $('#node-656226').removeClass('floating-rfi bottom-stick-rfi').addClass('default-rfi').css({
                    'left': '',
                });
                $('#rfiModalInner').html(rfi).prepend('<a aria-label="Close" class="close-reveal-modal" role="button" tabindex="0">×</a>');
                $("#rfiModal").attr('triggerSrc', this.id).foundation('reveal', 'open').focus();
            }
        });
        $('body').on('keypress', '.close-reveal-modal', function(e) {
              if (e.which === 13 || e.keyCode === 13 || e.key === "Enter") {
                $("#rfiModal").foundation('reveal', 'close');
              }
        });
        $(document).on('open.fndtn.', '[data-reveal]', function (e) {
            $('#nursing_degree_types-e685c9ec-783b-4047-90cd-5543fdfeafc8').focus();
        });
        $(document).on('opened.fndtn.', '[data-reveal]', function () {
            $('#nursing_degree_types-e685c9ec-783b-4047-90cd-5543fdfeafc8').focus();
        });
        $(document).on('close.fndtn.', '[data-reveal]', function () {
            $(rfi).detach().insertAfter($('.side-navigation').parents('.pane-node'));
            $('#rfiModalInner').html("");
            dialogOpen = false;
        });
        $(document).on('closed.fndtn.', '[data-reveal]', function () {
            var triggerSrc = '#' + $('#rfiModal').attr('triggerSrc');
            $(triggerSrc).focus();
            $('#rfiModal').attr('triggerSrc', '');
            dialogOpen = false;
        });
        document.addEventListener("focus", function (event) {
            var dialog = document.getElementById("rfiModal");
            if (dialogOpen && !dialog.contains(event.target)) {
                event.stopPropagation();
                dialog.focus();
            }
        }, true);
    }
});