var numCharts = 2;
var chartHeight = 360;

var margin = { top: 50, right: 50, bottom: 50, left: 50, middle: 100 };
var fullHeight = function() {
    return margin.top + (numCharts * chartHeight) + ((numCharts - 1) * margin.middle) + margin.bottom;
}

// Add the svg canvas
var vis = d3.select("#vis");
var svg = vis.append("svg").style("width", "100%").style("height", fullHeight);

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

// /* ---------------------
//  * Tooltip Handling
//  * --------------------- */

// // Handle mouseovers
// // Draw clear overlay rects in front of charts for mouse handling

// charts.forEach((chart, i) => {
//     var overlay = chart.element.append("g")
//         .attr("transform", translate(10, 10));
//     overlay.append("rect")
//         .attr("x", 0).attr("y", 0)
//         .attr("width", chart.dim.width).attr("height", chart.dim.height)
//         .style("opacity", 0);

//     var tooltip = overlay.append("g")
//         .attr("id", `tooltip${i}`)
//         .style("pointer-events", "none");

//     var tooltipData = [
//         function(xCoord) {
//             return "This is a tooltip"
//         }
//         // },

//         // function(xCoord) {
//         //     var rawTime = chart.x.invert(xCoord);
//         //     return d3.timeFormat("%-I:%M %p")(rawTime);
//         // },
//         // function(xCoord) {
//         //     var wait = Math.round(permData[Math.round(x.invert(xCoord))].STANDBY_Q_WAIT_AVG);
//         //     var count = Math.round(permData[Math.round(x.invert(xCoord))].STANDBY_Q_LENGTH_AVG);
//         //     return "Check-in Wait: {0} min (count: {1})".format(wait, count);
//         // },
//         // function(xCoord) {
//         //     var wait = Math.round(permData[Math.round(x.invert(xCoord))].VOTING_Q_WAIT_AVG);
//         //     var count = Math.round(permData[Math.round(x.invert(xCoord))].VOTING_Q_LENGTH_AVG);
//         //     return "Voting Wait: {0} min (count: {1})".format(wait, count);
//         // },
//         // function(xCoord) {
//         //     var cWait = Math.round(permData[Math.round(x.invert(xCoord))].STANDBY_Q_WAIT_AVG);
//         //     var vWait = Math.round(permData[Math.round(x.invert(xCoord))].VOTING_Q_WAIT_AVG);
//         //     var cCount = Math.round(permData[Math.round(x.invert(xCoord))].STANDBY_Q_LENGTH_AVG);
//         //     var vCount = Math.round(permData[Math.round(x.invert(xCoord))].VOTING_Q_LENGTH_AVG);
//         //     return "Total Wait: {0} min (count: {1})".format(cWait + vWait, cCount + vCount);
//         // }
//     ];

//     var tooltipScale = d3.scaleBand().range([10, 100]).domain(arrayFromRange(0, tooltipData.length)).paddingOuter(0.5);

//     overlay.on("mouseover", function(d, i) {
//             var mouseX = d3.mouse(this)[0];

//             chart.element.select("#mark")
//                 .style("opacity", 0.7)
//                 .attr("x1", mouseX).attr("x2", mouseX)
//                 .attr("y1", 0).attr("y2", chart.dim.height);

//             tooltip.append("rect")
//                 .attr("id", "ttBox")
//                 .attr("class", "legend-box")
//                 .attr("x", 0).attr("y", 0)
//                 .attr("rx", 10).attr("ry", 10)
//                 .attr("height", tooltipScale.range()[1] - tooltipScale.range()[0] - 6);


//             tooltip.selectAll("text").data(tooltipDataL)
//                 .enter().append("text")
//                 .attr("x", 8).attr("y", function(d, i) { return tooltipScale(i); })
//                 .style("font-weight", function(d, i) { return (i == 0) ? "bold" : "normal"; })
//                 .text(function(d) { return d(mouseX); });

//             var maxTextWidth = d3.max(tooltip.selectAll("text").nodes(), function(d) {
//                 return d.getComputedTextLength();
//             });
//             var tooltipWidth = (isNaN(maxTextWidth) ? 0 : maxTextWidth + 16);

//             tooltip.select("#ttBox")
//                 .attr("width", tooltipWidth);
//         })
//         .on("mousemove", function(d, i) {
//             var mouseX = d3.mouse(this)[0];

//             graphL.select("#mark")
//                 .attr("x1", mouseX).attr("x2", mouseX);

//             tooltipL.selectAll("text")
//                 .text(function(d) { return d(mouseX); });
//             var maxTextWidth = d3.max(tooltipL.selectAll("text").nodes(), function(d) {
//                 return d.getComputedTextLength();
//             });
//             var tooltipWidth = (isNaN(maxTextWidth) ? 0 : maxTextWidth + 16);

//             tooltip.select("#ttBox")
//                 .attr("width", tooltipWidth);
//         })
//         .on("mouseout", function(d, i) {
//             tooltip.selectAll("rect").remove();
//             tooltip.selectAll("text").remove();
//             chart.element.selectAll("#mark").style("opacity", 0);
//         });


// });

// var graphLOverlay = graphL.append("g")
//     .attr("transform", translate(10, 10));

// var graphROverlay = graphR.append("g")
//     .attr("transform", translate(10, 10));

// graphLOverlay.append("rect")
//     .attr("x", 0).attr("y", 0)
//     .attr("width", width).attr("height", height)
//     .style("opacity", 0);

// graphROverlay.append("rect")
//     .attr("x", 0).attr("y", 0)
//     .attr("width", width).attr("height", height)
//     .style("opacity", 0);

// var tooltipL = graphLOverlay.append("g")
//     .attr("id", "tooltipL")
//     .style("pointer-events", "none");

// var tooltipR = graphROverlay.append("g")
//     .attr("id", "tooltipR")
//     .style("pointer-events", "none");

// var tooltipScale = d3.scaleBand().range([10, 100]).domain([0, 1, 2, 3]).paddingOuter(0.5);

// var tooltipDataL = [
//     function(xCoord) {
//         var rawTime = xTime.invert(xCoord);
//         var minutes = rawTime.getMinutes();
//         var hours = rawTime.getHours();
//         var m = (parseInt((minutes + 7.5) / 15) * 15) % 60;
//         var h = minutes > 52 ? (hours === 23 ? 0 : hours + 1) : hours;
//         rawTime.setHours(h);
//         rawTime.setMinutes(m);
//         return d3.timeFormat("%-I:%M %p")(rawTime);
//     },
//     function(xCoord) {
//         var wait = Math.round(permData[Math.round(x.invert(xCoord))].STANDBY_Q_WAIT_AVG);
//         var count = Math.round(permData[Math.round(x.invert(xCoord))].STANDBY_Q_LENGTH_AVG);
//         return "Check-in Wait: {0} min (count: {1})".format(wait, count);
//     },
//     function(xCoord) {
//         var wait = Math.round(permData[Math.round(x.invert(xCoord))].VOTING_Q_WAIT_AVG);
//         var count = Math.round(permData[Math.round(x.invert(xCoord))].VOTING_Q_LENGTH_AVG);
//         return "Voting Wait: {0} min (count: {1})".format(wait, count);
//     },
//     function(xCoord) {
//         var cWait = Math.round(permData[Math.round(x.invert(xCoord))].STANDBY_Q_WAIT_AVG);
//         var vWait = Math.round(permData[Math.round(x.invert(xCoord))].VOTING_Q_WAIT_AVG);
//         var cCount = Math.round(permData[Math.round(x.invert(xCoord))].STANDBY_Q_LENGTH_AVG);
//         var vCount = Math.round(permData[Math.round(x.invert(xCoord))].VOTING_Q_LENGTH_AVG);
//         return "Total Wait: {0} min (count: {1})".format(cWait + vWait, cCount + vCount);
//     }
// ];

// var tooltipDataR = [
//     function(xCoord) {
//         var rawTime = xTime.invert(xCoord);
//         var minutes = rawTime.getMinutes();
//         var hours = rawTime.getHours();
//         var m = (Math.round(minutes / 15) * 15) % 60;
//         var h = minutes > 52 ? (hours === 23 ? 0 : hours + 1) : hours;
//         rawTime.setHours(h);
//         rawTime.setMinutes(m);
//         return d3.timeFormat("%-I:%M %p")(rawTime);
//     },
//     function(xCoord) {
//         var wait = Math.round(permData[Math.round(x.invert(xCoord))].FASTVOTE_VQ_WAIT_AVG);
//         var count = Math.round(permData[Math.round(x.invert(xCoord))].FASTVOTE_VQ_LENGTH_AVG);
//         return "Virtual Queue Wait: {0} min (count: {1})".format(wait, count);
//     },
//     function(xCoord) {
//         var wait = Math.round(permData[Math.round(x.invert(xCoord))].FASTVOTE_PQ_WAIT_AVG);
//         var count = Math.round(permData[Math.round(x.invert(xCoord))].FASTVOTE_PQ_LENGTH_AVG);
//         return "Physical Queue Wait: {0} min (count: {1})".format(wait, count);
//     },
//     function(xCoord) {
//         var vWait = Math.round(permData[Math.round(x.invert(xCoord))].FASTVOTE_VQ_WAIT_AVG);
//         var pWait = Math.round(permData[Math.round(x.invert(xCoord))].FASTVOTE_PQ_WAIT_AVG);
//         var vCount = Math.round(permData[Math.round(x.invert(xCoord))].STANDBY_Q_LENGTH_AVG);
//         var pCount = Math.round(permData[Math.round(x.invert(xCoord))].STANDBY_Q_LENGTH_AVG);
//         return "Total Wait: {0} min (count: {1})".format(vWait + pWait, vCount + pCount);
//     }
// ];

// graphLOverlay.on("mouseover", function(d, i) {
//         var mouseX = d3.mouse(this)[0];

//         graphL.select("#mark")
//             .style("opacity", 0.7)
//             .attr("x1", mouseX).attr("x2", mouseX)
//             .attr("y1", 0).attr("y2", height);

//         tooltipL.append("rect")
//             .attr("id", "ttBox")
//             .attr("class", "legend-box")
//             .attr("x", 0).attr("y", 0)
//             .attr("rx", 10).attr("ry", 10)
//             .attr("height", tooltipScale.range()[1] - tooltipScale.range()[0] - 6);


//         tooltipL.selectAll("text").data(tooltipDataL)
//             .enter().append("text")
//             .attr("x", 8).attr("y", function(d, i) { return tooltipScale(i); })
//             .style("font-weight", function(d, i) { return (i == 0) ? "bold" : "normal"; })
//             .text(function(d) { return d(mouseX); });

//         var maxTextWidth = d3.max(tooltipL.selectAll("text").nodes(), function(d) {
//             return d.getComputedTextLength();
//         });
//         var tooltipWidth = (isNaN(maxTextWidth) ? 0 : maxTextWidth + 16);

//         tooltipL.select("#ttBox")
//             .attr("width", tooltipWidth);
//     })
//     .on("mousemove", function(d, i) {
//         var mouseX = d3.mouse(this)[0];

//         graphL.select("#mark")
//             .attr("x1", mouseX).attr("x2", mouseX);

//         tooltipL.selectAll("text")
//             .text(function(d) { return d(mouseX); });
//         var maxTextWidth = d3.max(tooltipL.selectAll("text").nodes(), function(d) {
//             return d.getComputedTextLength();
//         });
//         var tooltipWidth = (isNaN(maxTextWidth) ? 0 : maxTextWidth + 16);

//         tooltipL.select("#ttBox")
//             .attr("width", tooltipWidth);
//     })
//     .on("mouseout", function(d, i) {
//         tooltipL.selectAll("rect").remove();
//         tooltipL.selectAll("text").remove();
//         graphL.selectAll("#mark").style("opacity", 0);
//     });

// graphROverlay.on("mouseover", function(d, i) {
//         var mouseX = d3.mouse(this)[0];

//         graphR.select("#mark")
//             .style("opacity", 0.7)
//             .attr("x1", mouseX).attr("x2", mouseX)
//             .attr("y1", 0).attr("y2", height);

//         tooltipR.append("rect")
//             .attr("id", "ttBox")
//             .attr("class", "legend-box")
//             .attr("x", 0).attr("y", 0)
//             .attr("rx", 10).attr("ry", 10)
//             .attr("height", tooltipScale.range()[1] - tooltipScale.range()[0] - 6);


//         tooltipR.selectAll("text").data(tooltipDataR)
//             .enter().append("text")
//             .attr("x", 8).attr("y", function(d, i) { return tooltipScale(i); })
//             .style("font-weight", function(d, i) { return (i == 0) ? "bold" : "normal"; })
//             .text(function(d) { return d(mouseX); });

//         var maxTextWidth = d3.max(tooltipR.selectAll("text").nodes(), function(d) {
//             return d.getComputedTextLength();
//         });
//         var tooltipWidth = (isNaN(maxTextWidth) ? 0 : maxTextWidth + 16);

//         tooltipR.select("#ttBox")
//             .attr("width", tooltipWidth);
//     })
//     .on("mousemove", function(d, i) {
//         var mouseX = d3.mouse(this)[0];

//         graphR.select("#mark")
//             .attr("x1", mouseX).attr("x2", mouseX);

//         tooltipR.selectAll("text")
//             .text(function(d) { return d(mouseX); });
//         var maxTextWidth = d3.max(tooltipR.selectAll("text").nodes(), function(d) {
//             return d.getComputedTextLength();
//         });
//         var tooltipWidth = (isNaN(maxTextWidth) ? 0 : maxTextWidth + 16);

//         tooltipR.select("#ttBox")
//             .attr("width", tooltipWidth);
//     })
//     .on("mouseout", function(d, i) {
//         tooltipR.selectAll("rect").remove();
//         tooltipR.selectAll("text").remove();
//         graphR.selectAll("#mark").style("opacity", 0);
//     });