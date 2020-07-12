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

function Series(data, xScale, xArg, yScale, yArg, color, defined = (d => true)) {
    this.data = data;
    this.xScale = xScale;
    this.xArg = xArg;
    this.yScale = yScale;
    this.yArg = yArg;
    this.color = color;
    this.defined = defined;

    this.x = (d, i) => this.xScale(this.xArg(d, i));
    this.y = (d, i) => this.yScale(this.yArg(d, i));
}

function Chart(xAxis, yAxis, xGrid, yGrid, series, chartTitle, dim = { width: chartWidth, height: chartHeight }) {
    this.xAxis = xAxis;
    this.yAxis = yAxis;
    this.xGrid = xGrid;
    this.yGrid = yGrid;
    this.series = series;
    this.chartTitle = chartTitle;
    this.dim = dim;

    this.plot = function(element) {
        // Draw gridlines
        element.append("g")
            .attr("class", "grid")
            .attr("transform", translate(0, this.dim.height))
            .call(this.xGrid()
                .tickSize(-this.dim.height)
                .tickFormat(""));

        element.append("g")
            .attr("class", "grid")
            .call(this.yGrid
                .tickSize(-this.dim.width)
                .tickFormat(""));

        // Draw axes
        element.append("g")
            .attr("class", "x-axis")
            .attr("transform", translate(0, this.dim.height))
            .call(this.xAxis);
        element.append("g")
            .attr("class", "y-axis")
            .call(this.yAxis);

        // Draw chart title
        element.append("g")
            .attr("transform", translate(this.dim.width / 2, -15))
            .append("text")
            .attr("text-anchor", "middle")
            .attr("class", "title")
            .text(this.chartTitle);

        // Draw series
        series.forEach(function(s) {
            element.append("path")
                .datum(s.data)
                .attr("fill", "none")
                .attr("stroke", s.color)
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .defined(s.defined)
                    .x(s.x)
                    .y(s.y)
                );
        });

        this.element = element;
    }
}