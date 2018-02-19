(function(window) {

	'use strict';

	var support = { transitions: Modernizr.csstransitions },
		// transition end event name
		transEndEventNames = { 'WebkitTransition': 'webkitTransitionEnd', 'MozTransition': 'transitionend', 'OTransition': 'oTransitionEnd', 'msTransition': 'MSTransitionEnd', 'transition': 'transitionend' },
		transEndEventName = transEndEventNames[ Modernizr.prefixed( 'transition' ) ],
		onEndTransition = function( el, callback ) {
			var onEndCallbackFn = function( ev ) {
				if( support.transitions ) {
					if( ev.target != this ) return;
					this.removeEventListener( transEndEventName, onEndCallbackFn );
				}
				if( callback && typeof callback === 'function' ) { callback.call(this); }
			};
			if( support.transitions ) {
				el.addEventListener( transEndEventName, onEndCallbackFn );
			}
			else {
				onEndCallbackFn();
			}
		},
		// the pages wrapper
		stack = document.querySelector('.pages-stack'),
		// the page elements
		pages = [].slice.call(stack.children),
		// total number of page elements
		pagesTotal = pages.length,
		// index of current page
		current = 0,
		// menu button
		menuCtrl = document.querySelector('button.menu-button'),
		// the navigation wrapper
		nav = document.querySelector('.pages-nav'),
		// the menu nav items
		navItems = [].slice.call(nav.querySelectorAll('.link--page')),
		// check if menu is open
		isMenuOpen = false;

	function init() {
		buildStack();
		initEvents();
	}

	function buildStack() {
		var stackPagesIdxs = getStackPagesIdxs();

		// set z-index, opacity, initial transforms to pages and add class page--inactive to all except the current one
		for(var i = 0; i < pagesTotal; ++i) {
			var page = pages[i],
				posIdx = stackPagesIdxs.indexOf(i);

			if( current !== i ) {
				classie.add(page, 'page--inactive');

				if( posIdx !== -1 ) {
					// visible pages in the stack
					page.style.WebkitTransform = 'translate3d(0,100%,0)';
					page.style.transform = 'translate3d(0,100%,0)';
				}
				else {
					// invisible pages in the stack
					page.style.WebkitTransform = 'translate3d(0,75%,-300px)';
					page.style.transform = 'translate3d(0,75%,-300px)';		
				}
			}
			else {
				classie.remove(page, 'page--inactive');
			}

			page.style.zIndex = i < current ? parseInt(current - i) : parseInt(pagesTotal + current - i);
			
			if( posIdx !== -1 ) {
				page.style.opacity = parseFloat(1 - 0.1 * posIdx);
			}
			else {
				page.style.opacity = 0;
			}
		}
	}

	// event binding
	function initEvents() {
		// menu button click
		menuCtrl.addEventListener('click', toggleMenu);

		// navigation menu clicks
		navItems.forEach(function(item) {
			// which page to open?
			var pageid = item.getAttribute('href').slice(1);
			// console.log(pageid);
			item.addEventListener('click', function(ev) {
				ev.preventDefault();
				openPage(pageid);
			});
		});

		// clicking on a page when the menu is open triggers the menu to close again and open the clicked page
		pages.forEach(function(page) {
			var pageid = page.getAttribute('id');
			page.addEventListener('click', function(ev) {
				if( isMenuOpen ) {
					ev.preventDefault();
					openPage(pageid);
				}
			});
		});

		// keyboard navigation events
		document.addEventListener( 'keydown', function( ev ) {
			if( !isMenuOpen ) return; 
			var keyCode = ev.keyCode || ev.which;
			if( keyCode === 27 ) {
				closeMenu();
			}
		} );
	}

	// toggle menu fn
	function toggleMenu() {
		if( isMenuOpen ) {
			closeMenu();
		}
		else {
			openMenu();
			isMenuOpen = true;
		}
	}

	// opens the menu
	function openMenu() {
		// toggle the menu button
		classie.add(menuCtrl, 'menu-button--open')
		// stack gets the class "pages-stack--open" to add the transitions
		classie.add(stack, 'pages-stack--open');
		// reveal the menu
		classie.add(nav, 'pages-nav--open');

		// now set the page transforms
		var stackPagesIdxs = getStackPagesIdxs();
		for(var i = 0, len = stackPagesIdxs.length; i < len; ++i) {
			var page = pages[stackPagesIdxs[i]];
			page.style.WebkitTransform = 'translate3d(0, 75%, ' + parseInt(-1 * 200 - 50*i) + 'px)'; // -200px, -230px, -260px
			page.style.transform = 'translate3d(0, 75%, ' + parseInt(-1 * 200 - 50*i) + 'px)';
		}
	}

	// closes the menu
	function closeMenu() {
		// same as opening the current page again
		openPage();
	}

	// opens a page
	function openPage(id) {
		var futurePage = id ? document.getElementById(id) : pages[current],
			futureCurrent = pages.indexOf(futurePage),
			stackPagesIdxs = getStackPagesIdxs(futureCurrent);

		// set transforms for the new current page
		futurePage.style.WebkitTransform = 'translate3d(0, 0, 0)';
		futurePage.style.transform = 'translate3d(0, 0, 0)';
		futurePage.style.opacity = 1;

		// set transforms for the other items in the stack
		for(var i = 0, len = stackPagesIdxs.length; i < len; ++i) {
			var page = pages[stackPagesIdxs[i]];
			page.style.WebkitTransform = 'translate3d(0,100%,0)';
			page.style.transform = 'translate3d(0,100%,0)';
		}

		// set current
		if( id ) {
			current = futureCurrent;
		}
		
		// close menu..
		classie.remove(menuCtrl, 'menu-button--open');
		classie.remove(nav, 'pages-nav--open');
		onEndTransition(futurePage, function() {
			classie.remove(stack, 'pages-stack--open');
			// reorganize stack
			buildStack();
			isMenuOpen = false;
		});
	}

	// gets the current stack pages indexes. If any of them is the excludePage then this one is not part of the returned array
	function getStackPagesIdxs(excludePageIdx) {
		var nextStackPageIdx = current + 1 < pagesTotal ? current + 1 : 0,
			nextStackPageIdx_2 = current + 2 < pagesTotal ? current + 2 : 1,
			idxs = [],

			excludeIdx = excludePageIdx || -1;

		if( excludePageIdx != current ) {
			idxs.push(current);
		}
		if( excludePageIdx != nextStackPageIdx ) {
			idxs.push(nextStackPageIdx);
		}
		if( excludePageIdx != nextStackPageIdx_2 ) {
			idxs.push(nextStackPageIdx_2);
		}

		return idxs;
	}

	init();

	// $('body').scroll(function(){
	// 	toggleMenu();
	// });

	$('#about-us').click(function() {
		console.log('Hello');
		openPage('page-docu');
	});

	$('body').click(function() {
		console.log('Hello');
	});



/* 3d effect 1 */
	var _3DPretty = function() {
var obj = [],
    _x = 0,
    _y = 0,
    _x1 = 0,
    _y1 = 0,
    parts = 500,
    $, _tx, _ty, _w, _h;

  var resize = function() {
    _w = window.innerWidth * 0.5;
    _h = window.innerHeight * 0.5;
  }
  var set = function(n, f) {
    if (!!n) parts = n;
    $ = document.getElementById('space');
    window.addEventListener('mousemove', function(e) {
      _x = e.clientX;
      _y = e.clientY;
    });
    window.addEventListener('touchmove', function(e) {
      e.preventDefault();
      _x = e.touches[0].clientX;
      _y = e.touches[0].clientY;
    });
    resize();
    window.addEventListener('resize', resize);
    _set(f);
    run();
  }
  var run = function() {
    window.requestAnimationFrame(run);
    anime();
  }
  var _set = function(f) {
    for (var i = 0; i < parts; i++) {
      var o = {};
      o.p = document.createElement('span');
      $.appendChild(o.p);
      var r = i / parts, j, a, b;
      j = i % (parts * .5);
      a = Math.floor(j) / 100 + (Math.floor(j / 2) % 10) / 5 * Math.PI * 2;
      b = Math.acos(-0.9 + (j % 4) * 0.6);
      r = !!f ? f(r) : r - r * r + .5;
      var sbr = Math.sin(b) * r;
      o.x = Math.sin(a) * sbr;
      o.y = Math.cos(a) * sbr;
      o.z = Math.cos(b) * r;
      obj.push(o);
      o.transform = function() {
      var ax = .02 * _tx,
          ay = .02 * _ty,
          cx = Math.cos(ax),
          sx = Math.sin(ax),
          cy = Math.cos(ay),
          sy = Math.sin(ay);

      var z = this.y * sx + this.z * cx;
          this.y = this.y * cx + this.z * -sx;
          this.z = this.x * -sy + z * cy;
          this.x = this.x * cy + z * sy;

       var sc = 1 / (1 + this.z),
            x = this.x * sc * _h + _w - sc * 2,
            y = this.y * sc * _h + _h - sc * 2;

        var p = this.p.style;
        if (x >= 0 && y >= 0 && x < _w * 2 && y < _h * 2) {
          var c = Math.round(256 + (-this.z * 256));
          p.left = Math.round(x) + 'px';
          p.top = Math.round(y) + 'px';
          p.width = Math.round(sc * 2) + 'px';
          p.height = Math.round(sc * 2) + 'px';
          p.background = 'hsla(' + y + ',80%,80%,1)';
          p.zIndex = 200 + Math.floor(-this.z * 100);
        } else p.width = "0px";
      }
    }
  }
  var anime = function() {
    var se = 1 / _h;
    _tx = (_y - _x1) * se;
    _ty = (_x - _y1) * se;
    _x1 += _tx;
    _y1 += _ty;
    for (var i = 0, o; o = obj[i]; i++) o.transform();
  }
  return {
    set: set
  }
}();
window.onload = function() {
  _3DPretty.set(500, function(r) {
    return r * r;
  });
}

})(window);