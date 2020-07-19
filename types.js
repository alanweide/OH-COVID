function CaseDeathPair(cases = 0, deaths = 0) {
    this.cases = cases;
    this.deaths = deaths;
}

function DailyCumPair() {
    this.daily = new CaseDeathPair();
    this.cumulative = new CaseDeathPair();
}

function DateStat(date) {
    this.date = new Date(date);
    this.counties = new Object();
    this.statewide = new DailyCumPair();
}

function Series(data, xScale, xArg, yScale, yArg, cum, color, defined = (d => true)) {
    this.data = data;
    this.xScale = xScale;
    this.xArg = xArg;
    this.yScale = yScale;
    this.yArg = yArg;
    this.cum = cum;
    this.color = color;
    this.defined = defined;

    this.x = (d, i) => this.xScale(this.xArg(d, i));
    this.y = (d, i) => this.yScale(this.yArg(d, i));
}

function Chart(xAxis, yAxis, xGrid, yGrid, series, chartTitle, dim = { width: columnWidths()[0], height: chartHeight }) {
    this.xAxis = xAxis;
    this.yAxis = yAxis;
    this.xGrid = xGrid;
    this.yGrid = yGrid;
    this.series = series;
    this.chartTitle = chartTitle;
    this.dim = dim;
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

        series.forEach(function(s, i) {
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
        });

        setupTooltips(this, chartIdx);
    }
}