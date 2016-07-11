/*!
 * clg v0.9
 * Collage grid layout jQuery plugin
 * 
 * MIT License
 * by Alexey Leonov
 * alexey5leonov@gmail.com
 */


// all collages and their items initially should be 'display: none'
// for not overlapping all items should be 'box-sizing: border-box'

(function( $, ClgCore ){

	var dft = {}; // defaults namespace
	dft.calc = {
		itemsCount: 10,
		contW: 800,
		contH: 600,
		minItemSize: 80,
		maxItemSize: 250
	};
	dft.adjust = {
		marginBottom: 65,
		marginTop: 100,
		negativeMargin: -20
	};
	dft.render = {
		// items padding
		padding: 1,

		// items padding color
		paddingColor: '#fafafa',
		thumbDelay: 800,
		thumbDelaySpread: 1500,
		thumbSpeed: 750
	};

	var
		defaults = $.extend({}, dft.calc, dft.adjust, dft.render), // merging defaults
		activeClg, // storing currently active clg
		settings;

	var methods = {

// --- RENDER ------------------------------------------------------------------------------------------------------------------

		render: function() {

			settings = $.extend(defaults, arguments[0]); // extending defaults

			var
				$collage = this.first(),
				$container = $collage.parent(),
				isRendered = $collage.data('rendered'),
				isActive = $collage.data('active'),
				$items = $collage.children(),
				itemsCount = $items.length;

			if (activeClg) {
				$activeClg = $(activeClg);
				// hide active clg and all its items:
				$activeClg.hide();
				// $activeClg.children().hide();
				$activeClg.data('active', false);

				// unbind events of the active clg
				$(window).unbind('resize');
			}

			if (isRendered) {
				console.log('RENDER: Already rendered, opacity to 0');
				$items.find('.inner').__pref('transition', 'none').css('opacity', 0); // for re-animating
				
				// clearing position is probably optional, because of the triggering opacity on items' wrappers + toggling display on items
				$items.css({
					top: '',
					left: '',
					width: '',
					height: ''
				});

			} else { // not rendered: prepare for animation by inserting wrappers
				console.log('RENDER: Not rendred, wrapping images with inners!')
				$items
					.css('box-shadow', '0px 0px 0px ' + settings.padding + 'px ' + settings.paddingColor)
					.css('border', 'solid ' + settings.padding + 'px ' + settings.paddingColor)
					.each(function () {
						var $item = $(this),
								$img = $item.find('img');


						if ($img.length > 0) {
							var $itemInner;
						 
							$item.wrapInner('<div class="inner" />');
							$itemInner = $item.find('.inner');
							$itemInner
									.css('position', 'absolute')
									.css('display', 'block')
									.css('-webkit-backface-visibility', 'hidden')
									.css('width', '100%')
									.css('height', '100%');

							
							$itemInner.css('opacity', 0);
							$itemInner.__pref('transition', 'opacity ' + (settings.thumbSpeed / 1000.00) + 's ease-in-out');
						}
					});

				// also we need some styling for images
				$items.find('img').css('width', '100%'); // important !		
			}

// test
			for (var i=0; i<itemsCount; i++ ){
				$items.eq(i).css('background-color', getRandomColor());
			};  console.log('RENDER: Total Items: ' + itemsCount);
// \test

			{ // calc and add props to clg by number of items in DOM and other props
				var opts = {};
				opts.calc = {
					itemsCount: itemsCount,
					contW: settings.contW,
					contH: settings.contH,
					minItemSize: settings.minItemSize,
					maxItemSize: settings.maxItemSize
				}

				var newClg = ClgCore(opts.calc);

				newClg.items.forEach(function(item){
					$items.eq(item.ind).css({
						position: 'absolute', // important !
						top: item.top,
						left: item.left,
						width: item.width,
						height: item.height,
						display: 'block' // as we disabling items when we rerender
					});
				});

				// storing data in collage element

				$collage
					.attr('data-canvas-width', opts.calc.contW)
					.attr('data-canvas-height', opts.calc.contH)
					.attr('data-top', newClg.props.top)
					.attr('data-width', newClg.props.width)
					.attr('data-height', newClg.props.height);

console.log('---------COLLAGE_W: ', newClg.props.width);
console.log('---------COLLAGE_H: ', newClg.props.height);
console.log('---------COLLAGE_W_data: ', $collage.attr('data-width'));
console.log('---------COLLAGE_H_data: ', $collage.attr('data-height'));
			}

			// show: // proper adjusting applies only when layout is in document flow
			$collage.show();

			// initial adjust ( non-resize handled )
			methods.adjust.call(this, $container, $collage, settings, false);

			// bind events (adjust on resize):
			$(window).on('resize', function() { methods.adjust.call(this, $container, $collage, settings, true); } );

			// animate after adjusting:
			methods.animate.call(this);

			// at the end of all setting rendered 
			if (!isRendered) $collage.data('rendered', true);
			// ...and overriding active
			if (!isActive) { 
				$collage.data('active', true);
				activeClg = this[0];
				console.log('RENDER: New active collage!');
			}

		console.timeEnd('Render time'); // testing: show render time

			return $collage;
		},

//--- SHOW -----------------------------------------------------------------------------------------------------------------

		show: function() {
			console.log('SHOW: Cheking if already rendered...');

			var $collage = this.first();
			var $items = $collage.children();
			var isRendered = $collage.data('rendered');
			var isActive = $collage.data('active');
			var $activeClg = $(activeClg);

			console.log('SHOW: ' + 'isRendered: ' + isRendered, 'isActive: ' + isActive)
			if (isRendered) {
				if (!isActive) {
					// hide active:
					$activeClg.hide(); console.log('SHOW: active:', $activeClg);
					// unbind events of the active clg
					// show:
					$collage.show();
					//adjust non-resize handled, bind events (adjust on resize)
					
					{ // set current clg as active (override active):
						$collage.data('active', true);
						activeClg = this[0];
						console.log('new active clg!');
					}
					
				}
				else { // current is active
					// just hiding items using opacity for re-animating
					$(activeClg).find('.inner').css('opacity', 0);
				}
				
				// animate
				methods.animate.call(this);
			}

			else {
				console.log('SHOW: Can\'t show: Not a rendered collage')
			}

		},

//--- ANIMATE -------------------------------------------------------------------------------------------------------------

		animate: function() {

			var $collage = this.first();
			var isRendered = $collage.data('rendered');
			var $items = $collage.children();

			if (!isRendered) {
				console.log('ANIMATE: Animating not yet rendered collage!')

				var imgs = [];
				for (var i = 0; i < $items.length; i++) { // TODO: check for items - urls equality
					var 
						$curItem = $items.eq(i),
						$curInner = $curItem.find('.inner'),
						$curImage = $curItem.find('img');

					imgs[i] = new Image();

					imgs[i].src = $curImage.data('src');
					imgs[i].$curImage = $curImage;
					imgs[i].$curInner = $curInner;

					(function outer(i) {
						imgs[i].onload = function() {
							imgs[i].$curImage.attr('src', imgs[i].src);

						//onload animating  
							setTimeout(function () {
									imgs[i].$curInner.css('opacity', 1);
							}, settings.thumbDelay + Math.floor(Math.random() * settings.thumbDelaySpread));

						}
					})(i);
					
				}
			}
			else { // already rendered
			 	$items.find('.inner').__pref('transition', 'opacity ' + (settings.thumbSpeed / 1000.00) + 's ease-in-out'); // restoring opacity animation after removing it in render (isRendered)
				$items.each(function(i, item) { // TODO: check for items - urls equality
					var 
						$item = $(item),
						$inner = $item.find('.inner');

					setTimeout(function () {
							$inner.css('opacity', 1);
					}, settings.thumbDelay + Math.floor(Math.random() * settings.thumbDelaySpread));
				}); // end: each

			} // end: else

		}, // end: animate

//--- ADJUST --------------------------------------------------------------------------------------------------------------------

		adjust: function($container, $layout, settings, onResizeHandled) {

			var 
				canvasWidth  = $layout.attr('data-canvas-width'), // TODO: pass this props directly via attribute object
				canvasHeight  = $layout.attr('data-canvas-height'),
				collageOffsetTop  = $layout.attr('data-top'),
				collageHeight  = $layout.attr('data-height'),
				collageWidth  = $layout.attr('data-width');

console.log('colW: ' + collageWidth, 'colH: ' + collageHeight );

			if (!onResizeHandled) {
				console.log('ADJUST: Applying non resize handled adjusting...')
				// initial non event-handled instructions
			 
				$layout 
					.width(canvasWidth)
					.height(canvasHeight)
					.offset({'top': -collageOffsetTop + settings.marginTop});
			}

						// the adjusting (for window.onresize callback)

			var
				mainWidth = $(window).width(),
				mainHeight = $(window).height() - settings.marginTop - settings.marginBottom;

			var
				lw = mainWidth / collageWidth,
				lh = (mainHeight - settings.negativeMargin * 2) / collageHeight;

console.log('winWidth: ' + mainWidth, 'WinHeight-marTop-marBot: ' + mainHeight);
console.log('lw (winWidth/colWidth): ' + lw, 'lh ( ( mainH - negMargs*2 ) / colHeight ): ' + lh)
						
		//downscale
			var p; // scale Factor
			if (lw < 1 || lh < 1) {
				p = Math.min(lw, lh);
				// p = p * 0.7; // solves moblile portrait problem
				$layout
					.css('transform', 'scale(' + p + ')')
					.offset({
						'top':  settings.marginTop + settings.negativeMargin - (collageOffsetTop * p),
						'left':  -(canvasWidth*p - mainWidth) / 2
					});
			
			} else { // TODO:
		//upscale
		  // back to original size
				p = 1;
				$layout
					.css('transform', 'scale(' + p + ')')
					.offset({
						'top':  settings.marginTop + settings.negativeMargin - (collageOffsetTop * p),
						'left':  -(canvasWidth*p - mainWidth) / 2
					});
		
			}

			$container.css('height', mainHeight);

			//console.log('ADJUST: Collage is adjusted to ', window.innerWidth + ' x ' + window.innerHeight, 'screen resolution with the scale factor of ', p ? p : 0);
				
		} // end: adjust
			
	} // end: methods


// --- BEGIN -----------------------------------------------------------------------------------------------

	$.fn.clg = function() {
		console.time('Render time'); // testing

		// arguments handling logic

		if (arguments[0] && typeof arguments[0] === "object") { // user passed an object as the 1st arg
			 return methods.render.apply( this, arguments );
		}
		else if (!arguments[0]) { // no arguments
			return methods.show.call(this);
		}
		else {
			console.log('INIT: Invalid argument');
		}

	};

// --- Utilities --------------------------------------------------------------------------------------------

	function getRandomColor() {
		var letters = '0123456789ABCDEF'.split('');
		var color = '#';
		for (var i = 0; i < 6; i++ ) {
			 color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	}

 // just extending jquery for using vendor prefixes
	$.fn.__pref = function (k, v) {
		return $(this)
			.css('-webkit-' + k, v)
			.css('-moz-' + k, v)
			.css('-o-' + k, v)
			.css('-ms-' + k, v)
			.css(k, v);
	};

})( jQuery, ClgCore );