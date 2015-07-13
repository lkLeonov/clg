/****************************************

* Image Clouding Script
* by Alexey Leonov / 13.07.15
* (debug version)

*****************************************/

var svgW = 800,
    svgH = 600,
    xc = svgW/2,
    yc = svgH/2;

// функция нарезания
function sliceRect(rects, rect, imgRect, index) {
    var a = coords(rect),
        b = coords(imgRect);
    if (b.y1 > a.y1) rects.push({x: a.x1, y: a.y1, w: a.x2 - a.x1, h: b.y1 - a.y1}); // можно отсечь сверху
    if (b.x2 < a.x2) rects.push({x: b.x2, y: a.y1, w: a.x2 - b.x2, h: a.y2 - a.y1}); // можно отсечь справа
    if (b.y2 < a.y2) rects.push({x: a.x1, y: b.y2, w: a.x2 - a.x1, h: a.y2 - b.y2}); // можно отсечь снизу
    if (b.x1 > a.x1) rects.push({x: a.x1, y: a.y1, w: b.x1 - a.x1, h: a.y2 - a.y1}); // можно отсечь слева

    console.log('NEW RECT(S) PUSHED');
}

// проверка на влезание изображения в рект
function fits(image, rect) {
    if (image.w <= rect.w && image.h <= rect.h) return true;
    else return false;
}

// сравнение дистанций
function compareDist(rectA, rectB) {
    return rectA.dist - rectB.dist;
}

// выравнивание изображения к центру
function alignToCenter(image, rect) {
    switch (rect.q) { // в зависимости от четверти
        case 0:
            image.x = rect.coord_cl.x;
            image.y = rect.coord_cl.y;
            break;
        case 1:
            image.x = rect.coord_cl.x - image.w;
            image.y = rect.coord_cl.y;
            break;
        case 2:
            image.x = rect.coord_cl.x - image.w;
            image.y = rect.coord_cl.y - image.h;
            break;
        case 3:
            image.x = rect.coord_cl.x;
            image.y = rect.coord_cl.y - image.h;
            break;
        default:
            console.log('Wrong quarter @alignToCenter!');
            break;
    }

    // сохраняем в рект вложенный рект, указывающий на содержание картинки
    rect.ins = {x: image.x, y: image.y, w: image.w, h: image.h};
    return image;
}

// отрисовка изображения
function draw(svg, image) {
    svg.append('svg:image')
        .attr('x', image.x)
        .attr('y', image.y)
        .attr('width', image.w)
        .attr('height', image.h)
        .attr('xlink:href', image.src);
}

/*BEGIN**************** В этом блоке будут функции установления свойств каждому ректу******************************************************/
function setQuarter(rect) { // ставим четверть
    var r = coords(rect),
    	quarter;

    // вычисляем четверть, в которой находится вложенный рект
    if (r.x1 >= xc && r.y1 >= yc) quarter = 0; // bottom-right
    if (r.x1 < xc && r.y1 >= yc) quarter = 1; // bottom-left
    if (r.x1 < xc && r.y1 < yc) quarter = 2; // top-left
    if (r.x1 >= xc && r.y1 < yc) quarter = 3; // top-right

    rect.q = quarter;
}
function setClosest(rect, quarter) { // ставим ближнюю точку
// поскольку канва изначально разбита на 4 ректа (четверти), ближайшей к центру точкой всегда будет угол вложенного ректа. нужно только узнать какой из 4-х
// для этого вычисляем в какой из четвертей находится вложенный
    var r = coords(rect),
    	x_cl, y_cl;

    // вычисляем координаты угла (ближайшую точку) ректа
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
    // заносим сведения о четверти и координатах угла (ближайшей точки) в рект
    rect.coord_cl = {x: x_cl, y: y_cl};
}
function setDist(rect, coord_cl) { // вычисляем расстояние от ближней точки до центра
    var xx = (xc - coord_cl.x) * (xc-coord_cl.x),
        yy = (yc - coord_cl.y) * (yc-coord_cl.y),
        dist = Math.sqrt(xx + yy);

    rect.dist = dist;
}

// Поставить ректу свойства (четверть, ближнюю точку, расстояние)
function setProps(rect) {
    setQuarter(rect);
    setClosest(rect, rect.q);
    setDist(rect, rect.coord_cl);
}
/*END**************************************************************************************************************************************/

function CloudImages(container, images) {

    this.init = function () {
        // Рисуем канву
        var svg = d3.select(container).append('svg')
            .attr('width', svgW)
            .attr('height', svgH)
           	.style('background-color', 'darkslategrey');

        // Режем канву на 4 части, заносим ректы в массив
        var rects = [
            {x: svgW/2, y: svgH/2, w: svgW/2, h: svgH/2},
            {x: 0 , y: svgH/2, w: svgW/2, h: svgH/2},
            {x: 0, y: 0, w: svgW/2, h: svgH/2},
            {x: svgW/2, y: 0, w: svgW/2, h: svgH/2}
        ];
        
        // Выставляем поля
        rects.forEach(setProps);

        // Перебираем все изображения, подставляя в ректы
        for (var i = 0; i < images.length; i++) {
            for (var j = 0; j < rects.length; j++) {
                // если изображение влезает, двигаем его как можно ближе к центру и отрисовываем
                if ( fits(images[i], rects[j]) ) {
     
                    draw(svg, alignToCenter(images[i], rects[j]));

                    var iRectsInd = []; // индексы пересечённых ректом изображения ректов (чтобы потом их удалить)

                    // ищем все пересечения ректа только что отрисованного изображения с другими ректами
                    for (var k = 0; k < rects.length; k++) {
                        if ( intersect(rects[j].ins, rects[k]) ){
                            console.log('intersection:', rects[j].ins, rects[k]);
                            iRectsInd.push(k); // заносим индекс ректа в массив (чтобы потом нарезать, удалить рект)
                        } else console.log('no intersections:', rects[j].ins, rects[k]);
                    }


//begin Вот тут начинаются траблы. Код выше нормально выбирает ректы и сохраняет их индексы в iRectsInd как надо. Но дальше...

                    // Перебираем пересечённые ректы. Нарезаем каждый по ректу изображения
                    for (var l = 0; l < iRectsInd.length; l++) {

                    	console.log('TO_DELETE:', iRectsInd[l], rects[iRectsInd[l]]); // показывает индекс ректа и сам рект для нарезания
                        sliceRect(rects, rects[iRectsInd[l]], rects[j].ins, iRectsInd[l]); // нарезает
                    }
        			
        			console.log('before del', rects); // все ректы вместе с нарезанными до удаления ненужных (говорит 11)

        	// Вроде бы ничего, но вот дальше

                    // удаляем старые ректы по сохранённым индексам
                    for (var l = 0; l < iRectsInd.length; l++) {
                    		console.log('DELETED: ', iRectsInd[l], rects[iRectsInd[l]]); // показывает, что он собственно удалит в след строке

                        delete rects[iRectsInd[l]];
                        console.log('after del:', rects, '1st el:', rects[0]); // говорит, что удаляет вместе с индексами (не сдвигая): индексы 1 и 2 пропадают (undefined)

                        // значит сразу после удаления ректа следующие надо сдвинуть в массиве влево, как это делает сплайс. но из-за смещения сплайса, ректы переиндексируются и 
                        // следующий рект в этом цикле удаляется неверно
                        // значит по логике нужно оставлять делать удаления без сдвигов и после этого цикла делать переиндексацию массива ректов, который становится с дырами
                    }
                   console.log('WITH HOLES',rects);

                    // пытаемся вырезать дыры со сдвигом (посредством сплайса андефов). этот цикл - модифицированный сплайс. как только встречает андеф - двигает все правые элементы на его место и начинает заново
                    for (var l = 0; l < rects.length;) {
                    	if (rects[l]===undefined) {
                    		console.log('spliced_ind:', l);
                    		rects.splice(l, 1);
                    		continue;
                    	}
                    	l++;
                    }
                    console.log('NO HOLES', rects);
//end 


					
                    break; // прерываем, т.к. перебор только до первого из подходящих ближайших ректов для каждого изображения
                }
                
            }

            rects.forEach(setProps);
			rects.sort(compareDist); // Сортируем ректы по удалению от центра

            
        }

        console.log('Sorted rects: ', rects);

        svg.selectAll('rects').data(rects).enter().append('rect')
            .attr("x", function (d) { return d.x; })
            .attr("y", function (d) { return d.y; })
            .attr("width", function (d) { return d.w; })
            .attr('height', function (d) {return d.h; })
            .attr('fill', 'transparent');
    }
}




$(document).ready(function () {

    var images = [];

    $('#image-scope').find('img').each(function () {
        var $elem = $(this);

        images.push({src: $elem.attr('src')});
    });

    images[0].w = images[0].h = 32;
    images[1].w = images[1].h = 200;
    images[2].w = images[2].h = 80;
    images[3].w = images[3].h = 100;
    images[4].w = images[4].h = 52;
   	images[5].w = images[5].h = 8;
    images[6].w = images[6].h = 56;
    images[7].w = images[7].h = 18;
    images[8].w = images[8].h = 40;
    images[9].w = images[9].h = 25;
    images[10].w = images[10].h = 33;
    images[11].w = images[11].h = 139;
    images[12].w = images[12].h = 190;
    images[13].w = images[13].h = 30;
    images[14].w = images[14].h = 70;
    images[15].w = images[15].h = 20;
    images[16].w = images[16].h = 138;
    images[17].w = images[17].h = 40;
    images[18].w = images[18].h = 80;
    images[19].w = images[19].h = 130;
    images[20].w = images[20].h = 140;
    images[21].w = images[21].h = 210;
    images[22].w = images[22].h = 15;
    images[23].w = images[23].h = 66;
    images[24].w = images[24].h = 120;
    images[25].w = images[25].h = 102;
    images[26].w = images[26].h = 49;
    images[27].w = images[27].h = 59;
    images[28].w = images[28].h = 33;
    images[29].w = images[29].h = 150;
    images[30].w = images[30].h = 80;
    images[31].w = images[31].h = 70;
    images[32].w = images[32].h = 30;
    images[33].w = images[33].h = 40;
    images[34].w = images[34].h = 10;
    images[35].w = images[35].h = 16;

    var ci = new CloudImages('#svg-container', images);

  	var startTimer = new Date().getTime();

    ci.init();

    var endTimer = new Date().getTime();
	var time = endTimer - startTimer;
	console.log('Execution time: ' + time, 'ms');
});




// helpers
function coords(a) { // конвертер из (x,y,w,h) в (x1,x2,y1,y2)
    return {x1: a.x, x2: a.x+a.w, y1: a.y, y2: a.y+a.h}
}

// проверяет пересекаются ли ректы
function intersect(rectA, rectB){
    var a = coords(rectA),
        b = coords(rectB);
	return (
	    (
	        (b.y1 < a.y2) && (b.y2 > a.y1) // пересекает по оси y
	    ) && (
	        (b.x2 > a.x1) && (b.x1 <a.x2) // пересекает по оси x
	    )    
  );
}