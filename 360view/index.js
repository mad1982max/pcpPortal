'use strict';
let levelInfo;
let pointName, level, currentSubLevelToShow, zoomFn;
let floorSrc, set, svg, mainLayer, zoomObj;
let pointsOnLevel, currentScene;
let isFirstMapAppear = true;

let floor;
let minScale = 0.3;
let maxScale = 10;
let prevScale = 1;
let prevClusterPointId = 0;
let singlePinColor = "#FF2A2A";
let clusterPinColor = "#00BD63";

let tooltip = {
    defaultColor: "#FF2A2A",
    checkedColor: "#00b359",
    defaultR: 15,
    checkedR: 25
}

let clusterdata = [{
    clusterPointId: 0,
    sensivity: 200,
    minScale: minScale,
    maxScale: 1.6,
    rCuster: 43,
    textCluster: 48,
    rPin: 25,
    textPin: 20,
    dyTextCluster: 14,
    dyTextPin: 6
},
{
    clusterPointId: 1,
    sensivity: 0,
    minScale: 1.6,
    maxScale: maxScale,
    rCuster: 43,
    textCluster: 20,
    rPin: 15,
    textPin: 12,
    dyTextCluster: 12,
    dyTextPin: 4
}
]

let viewCone = {
    width: 130,
    height: 300,
    colorStart: "#00b359",
    colorStop: "#0066ff",
    opacity: 1,
    initRotateAnge: 180
}

const mapInit = {
    widthRatioToWind: 0.5,
    imgWidth: 3000,
    imgHeight: 1850,
    minWidth: 400,
    ratio: 1.7
}

defineData4Floor();

function defineData4Floor() {
    const paramsString = window.location.search;
    const searchParams = new URLSearchParams(paramsString);
    level = searchParams.get('level');
    pointName = searchParams.get('name');
    currentSubLevelToShow = searchParams.get('sub');

    levelInfo = levelsEdgeInfo.find(item => item.levelName == level);
    floorSrc = floorSrcFn(level, levelInfo.isSub, currentSubLevelToShow);
    currentScene = tails.find(scene => scene.name == pointName);
}



function getPointOnLevel(points, level, sub) {
    if ((!level.isSub && sub !== "sub_0") || !level[sub]) {
        console.log('**subLevel not exist on this level. sub will be set to default value (sub_0)**');
        sub = "sub_0";
    }
    let levelMeasures = level[sub];
    let pointsOnLevel;

    if (levelMeasures.minH && levelMeasures.maxH) {
        pointsOnLevel = points.filter(item => item.z >= levelMeasures.minH && item.z <= levelMeasures.maxH)
    } else if (levelMeasures.minH && !levelMeasures.maxH) {
        pointsOnLevel = points.filter(item => item.z >= levelMeasures.minH)
    } else if (!levelMeasures.minH && levelMeasures.maxH) {
        pointsOnLevel = points.filter(item => item.z <= levelMeasures.maxH)
    } else {
        console.log('**some error in minH, maxH**');
    }
    return pointsOnLevel
}

function makeResizableMapWrapper(div) {
    const element = document.querySelector(div);
    const resizer = document.querySelector('.resizeMapBtn');
    let original_width = 0;
    let original_height = 0;
    let original_x = 0;
    let original_y = 0;
    let original_mouse_x = 0;
    let original_mouse_y = 0;

    function touchStart(e) {

        e.preventDefault();
        e.stopPropagation();

        let {
            height,
            width,
            left,
            top
        } = element.getBoundingClientRect();
        original_height = height;
        original_width = width;
        original_x = left;
        original_y = top;

        original_mouse_x = e.pageX || e.touches[0].pageX;
        original_mouse_y = e.pageY || e.touches[0].pageY;

        window.addEventListener('mousemove', resizeByDrag);
        window.addEventListener('touchmove', resizeByDrag);
        window.addEventListener('mouseup', stopResize);
        window.addEventListener('touchend', stopResize);
    }

    resizer.addEventListener('mousedown', touchStart);
    resizer.addEventListener('touchstart', touchStart);

    function resizeByDrag(e) {

        let currentXpos;
        if(e.constructor.name === "TouchEvent") {
            currentXpos = e.touches[0].pageX > 0 ? e.touches[0].pageX : 0
        } else if(e.constructor.name === "MouseEvent") {
            currentXpos = e.pageX > 0 ? e.pageX : 0
        }
        const width = original_width - (currentXpos - original_mouse_x);
        const height = width / mapInit.imgWidth * mapInit.imgHeight;
        element.style.width = width + 'px';
        element.style.height = height + 'px'; 
        
        if(svg.select()) {
            deleteSet('doc', '.tooltip');
        }
        resizeFnSvgHeight();       
    }

    function stopResize() {
        window.removeEventListener('mousemove', resizeByDrag);
        window.removeEventListener('touchmove', resizeByDrag);
    }
}

window.onload = onloadFn;

function onloadFn() {
    document.body.style.opacity = 1;
    makeResizableMapWrapper('#mapList');

    let stairsUpBtn = document.getElementById('stairsUpBtn');
    let stairsDownBtn = document.getElementById('stairsDownBtn');
    stairsDownBtn.addEventListener('click', changeStairsFn.bind(null, -1));
    stairsUpBtn.addEventListener('click', changeStairsFn.bind(null, 1));

    let nextBtn = document.getElementById('next');
    let prevBtn = document.getElementById('prev');
    nextBtn.addEventListener('click', changePinFn.bind(null, 1));
    prevBtn.addEventListener('click', changePinFn.bind(null, -1));

    let centerizeMapBtn = document.getElementById('centerizeMapBtn');
    centerizeMapBtn.addEventListener('click', centerizeFn);

    window.addEventListener('resize', resizeFn);

    window.addEventListener("orientationchange", function (e) {
        document.body.style.opacity = 0;
        window.location.reload();
    });

  
    
    initMapWidth();
    resizeFn();
    buildSvg();
    // isFirstMapAppear = false;    
}



function resizeFn() {
    let windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    const mapList = document.querySelector('#mapList');
    const mapListWidth = mapList.offsetWidth;
    if(mapListWidth >= windowWidth) {
        const height = windowWidth / mapInit.imgWidth * mapInit.imgHeight;
        mapList.style.width = windowWidth + 'px';
        mapList.style.height = height + 'px';
    }
    if(svg) {
        resizeFnSvgHeight();
    }
}

function initMapWidth() {
    let windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

    let mapWidth = windowWidth * mapInit.widthRatioToWind > mapInit.minWidth? windowWidth * mapInit.widthRatioToWind : mapInit.minWidth


    let asideWrapper = document.querySelector('#mapList');
    asideWrapper.style.width = mapWidth + 'px';
    asideWrapper.style.height = mapWidth / mapInit.imgWidth * mapInit.imgHeight + 'px';

}

function getNewSvgHeight() {
    const mapList = document.querySelector('#mapList');
    return mapList.offsetHeight
}

function resizeFnSvgHeight() {
    let freeHeight = getNewSvgHeight();
    svg.attr('height', freeHeight)
}

function findNextBaseLevel(levelInfo, counter) {
    let nextLevel = levelsEdgeInfo[levelInfo.id + counter];
    if(!nextLevel) {
        if(counter > 0) {
            nextLevel = levelsEdgeInfo.find(floor => floor.id === 0);            
        } else {
            let numOfFloors = levelsEdgeInfo.length;
            nextLevel = levelsEdgeInfo.find(floor => floor.id === numOfFloors - 1);
        }
    }
    return nextLevel;
}

function nextSubFloorFn(sub, counter, isSub) {
    if (counter > 0 && isSub) {
        if (sub == "sub_0") return "sub_1"
    } else {
        if (sub == "sub_1") return "sub_0"
    }
    return "_"
}

function changeStairsFn(counter) {
    let nextSubFloor = nextSubFloorFn(currentSubLevelToShow, counter, levelInfo.isSub);

    deleteSet('svg', '.set');
    
    if (nextSubFloor === "_") {
        levelInfo = findNextBaseLevel(levelInfo, counter);
        level = levelInfo.levelName;

        if (levelInfo.isSub) {
            currentSubLevelToShow = counter < 0 ? "sub_1" : "sub_0";  
            
        } else {
            currentSubLevelToShow = "sub_0"
        }
    } else {
        currentSubLevelToShow = nextSubFloor;
    }

    floorSrc = floorSrcFn(level, levelInfo.isSub, currentSubLevelToShow); 

    svg
        .select('.floorLayer')
        .select('image')
        .attr('xlink:href', floorSrc);

    centerizeFn();
}

function floorSrcFn(level, isSubLevelExist, currentSubLevelToShow) {
    
    let tail = isSubLevelExist ? `_${currentSubLevelToShow}` : "";
    return `../assets/img/level/${level}${tail}.png`
}

function centerizeFn() {
    svg
        .transition()
        .duration(400)
        .call(zoomObj.transform, d3.zoomIdentity.translate(0, 0).scale(1));
}

function changePinFn(counter) {    
    let currentPinIndex = pointsOnLevel.findIndex(point => point.name == pointName);
    let nextIndex = currentPinIndex + counter;
    if (nextIndex > pointsOnLevel.length - 1) nextIndex = 0;
    if (nextIndex < 0) nextIndex = pointsOnLevel.length - 1;
    pointName = pointsOnLevel[nextIndex].name;
    clickNext.notify(pointName);
    switchPhoto360Observable.notify(pointName);
    
}

function buildSvg() {
    let freeHeight = getNewSvgHeight();
    svg = d3.select("#wrapper").append("svg");
    svg
        .attr("class", "svgContainer")
        .attr("viewBox", [0, 0, mapInit.imgWidth, mapInit.imgHeight])
        .attr("width", "100%")
        .attr("height", freeHeight);

    let defs = svg.append("defs");

    let gradient = defs.append("linearGradient")
    .attr("id", "svgGradient")
    .attr("x1", "0%")
    .attr("x2", "0%")
    .attr("y1", "20%")
    .attr("y2", "100%");

    gradient.append("stop")
    .attr('class', 'start')
    .attr("offset", "0%")
    .attr("stop-color", viewCone.colorStart)
    .attr("stop-opacity", 0.9);

    gradient.append("stop")
    .attr('class', 'end')
    .attr("offset", "100%")
    .attr("stop-color", viewCone.colorStop)
    .attr("stop-opacity", 0);

    mainLayer = svg.append("g");
    mainLayer
        .attr("class", "mainLayer")
        .attr("opacity", "0")

    let floorLayer = mainLayer.append("g")
    floorLayer
        .attr("class", "floorLayer")
        .attr('opacity', '0.7');

    let floor = floorLayer.append("image");
    floor.attr("class", "currentFloor");
    floor.attr("xlink:href", floorSrc);
    floor.on("load", () => {        
        pointsOnLevel = getPointOnLevel(points, levelInfo, currentSubLevelToShow);

        drawSet(pointsOnLevel);
        miniMapisLoad.notify();

    mainLayer
        .transition()
        .duration(400)
        .attr("opacity", "1");       
    });

    zoomObj = d3.zoom()
        .scaleExtent([minScale, maxScale])
        .on("zoom", () => {
            deleteSet('doc', '.tooltip');
            zoomed();
        });
    svg.call(zoomObj);
}

function zoomed() {
    let transform = d3.event.transform;
    mainLayer.attr("transform", transform);
}


function drawSet(currentSet, className = 'set') {
    set = mainLayer.append('g')
        set.attr('class', className)
        .selectAll('g')
        .data(currentSet)
        .join("g")
        .attr("pointer-events", "visible")
        .attr("cursor", "pointer")
        .attr("id", d => `_${d.name}`)
        .append('circle')
        .attr('fill', (d) => d.name == pointName ? tooltip.checkedColor : tooltip.defaultColor)
        .attr('cx', d => d.x_img)
        .attr('cy', d => d.y_img)
        .attr('r', (d) => d.name == pointName ? tooltip.checkedR : tooltip.defaultR)
        .on('click', clickedOnPin)
        .on('mousemove', (d) => toolTipFn(d.name))
        .on('mouseleave', (d) => toolTipFn(d.name, false));

}

function deleteSet(base, selector) {
    let element;
    if (base === "doc") {
        element = document.querySelector(selector)
    } else if (base === "svg") {
        element = svg.select(selector);
    }
    if (element) element.remove();
}

function reDesignAfterClick(selectedAttr, selector, oldValue, singleElem, newValue) {
    set.selectAll(selector).attr(selectedAttr, oldValue);
    if (singleElem.attr) {
        singleElem.attr(selectedAttr, newValue)
    } else {
        singleElem.setAttribute(selectedAttr, newValue);
    }
}

function clickedOnPin(d) {
    let targetEl = d3.event.target;
    reDesignAfterClick('fill', 'circle', tooltip.defaultColor, targetEl, tooltip.checkedColor);
    reDesignAfterClick('r', 'circle', tooltip.defaultR, targetEl, tooltip.checkedR);
    pointName = d.name;
    switchPhoto360Observable.notify(pointName);
    toolTipFn(pointName);
    deleteSet('svg', '.view');
    buildViewCone()
};

function changePinFn(counter) {    
    let currentPinIndex = pointsOnLevel.findIndex(point => point.name == pointName);
    let nextIndex = currentPinIndex + counter;
    if (nextIndex > pointsOnLevel.length - 1) nextIndex = 0;
    if (nextIndex < 0) nextIndex = pointsOnLevel.length - 1;
    pointName = pointsOnLevel[nextIndex].name;
    clickNext.notify(pointName);
    switchPhoto360Observable.notify(pointName);    
}

clickNext.subscribe((pointName) => {
    changeCurrentOnMiniMap(pointName);
});

rotationObservable.subscribe((data) => {
    changeView(data/ Math.PI*180);
});

miniMapisLoad.subscribe(data => {
    buildViewCone();
    console.log('FLOOR EXISTS');
})

function changeCurrentOnMiniMap() {
    let target = svg.select(`#_${pointName} circle`).node();
    reDesignAfterClick('fill', 'circle', tooltip.defaultColor, target, tooltip.checkedColor);
    reDesignAfterClick('r', 'circle', tooltip.defaultR, target, tooltip.checkedR);
    deleteSet('svg', '.view');
    buildViewCone();
}


function toolTipFn(id, flag = true) {
    deleteSet('doc', '.tooltip');
    if (!flag) return;
    let x = d3.event.pageX;
    let y = d3.event.pageY;
    let posYDelta = 15;
    let posXDelta = window.innerWidth - d3.event.pageX < 50 ? -35 : 15;
    let tooltipElem = document.createElement('div');
    tooltipElem.className = 'tooltip';
    tooltipElem.innerHTML = id;
    tooltipElem.style.left = (x + posXDelta) + 'px';
    tooltipElem.style.top = (y + posYDelta) + 'px';
    tooltipElem.style.backgroundColor = id == pointName ? tooltip.checkedColor : tooltip.defaultColor;
    document.body.append(tooltipElem);
}

function changeView(angle) {
    let point = pointsOnLevel.find(point => point.name == pointName);
    if(point) {
        set
            .select('.view')
            .attr('transform', `rotate(${angle + viewCone.initRotateAnge} ${point.x_img} ${point.y_img})`)
    } else {
        console.log("point doesn't evist");
    }    
}

function buildViewCone(angle = 0) {
    let point = pointsOnLevel.find(point => point.name == pointName);

    if(point) {
        set
            .insert('polygon', ':first-child')
            .attr('class', 'view')
            .attr('pointer-events', 'none')
            .attr('points', `${point.x_img},${point.y_img}, ${point.x_img + viewCone.width}, ${point.y_img + viewCone.height}, ${point.x_img - viewCone.width}, ${point.y_img + viewCone.height}`)
            //only for test
            .attr('transform', `rotate(${angle + viewCone.initRotateAnge} ${point.x_img} ${point.y_img})`)
            .attr('fill', "url(#svgGradient)")
    }    
}























function returnFn() {
    document.location.href = '../level/index.html?' + 'level=' + level + '&isAsideVis=0' + '&sub=' + currentSubLevelToShow;
}
