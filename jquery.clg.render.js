/*!
 * clg v0.5
 * Collage grid layout jQuery plugin
 * 
 * MIT License
 * by Alexey Leonov
 * alexey5leonov@gmail.com
 */

// utils
function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
  // just extending jquery for using vendor prefixes
  $.fn.pref = function (k, v) {
      return $(this)
          .css('-webkit-' + k, v)
          .css('-moz-' + k, v)
          .css('-o-' + k, v)
          .css('-ms-' + k, v)
          .css(k, v);
  };

// all collages and their elements initially should be 'display:none'

(function( $ ){

  var dft = {}; // defaults namespace
  dft.calc = {
    itemsCount: 10,
    contW: 800,
    contH: 600,
    minItemSize: 100,
    maxItemSize: 300
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

  var defaults = $.extend({}, dft.calc, dft.adjust, dft.render); // merging defaults
  var activeClg; // storing currently active clg

  var methods = {

    render: function() {

      settings = $.extend(defaults, arguments[0]); // extending defaults
      
      var $collage = $(this[0]);

      var isRendered = $collage.data('rendered');
      var isActive = $collage.data('active');
      
      var $items = $collage.children();
      var itemsCount = $items.length;

      if (activeClg) {
        $activeClg = $(activeClg);
        // hide active clg and all its items:
        $activeClg.hide();
        // $activeClg.children().hide();
        $activeClg.data('active', false);

        // unbind events of the active clg
      }

        if (isRendered) {

          $items.find('.inner').css('opacity', 0); // for re-animating
          // clearing position is probably optional, because of the triggering opacity on items' wrappers + toggling display on items
          $items.css({
            top: '',
            left: '',
            width: '',
            height: ''
          });

        }

        else { // not rendered: prepare for animation by inserting wrappers

          console.log('Not rendred, wrapping imgs with inners!')
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
                      $itemInner.pref('transition', 'opacity ' + (settings.thumbSpeed / 1000.00) + 's ease-in-out');
                  }
              });

              // also we need some styling for images
              $items.find('img').css('width', '100%'); // important !

              
        }

// test
        for (var i=0; i<itemsCount; i++ ){
          $items.eq(i).css('background-color', getRandomColor());
        };  console.log('Total Items: ' + itemsCount);
//\test

        // calc and add props to clg by number of items and other props
      {
        var opts = {};
        opts.calc = {
          itemsCount: itemsCount,
          contW: settings.contW,
          contH: settings.contH,
          minItemSize: settings.minItemSize,
          maxItemSize: settings.maxItemSize
        }
        var ClgCalc = Collage(opts.calc);
        ClgCalc.items.forEach(function(item){
        
          $items.eq(item.ind).css({
            position: 'absolute', // important !
            top: item.top,
            left: item.left,
            width: item.width,
            height: item.height,
            display: 'block' // as we disabling items when we rerender

          });
        });

      }

      // show // proper adjusting applies only when layout is in document flow
      $collage.show();

      // adjust non-resize handled, bind events (adjust on resize)
      // animate after adjusting:
      methods.animate.call(this);

      // at the end of all setting rendered 
      if (!isRendered) $collage.data('rendered', true);
      // ...and overriding active
      if (!isActive) { 
        $collage.data('active', true);
        activeClg = this[0];
        console.log('new active clg!');
      }

console.timeEnd('Render time'); // testing: show render time

      return $collage;
    },

    show: function() {
      console.log('Cheking if already rendered...');

      var $collage = $(this[0]);
      var $items = $collage.children();
      var isRendered = $collage.data('rendered');
      var isActive = $collage.data('active');
      var $activeClg = $(activeClg);

      console.log(isRendered, isActive)
      if (isRendered) {
        if (!isActive) {
          // hide active:
          $activeClg.hide(); console.log('active:', $activeClg)
          // unbind events of the active clg
          // show, adjust non-resize handled, bind events (adjust on resize)
          $collage.show();
          
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
        console.log('Not a rendered collage')
      }

    },

    animate: function() {

      var $collage = $(this[0]);
      var isRendered = $collage.data('rendered');
      var $items = $collage.children();

      if (!isRendered) {
        console.log('Animating not yet rendered collage!')

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

          !function outer(i) {
            imgs[i].onload = function() {
              imgs[i].$curImage.attr('src', imgs[i].src);

            //onload animating  
              setTimeout(function () {
                  imgs[i].$curInner.css('opacity', 1);
              }, settings.thumbDelay + Math.floor(Math.random() * settings.thumbDelaySpread));

            }
          }(i);
          
        }
      }
      else { // already rendered
       
        $items.each(function(i, item) { // TODO: check for items - urls equality
          var 
            $item = $(item),
            $inner = $item.find('.inner');

          setTimeout(function () {
              $inner.css('opacity', 1);
          }, settings.thumbDelay + Math.floor(Math.random() * settings.thumbDelaySpread));
        }); // end: each

      } // end: else

    } // end: animate
      
  } // end: methods



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
      console.log('Shit passed as an argument');
    }



  };

})( jQuery );