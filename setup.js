var numCharts = 2;
var chartHeight = 360;

var svgMargin = { top: 50, right: 50, bottom: 50, left: 50, middleVert: 100, middleHoriz: 50 };
var svgColumns = [0.75, 0.25];

var fullHeight = function() {
    return svgMargin.top + (numCharts * chartHeight) + ((numCharts - 1) * svgMargin.middleVert) + svgMargin.bottom;
}

var colorscheme = "light";
// if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
//     colorscheme = "dark";
//     d3.select("body").attr("class", "dark-mode");
// }

// Add the svg canvas
var vis = d3.select("#vis");
var svg = vis.append("svg")
    .attr("id", "chartsvg")
    .style("width", "100%")
    .style("height", fullHeight);

var svgwidth = function() { return d3.select("svg").node().getBoundingClientRect().width; };

// Set the dimensions of the charts
// var dailyChartWidth = function() { return (svgwidth() - svgMargin.left - svgMargin.right); };

var columnWidths = function() {
    var widths = [];
    var drawableWidth = svgwidth() - svgMargin.left - svgMargin.right - (svgColumns.length - 1) * svgMargin.middleHoriz
    svgColumns.forEach((c, i) => {
        widths[i] = drawableWidth * c;
    });
    return widths;
}

var columnXs = function() {
    var xs = [];
    var curX = svgMargin.left;
    columnWidths().forEach((w, i) => {
        xs[i] = curX;
        curX += svgMargin.middleHoriz;
    })
    return xs;
}