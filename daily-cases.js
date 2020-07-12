var numCharts = 2;
var chartHeight = 360;

var margin = { top: 50, right: 50, bottom: 50, left: 50, middle: 100 };
var fullHeight = function() {
    return margin.top + (numCharts * chartHeight) + ((numCharts - 1) * margin.middle) + margin.bottom;
}

// Add the svg canvas
var vis = d3.select("#vis");
var svg = vis.append("svg").style("width", "100%").style("height", fullHeight);

var filter = svg.append("filter")
    .attr("id", "blur")
    .append("feGaussianBlur")
    .attr("stdDeviation", 1);

var truewidth = d3.select("svg").node().getBoundingClientRect().width;

// Set the dimensions of the charts
var chartWidth = truewidth - margin.left - margin.right;

// Get and filter today's data
// var todayDT = new Date("Jul 7 2020");
var todayDT = new Date();

var date = new Date(todayDT.getFullYear(), todayDT.getMonth(), todayDT.getDate());

// Get latest date for which we have data
while (!fileExists(date.toDateOnlyString() + ".csv")) {
    date.setDate(date.getDate() - 1);
}

// Get that data and draw our charts
getDataAndDrawCharts(date);