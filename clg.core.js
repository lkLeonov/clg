/*!
 * clg v0.9
 * Collage grid layout plugin core
 * 
 * MIT License
 * by Alexey Leonov
 * alexey5leonov@gmail.com
 */


var ClgCore = function() {
  var defaults = {
      itemsCount: 10,
      contW: 800,
      contH: 600,
      minItemSize: 100,
      maxItemSize: 300
  }, options;

  if (arguments[0] && typeof arguments[0] === "object") {
    options = extendDefaults(defaults, arguments[0]);
  } else options = defaults;

  var
    cx = options.contW/2,
    cy = options.contH/2,
    data = [];

  function sliceRect(rects, rect, itmRect) {
      var a = coords(rect),
          b = coords(itmRect);
      if (b.y1 > a.y1) rects.push({x: a.x1, y: a.y1, w: a.x2 - a.x1, h: b.y1 - a.y1});
      if (b.x2 < a.x2) rects.push({x: b.x2, y: a.y1, w: a.x2 - b.x2, h: a.y2 - a.y1});
      if (b.y2 < a.y2) rects.push({x: a.x1, y: b.y2, w: a.x2 - a.x1, h: a.y2 - b.y2});
      if (b.x1 > a.x1) rects.push({x: a.x1, y: a.y1, w: b.x1 - a.x1, h: a.y2 - a.y1});
  }

  function fits(item, rect) {
      if (item.w <= rect.w && item.h <= rect.h) return true;
      else return false;
  }

  function compareDist(rectA, rectB) {
      return rectA.dist - rectB.dist;
  }

  function alignToCenter(item, rect) {
      switch (rect.q) {
          case 0:
              item.x = rect.coord_cl.x;
              item.y = rect.coord_cl.y;
              break;
          case 1:
              item.x = rect.coord_cl.x - item.w;
              item.y = rect.coord_cl.y;
              break;
          case 2:
              item.x = rect.coord_cl.x - item.w;
              item.y = rect.coord_cl.y - item.h;
              break;
          case 3:
              item.x = rect.coord_cl.x;
              item.y = rect.coord_cl.y - item.h;
              break;
          default:
              console.log('Wrong quarter @alignToCenter!');
              break;
      }

      rect.ins = {x: item.x, y: item.y, w: item.w, h: item.h};
      return item;
  }

  function saveData(i, item) {
      data.push({
          'ind' : i,
          'left' : item.x,
          'top' : item.y,
          'width' : item.w,
          'height' : item.h
      })
  }

  function getCollageProps(data) {
      var props = {};
          props.top = Math.min.apply(Math, data.map(function(item){return item.top;}));
          props.bottom = Math.max.apply(Math, data.map(function(item){return item.top+item.height;}));
          props.left = Math.min.apply(Math, data.map(function(item){return item.left;}));
          props.right = Math.max.apply(Math, data.map(function(item){return item.left+item.width;}));
          props.width = props.right - props.left;
          props.height = props.bottom - props.top;
  
      return props;
  }

  function setQuarter(rect) {
      var r = coords(rect),
          quarter;

      if (r.x1 >= cx && r.y1 >= cy) quarter = 0;
      if (r.x1 < cx && r.y1 >= cy) quarter = 1;
      if (r.x1 < cx && r.y1 < cy) quarter = 2;
      if (r.x1 >= cx && r.y1 < cy) quarter = 3;

      rect.q = quarter;
  }

  function setClosestPointOf(rect, quarter) {
      var r = coords(rect),
          x_cl, y_cl;

      switch (quarter) {
          case 0:
              x_cl = r.x1;
              y_cl = r.y1;
              break;
          case 1:
              x_cl = r.x2;
              y_cl = r.y1;
              break;
          case 2:
              x_cl = r.x2;
              y_cl = r.y2;
              break;
          case 3:
              x_cl = r.x1;
              y_cl = r.y2;
              break;
          default:
              console.log('Wrong quarter @setDist()!');
              break;
      }

    rect.coord_cl = {x: x_cl, y: y_cl};
  }

  function setDist(rect, coord_cl) {

      var xx = (cx - coord_cl.x) * (cx-coord_cl.x),
          yy = (cy - coord_cl.y) * (cy-coord_cl.y),
          dist = Math.sqrt(xx + yy);

      rect.dist = dist;
  }

  // setting rect properties: quarter, rect's closest point to center, distance from that point to center
  function setProps(rect) {
      setQuarter(rect);
      setClosestPointOf(rect, rect.q);
      setDist(rect, rect.coord_cl);
  }

  var items = [];

  for (var i = 0; i < options.itemsCount; i++) {
      items.push({});
      items[i].w = items[i].h = getRandomInt(options.minItemSize, options.maxItemSize);
  }

  var rects = [
      {x: options.contW/2, y: options.contH/2, w: options.contW/2, h: options.contH/2},
      {x: 0 , y: options.contH/2, w: options.contW/2, h: options.contH/2},
      {x: 0, y: 0, w: options.contW/2, h: options.contH/2},
      {x: options.contW/2, y: 0, w: options.contW/2, h: options.contH/2}
  ];
  
  rects.forEach(setProps);

  for (var i = 0; i < items.length; i++) { // for each of all of our itmes
    for (var j = 0; j < rects.length; j++) { // loop through all of our rects
      if ( fits(items[i], rects[j]) ) { // check if an item fits to the current rect

        saveData( i, alignToCenter(items[i], rects[j]) );

        var iRectsInd = [];

        for (var k = 0; k < rects.length; k++) {
            if ( intersect(rects[j].ins, rects[k]) ){
                iRectsInd.push(k);
            } 
        }

        for (var l = 0; l < iRectsInd.length; l++) {
            sliceRect(rects, rects[iRectsInd[l]], rects[j].ins);
        }

        for (var l = 0; l < iRectsInd.length; l++) {
            delete rects[iRectsInd[l]];
        }

        for (var l = 0; l < rects.length;) {
            if (rects[l]===undefined) {
                rects.splice(l, 1);
                continue;
            }
            l++;
        }

        break;
      } 
    }

    rects.forEach(setProps);
    rects.sort(compareDist);

  }

  console.log('CLGCORE: A new collage is successfully calculated...');

  // Public interface

  return {
    props: getCollageProps(data),
    items: data
  }   
    
}


// Helpers

function coords(rect) { // (x,y,w,h) to (x1,x2,y1,y2) converter
    return {x1: rect.x, x2: rect.x+rect.w, y1: rect.y, y2: rect.y+rect.h}
}

function intersect(rectA, rectB){
    var a = coords(rectA),
        b = coords(rectB);
      return (
        (
            (b.y1 < a.y2) && (b.y2 > a.y1)
        ) && (
            (b.x2 > a.x1) && (b.x1 < a.x2)
        )    
  );
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// object shallow copying func for extending defaults
function extendDefaults(source, properties) {
  var property;
  for (property in properties) {
    if (properties.hasOwnProperty(property)) {
      source[property] = properties[property];
    }
  }
  return source;
}

    



