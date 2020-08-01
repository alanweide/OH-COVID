function DataPoint(cases = 0, hosps = 0, deaths = 0) {
    this.cases = cases;
    this.hospitalizations = hosps;
    this.deaths = deaths;
}

function DailyCumPair() {
    this.daily = new DataPoint();
    this.cumulative = new DataPoint();
}

function DateStat(date) {
    this.date = new Date(date);
    this.counties = new Object();
    this.statewide = new DailyCumPair();
    this.agedists = { "cases": new AgeStat("cases"), "hospitalizations": new AgeStat("hospitalizations"), "deaths": new AgeStat("deaths") };
}

function AgeStat(category) {
    this["category"] = category;
    this["Unknown"] = 0;
    this["0-19"] = 0;
    this["20-29"] = 0;
    this["30-39"] = 0;
    this["40-49"] = 0;
    this["50-59"] = 0;
    this["60-69"] = 0;
    this["70-79"] = 0;
    this["80+"] = 0;
    this["total"] = 0;
}

function Series(data, xScale, xArg, yScale, yArg, cum, color, name, defined = (d => true)) {
    this.data = data;
    this.xScale = xScale;
    this.xArg = xArg;
    this.yScale = yScale;
    this.yArg = yArg;
    this.cum = cum;
    this.color = color;
    this.name = name;
    this.defined = defined;

    this.x = (d, i) => this.xScale(this.xArg(d, i));
    this.y = (d, i) => this.yScale(this.yArg(d, i));
}

function Chart(xAxis, yAxis, xGrid, yGrid, series, chartTitle, dim = { width: columnWidths()[0], height: chartHeight }, ops = {}) {
    this.xAxis = xAxis;
    this.yAxis = yAxis;
    this.xGrid = xGrid;
    this.yGrid = yGrid;
    this.series = series;
    this.chartTitle = chartTitle;
    this.dim = dim;
    this.ops = ops;
    this.selection = null;

    this.plot = function(selection, chartIdx) {
        this.selection = selection;

        selection.selectAll("g").remove();
        selection.selectAll("text").remove();
        selection.selectAll("path").remove();

        // Draw gridlines
        var xGridSel = selection //.selectAll("#xGrid");
        xGridSel //.enter()
            .append("g") //.merge(xGridSel)
            .attr("id", "xGrid")
            .attr("class", "grid")
            .attr("transform", translate(0, this.dim.height))
            .call(this.xGrid()
                .tickSize(-this.dim.height)
                .tickFormat(""));

        var yGridSel = selection //.selectAll("#yGrid");
        yGridSel //.enter()
            .append("g") //.merge(yGridSel)
            .attr("id", "yGrid")
            .attr("class", "grid")
            .call(this.yGrid
                .tickSize(-this.dim.width)
                .tickFormat(""));

        // Draw axes
        var xAxisSel = selection //.selectAll(".x-axis");
        xAxisSel //.enter()
            .append("g") //.merge(xAxisSel)
            .attr("class", "x-axis")
            .attr("transform", translate(0, this.dim.height))
            .call(this.xAxis);
        var yAxisSel = selection //.selectAll(".y-axis");
        yAxisSel //.enter()
            .append("g").merge(yAxisSel)
            .attr("class", "y-axis")
            .call(this.yAxis);

        // Draw chart title
        var titleSel = selection // .selectAll(".title");
        titleSel //.enter()
            .append("text") //.merge(titleSel)
            .attr("transform", translate(this.dim.width / 2, -15))
            // .attr("x", "50%").attr("y", "-15")
            .attr("text-anchor", "middle")
            .attr("class", "title")
            .text(this.chartTitle);

        // Draw series

        var stacks;
        if (ops.stacked) {
            // Nest the data
            var combinedSeries = [];
            for (let i = 0; i < series[0].data.length; i++) {
                combinedSeries.push([]);
            }
            combinedSeries.forEach((r, i) => {
                series.forEach(s => r.push(s.yArg(s.data[i], i)))
            });
            var stackLayout = d3.stack().keys(Array.from(ops.stackKeys.keys())).value(((d, k) => d[k]));
            stacks = stackLayout(combinedSeries);
        }

        series.forEach(function(s, i) {
            if (ops.stacked) {
                if (ops.filled) {
                    selection.selectAll("#area")
                        .data(stacks)
                        .enter()
                        .append("path")
                        .attr("id", "area")
                        // .attr("id", (d, i) => `series${i}`)
                        .attr("fill", (d, i) => series[i].color)
                        .attr("stroke", (d, i) => series[i].color)
                        // .attr("stroke-width", 1.5)
                        .attr("data-legend", (d, i) => series[i].name)
                        .attr("d", d3.area()
                            .defined(s.defined)
                            .x(s.x)
                            .y0(d => s.yScale(d[0]))
                            .y1(d => s.yScale(d[1]))
                        );
                } else {
                    selection.selectAll("#line")
                        .data(stacks)
                        .enter()
                        .append("path")
                        .attr("id", "line")
                        // .attr("id", (d, i) => `series${i}`)
                        .attr("fill", "none")
                        .attr("stroke", s.color)
                        .attr("stroke-width", 1.5)
                        .attr("data-legend", s.name)
                        .attr("d", d3.line()
                            .defined(s.defined)
                            .x(s.x)
                            .y(d => s.yScale(d[0]))
                        );
                }
            } else {
                if (ops.filled) {
                    selection.append("path")
                        .datum(s.data)
                        // .attr("id", (d, i) => `series${i}`)
                        .attr("fill", s.color)
                        // .attr("stroke", s.color)
                        // .attr("stroke-width", 1.5)
                        .attr("data-legend", s.name)
                        .attr("d", d3.area()
                            .defined(s.defined)
                            .x(s.x)
                            .y0(d => s.yScale(0))
                            .y1(s.y)
                        );
                } else {
                    selection.append("path")
                        .datum(s.data)
                        // .attr("id", (d, i) => `series${i}`)
                        .attr("fill", "none")
                        .attr("stroke", s.color)
                        .attr("stroke-width", 1.5)
                        .attr("data-legend", s.name)
                        .attr("d", d3.line()
                            .defined(s.defined)
                            .x(s.x)
                            .y(s.y)
                        );
                }
            }
        });

        if (ops.withTooltip) {
            selection.append("line")
                .attr("id", "mark")
                .style("stroke", "black")
                .style("stroke-width", 1)
                .style("opacity", 0);

            var overlay = selection.append("g")
                .attr("id", "overlay");
            overlay.append("rect")
                .attr("x", 0).attr("y", 0)
                .attr("width", dim.width).attr("height", dim.height)
                .style("opacity", 0);

            var tooltip = overlay.append("g")
                .attr("id", "tooltip")
                .style("pointer-events", "none");

            let series0 = series[0];
            var tooltipData = [
                function(xCoord) {
                    var rawDate = series0.xScale.invert(xCoord);
                    rawDate.setHours(rawDate.getHours() + 12);
                    var roundDate = new Date(rawDate.toDateString());

                    return `Selected Date: ${roundDate.toDateString()}`;
                },
                function(xCoord) {
                    var rawDate = series0.xScale.invert(xCoord);
                    rawDate.setHours(rawDate.getHours() + 12);
                    var roundDate = new Date(rawDate.toDateString());

                    var startDate = series0.data[0].date;
                    var startDateRound = new Date(startDate.toDateString());
                    var timeDiff = roundDate.getTime() - startDateRound.getTime();
                    var dayIdx = Math.round(timeDiff / (1000 * 60 * 60 * 24));

                    var value = series0.yArg(series0.data[dayIdx]);

                    return `${chartTitle}: ${value}`;
                },
                function(xCoord) {
                    var rawDate = series0.xScale.invert(xCoord);
                    rawDate.setHours(rawDate.getHours() + 12);
                    var roundDate = new Date(rawDate.toDateString());

                    var startDate = series0.data[0].date;
                    var startDateRound = new Date(startDate.toDateString());
                    var timeDiff = roundDate.getTime() - startDateRound.getTime();
                    var dayIdx = Math.round(timeDiff / (1000 * 60 * 60 * 24));

                    var value = Math.round(series[1].yArg(series[1].data[dayIdx]));

                    return `7-day Moving Average: ${!isNaN(value) ? value : 0}`;
                },
                function(xCoord) {
                    var rawDate = series0.xScale.invert(xCoord);
                    rawDate.setHours(rawDate.getHours() + 12);
                    var roundDate = new Date(rawDate.toDateString());

                    var startDate = series0.data[0].date;
                    var startDateRound = new Date(startDate.toDateString());
                    var timeDiff = roundDate.getTime() - startDateRound.getTime();
                    var dayIdx = Math.round(timeDiff / (1000 * 60 * 60 * 24));

                    var value = series[0]
                        .cum(series[0].data[dayIdx]);

                    return `Cumulative Value: ${!isNaN(value) ? value : 0}`;
                }
            ];

            var markLocs = [
                xCoord => {
                    var rawDate = series0.xScale.invert(xCoord);
                    rawDate.setHours(rawDate.getHours() + 12);
                    var roundDate = new Date(rawDate.toDateString());

                    var startDate = series0.data[0].date;
                    var startDateRound = new Date(startDate.toDateString());
                    var timeDiff = roundDate.getTime() - startDateRound.getTime();
                    var dayIdx = Math.round(timeDiff / (1000 * 60 * 60 * 24));

                    var circleX = series[0].xScale(roundDate);
                    var circleY = series[0].yScale(series[0].yArg(series[0].data[dayIdx]))

                    let coords = [typeof circleX === 'undefined' ? 0 : circleX, typeof circleY === 'undefined' ? dim.height : circleY];
                    return coords;
                },
                xCoord => {
                    var rawDate = series0.xScale.invert(xCoord);
                    rawDate.setHours(rawDate.getHours() + 12);
                    var roundDate = new Date(rawDate.toDateString());

                    var startDate = series0.data[0].date;
                    var startDateRound = new Date(startDate.toDateString());
                    var timeDiff = roundDate.getTime() - startDateRound.getTime();
                    var dayIdx = Math.round(timeDiff / (1000 * 60 * 60 * 24));

                    var circleX = series[1].xScale(roundDate);
                    var circleY = series[1].yScale(series[1].yArg(series[1].data[dayIdx]))

                    let coords = [typeof circleX === 'undefined' ? 0 : circleX, typeof circleY === 'undefined' ? dim.height : circleY];
                    return coords;
                }
            ];

            var tooltipScale = d3.scaleBand().range([10, 100]).domain(arrayFromRange(0, tooltipData.length)).paddingOuter(0.25).align(0.5);

            var xForCenteredRect = function(mouseX, rectWidth, containerWidth, minPadding) {
                return Math.max(minPadding, Math.min(mouseX - (rectWidth / 2), containerWidth - minPadding - rectWidth));
            };

            const tranDur = 50;

            overlay.on("mouseover", function(d) {
                    var mouseX = d3.mouse(this)[0];

                    var markX = markLocs[0](mouseX)[0];

                    var circles = selection.selectAll("circle").data(markLocs)
                        .enter().append("circle");

                    selection.select("#mark")
                        .style("opacity", 0.7)
                        .attr("x1", markX).attr("x2", markX)
                        .attr("y1", 0).attr("y2", dim.height);

                    // overlay.select(`#tooltip${chartIdx}`).attr("x", mouseX);

                    tooltip.append("rect")
                        .attr("id", "ttBox")
                        .attr("class", "legend-box")
                        .attr("rx", 10).attr("ry", 10)
                        .attr("y", tooltipScale.range()[0]).attr("height", tooltipScale.range()[1] - tooltipScale.range()[0]);


                    var ttText = tooltip.selectAll("text").data(tooltipData)
                        .enter().append("text")
                        .attr("y", (d, i) => tooltipScale(i) + (tooltipScale.bandwidth() / 2))
                        .attr("alignment-baseline", "middle")
                        .style("font-weight", (d, i) => (i == 0) ? "bold" : "normal")
                        .text(d => d(mouseX));

                    var maxTextWidth = d3.max(ttText.nodes(), d => d.getComputedTextLength());
                    var tooltipWidth = (isNaN(maxTextWidth) ? 0 : maxTextWidth + 16);

                    // var tooltipX = Math.max(10, Math.min(mouseX - (tooltipWidth / 2), chart.dim.width - 10 - tooltipWidth));

                    circles
                        .attr("cx", function(d) { return d(mouseX)[0]; })
                        .attr("cy", function(d) {
                            return d(mouseX)[1];
                        })
                        .attr("r", (d, i) => i == 0 ? 4 : 6)
                        .style("fill", (d, i) => series[i].color);

                    ttText.attr("x", xForCenteredRect(mouseX, tooltipWidth, dim.width, 10) + 8);

                    tooltip.select("#ttBox")
                        .attr("x", xForCenteredRect(mouseX, tooltipWidth, dim.width, 10))
                        .attr("width", tooltipWidth);

                })
                .on("mousemove", function(d, i) {
                    var mouseX = d3.mouse(this)[0];

                    var markX = markLocs[0](mouseX)[0];

                    selection.select("#mark")
                        .transition().duration(tranDur)
                        .attr("x1", markX).attr("x2", markX);

                    // overlay.select(`#tooltip${chartIdx}`).transition().duration(tranDur).attr("x", mouseX);
                    var ttText = tooltip.selectAll("text")
                        .text(d => d(mouseX));

                    var maxTextWidth = d3.max(ttText.nodes(), d => d.getComputedTextLength());
                    var tooltipWidth = (isNaN(maxTextWidth) ? 0 : maxTextWidth + 16);

                    // var tooltipX = Math.max(10, Math.min(mouseX - (tooltipWidth / 2), chart.dim.width - 10 - tooltipWidth));

                    selection.selectAll("circle")
                        .transition().duration(tranDur)
                        .attr("cx", function(d) { return d(mouseX)[0]; })
                        .attr("cy", function(d) {
                            return d(mouseX)[1];
                        });

                    ttText
                        .transition().duration(tranDur)
                        .attr("x", xForCenteredRect(mouseX, tooltipWidth, dim.width, 10) + 8);

                    tooltip.select("#ttBox")
                        .transition().duration(tranDur)
                        .attr("x", xForCenteredRect(mouseX, tooltipWidth, dim.width, 10))
                        .attr("width", tooltipWidth);
                })
                .on("mouseout", function(d, i) {
                    // tooltip.transition().attr("opacity", 0);
                    tooltip.selectAll("rect").remove();
                    tooltip.selectAll("text").remove();
                    selection.selectAll("#mark").style("opacity", 0);
                    selection.selectAll("circle").remove();
                });
        }

        if (ops.legend) {
            console.log(`Drawing legend for ${chartTitle}`)

            const legendData = series.map((d, i) => { return { "name": d.name, "color": d.color } })
            legendData.pop();
            const legendScale = d3.scaleBand().range([dim.height / 2, 0]).domain(arrayFromRange(0, legendData.length)).paddingOuter(0.25) //.align(0.5);

            var legend = selection.append("g").attr("id", "legend").attr("transform", translate(10, 10));
            var box = legend.append("rect")
                .attr("id", "legendBox")
                .attr("class", "legend-box")
                .attr("rx", 10).attr("ry", 10)
                .attr("height", dim.height / 2);

            var legItems = legend.selectAll("#legItem").data(legendData)
                .enter().append("g")
                .attr("transform", (d, i) => translate(8, legendScale(i) + (legendScale.bandwidth() / 2)));

            let legRects = legItems.append("rect")
                .attr("width", 8).attr("height", 8)
                .attr("y", -4)
                .attr("stroke", "black")
                .attr("fill", d => d.color);
            let legText = legItems.append("text")
                .attr("x", 16) //.attr("y", 4)
                .attr("alignment-baseline", "middle")
                // .style("font-weight", (d, i) => (i == 0) ? "bold" : "normal")
                .text(d => d.name)

            var maxTextWidth = d3.max(legText.nodes(), d => d.getComputedTextLength());
            var legendWidth = (isNaN(maxTextWidth) ? 0 : maxTextWidth + 36);
            box.attr("width", legendWidth);
        }
    }
}