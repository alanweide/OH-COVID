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
                        .attr("d", d3.line()
                            .defined(s.defined)
                            .x(s.x)
                            .y(s.y)
                        );
                }
            }
        });

        if (ops.withTooltip) {
            setupTooltips(this, chartIdx);
        }

        if (ops.legend) {
            console.log(`Drawing legend for ${chartTitle}`)
        }
    }
}