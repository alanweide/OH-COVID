d3.selection.prototype.moveToFront = function() {
    return this.each(function() {
        this.parentNode.appendChild(this);
    });
};

function arrayFromRange(start, end) {
    var list = [];
    for (var i = start; i < end; i++) {
        list.push(i);
    }
    return list;
}

function dataFileFromDate(date) {
    return `data/${date.toDateOnlyString()}.csv`
}

function translate(x, y) {
    return "translate(" + x + "," + y + ")";
}

function rotate(deg) {
    return "rotate(" + deg + ")";
}

function fileExists(url) {
    var http = new XMLHttpRequest();
    http.open('HEAD', url, false);
    http.send();
    return http.status != 404;
}

function isValidDate(d) {
    if (Object.prototype.toString.call(d) === "[object Date]") {
        // it is a date
        if (isNaN(d.getTime())) { // d.valueOf() could also work
            return false;
        } else {
            return true;
        }
    } else {
        return false;
    }
}

Date.prototype.toDateOnlyString = function() {
    return this.toISOString().split('T')[0];
}

function movingAverage(values, N) {
    let i = 0;
    let sum = 0;
    const means = new Float64Array(values.length).fill(NaN);
    for (let n = Math.min(N - 1, values.length); i < n; ++i) {
        sum += values[i];
    }
    for (let n = values.length; i < n; ++i) {
        sum += values[i];
        means[i] = sum / N;
        sum -= values[i - N + 1];
    }
    return means;
}

function updateCountyCases(daily, datum) {
    if (!(datum.county in daily.counties)) {
        daily.counties[datum.county] = new DailyCumPair();
    }
    daily.counties[datum.county].daily.cases += datum.caseCount;
}

function udpateCountyDeaths(daily, datum) {
    if (!(datum.county in daily.counties)) {
        daily.counties[datum.county] = new DailyCumPair();
    }
    daily.counties[datum.county].daily.deaths += datum.deathCount;
}

const chartedCounties = ["Franklin", "Cuyahoga", "Knox", "Morrow", "Lucas"];


function getDailyData(data) {
    var dailyData = new Object();
    data.forEach(function(d) {
        var datum = {
            county: d["County"],
            onset: new Date(d["Onset Date"]),
            deathDate: new Date(d["Date Of Death"]),
            caseCount: +d["Case Count"],
            deathCount: +d["Death Count"]
        };
        if (isValidDate(datum.onset)) {
            if (!(datum.onset in dailyData)) {
                dailyData[datum.onset] = new DateStat(datum.onset);
            }
            dailyData[datum.onset].statewide.daily.cases += datum.caseCount;
            updateCountyCases(dailyData[datum.onset], datum);
        }
        if (isValidDate(datum.deathDate)) {
            if (!(datum.deathDate in dailyData)) {
                dailyData[datum.deathDate] = new DateStat(datum.deathDate);
            }
            dailyData[datum.deathDate].statewide.daily.deaths += datum.deathCount;
            udpateCountyDeaths(dailyData[datum.onset], datum);
        }
    });
    return dailyData;
}

function collectData(d, today) {
    var data = [];
    var date = today;
    while (date in d) {
        // d[date].date = new Date(date);
        data.push(d[date]);
        date.setDate(date.getDate() - 1);
    }
    var cumulative = new CaseDeathPair();
    var cumCounties = {};
    data = data.reverse();
    data.forEach(function(datum, i) {
        cumulative.cases += datum.statewide.daily.cases;
        cumulative.deaths += datum.statewide.daily.deaths;
        datum.cumulative = new CaseDeathPair(cumulative.cases, cumulative.deaths);
        for (var county in datum.counties) {
            if (!(county in cumCounties)) {
                cumCounties[county] = new CaseDeathPair();
            }
            cumCounties[county].cases += datum.counties[county].daily.cases;
            cumCounties[county].deaths += datum.counties[county].daily.deaths;
            datum.counties[county].cumulative = new CaseDeathPair(cumCounties[county].cases, cumCounties[county].deaths);
        }
    });
    return data;
}

function getDataAndDrawCharts(endingDate) {
    d3.select("#subtitle").text("Date: " + endingDate.toDateOnlyString());

    d3.csv(dataFileFromDate(endingDate)).then(data => {
        var dailyData = getDailyData(data);
        var cleanData = collectData(dailyData, endingDate);

        // Set the scales
        var xScale = d3.scaleTime()
            .domain(d3.extent(cleanData, d => d.date))
            .range([0, chartWidth]);
        var yScaleCases = d3.scaleLinear()
            .domain([0, d3.max(cleanData, d => +d.statewide.daily.cases)]).nice()
            .range([chartHeight, 0]);
        var yScaleDeaths = d3.scaleLinear()
            .domain([0, d3.max(cleanData, d => +d.statewide.daily.deaths)]).nice()
            .range([chartHeight, 0]);

        function countyYScaleCases(county) {
            return d3.scaleLinear()
                .domain([0, d3.max(cleanData, d => {
                    if (!(county in d.counties)) {
                        return 0;
                    }
                    return d.counties[county].daily.cases
                })]).nice()
                .range([chartHeight, 0]);
        }

        // Nominal number of tick marks on y axis
        var yGrids = 10;

        // Define the axes
        var xAxis = d3.axisBottom().scale(xScale)
            .ticks(d3.timeMonth);

        var yAxisCases = d3.axisLeft().scale(yScaleCases);
        var yAxisDeaths = d3.axisLeft().scale(yScaleDeaths);

        //gridlines on x axis
        function make_x_gridlines() {
            return d3.axisBottom(xScale)
                .ticks(d3.timeDay);
        }

        // gridlines on y axis
        function make_y_gridlines(scale) {
            return d3.axisLeft(scale)
                .ticks(yGrids);
        }

        const stateCasesSeries = new Series(
            cleanData,
            xScale, d => d.date,
            yScaleCases, d => (d.statewide.daily.cases),
            "steelblue");
        const stateCasesAverage = new Series(
            movingAverage(cleanData.map(d => d.statewide.daily.cases), 7),
            // (d, i) => xScale(cleanData[i].date),
            xScale, (d, i) => cleanData[i].date,
            yScaleCases, d => (d),
            "green",
            d => !isNaN(d));
        const stateCasesChart = new Chart(
            xAxis,
            yAxisCases,
            make_x_gridlines,
            make_y_gridlines(yScaleCases), [stateCasesSeries, stateCasesAverage],
            "Daily Cases (Statewide)"
        );

        const chartedCounties = ["Franklin", "Cuyahoga", "Lucas"];
        const countyColors = ["red", "green", "blue"];
        const countyCharts = [];
        chartedCounties.forEach(function(county, i) {
            const countyCasesSeries = new Series(
                cleanData,
                // d => xScale(d.date),
                xScale, d => d.date,
                countyYScaleCases(county), d => (county in d.counties ? d.counties[county].daily.cases : 0),
                `dark${countyColors[i]}`,
            );
            const countyCasesAverage = new Series(
                movingAverage(cleanData.map(d => {
                    if (!(county in d.counties)) {
                        return 0;
                    }
                    return d.counties[county].daily.cases
                }), 7),
                // (d, i) => xScale(cleanData[i].date),
                xScale, (d, i) => cleanData[i].date,
                countyYScaleCases(county), d => (d),
                countyColors[i],
                d => !isNaN(d));
            const countyCasesChart = new Chart(
                xAxis,
                d3.axisLeft().scale(countyYScaleCases(county)),
                make_x_gridlines,
                make_y_gridlines(countyYScaleCases(county)), [countyCasesSeries, countyCasesAverage],
                `Daily Cases (${county} County)`
            );
            countyCharts.push(countyCasesChart);
        });

        const stateDeathsSeries = new Series(
            cleanData,
            xScale, d => d.date,
            yScaleDeaths, d => (d.statewide.daily.deaths),
            "#303030"
        );
        const stateDeathsAvg = new Series(
            movingAverage(cleanData.map(d => d.statewide.daily.deaths), 7),
            // (d, i) => xScale(cleanData[i].date),
            xScale, (d, i) => cleanData[i].date,
            yScaleDeaths, d => (d),
            "#A0A0A0",
            d => !isNaN(d)
        );
        const stateDeathsChart = new Chart(
            xAxis,
            yAxisDeaths,
            make_x_gridlines,
            make_y_gridlines(yScaleDeaths), [stateDeathsSeries, stateDeathsAvg],
            "Daily Deaths (Statewide)"
        );

        const charts = [stateCasesChart].concat(countyCharts).concat([stateDeathsChart]);

        numCharts = charts.length;
        svg.style("height", fullHeight);
        charts.forEach((d, i) => {
            var group = svg.append("g")
                .attr("id", `chart${i}`)
                .attr("transform", translate(margin.left, margin.top + i * (chartHeight + margin.middle)))
                .style("margin", 0);

            d.plot(group);
        });

        setupTooltips(charts, xScale);
    });
}

function setupTooltips(charts) {
    charts.forEach((chart, chartIdx) => {

        chart.element.append("line")
            .attr("id", "mark")
            .style("stroke", "black")
            .style("stroke-width", 1)
            .style("opacity", 0);

        var overlay = chart.element.append("g")
            .attr("id", `overlay${chartIdx}`)
            // .attr("transform", translate(10, 10));
        overlay.append("rect")
            .attr("x", 0).attr("y", 0)
            .attr("width", chart.dim.width).attr("height", chart.dim.height)
            .style("opacity", 0);

        var tooltip = overlay.append("g")
            .attr("id", `tooltip${chartIdx}`)
            .style("pointer-events", "none");

        let series0 = chart.series[0];
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

                return `${chart.chartTitle}: ${value}`;
            },
            function(xCoord) {
                var rawDate = series0.xScale.invert(xCoord);
                rawDate.setHours(rawDate.getHours() + 12);
                var roundDate = new Date(rawDate.toDateString());

                var startDate = series0.data[0].date;
                var startDateRound = new Date(startDate.toDateString());
                var timeDiff = roundDate.getTime() - startDateRound.getTime();
                var dayIdx = Math.round(timeDiff / (1000 * 60 * 60 * 24));

                var value = Math.round(chart.series[1].yArg(chart.series[1].data[dayIdx]));

                return `7-day Moving Average: ${!isNaN(value) ? value : 0}`;
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

                var circleX = chart.series[0].xScale(roundDate);
                var circleY = chart.series[0].yScale(chart.series[0].yArg(chart.series[0].data[dayIdx]))

                let coords = [typeof circleX === 'undefined' ? 0 : circleX, typeof circleY === 'undefined' ? chart.dim.height : circleY];
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

                var circleX = chart.series[1].xScale(roundDate);
                var circleY = chart.series[1].yScale(chart.series[1].yArg(chart.series[1].data[dayIdx]))

                let coords = [typeof circleX === 'undefined' ? 0 : circleX, typeof circleY === 'undefined' ? chart.dim.height : circleY];
                return coords;
            }
        ];

        var tooltipScale = d3.scaleBand().range([10, 100]).domain(arrayFromRange(0, tooltipData.length)).paddingOuter(0.5);

        var xForCenteredRect = function(mouseX, rectWidth, containerWidth, minPadding) {
            return Math.max(minPadding, Math.min(mouseX - (rectWidth / 2), containerWidth - minPadding - rectWidth));
        };

        const tranDur = 50;

        overlay.on("mouseover", function(d) {
                var mouseX = d3.mouse(this)[0];

                var markX = markLocs[0](mouseX)[0];

                chart.element.select("#mark")
                    .style("opacity", 0.7)
                    .attr("x1", markX).attr("x2", markX)
                    .attr("y1", 0).attr("y2", chart.dim.height);

                // overlay.select(`#tooltip${chartIdx}`).attr("x", mouseX);

                tooltip.append("rect")
                    .attr("id", "ttBox")
                    .attr("class", "legend-box")
                    // .attr("filter", "url(#blur)")
                    .attr("rx", 10).attr("ry", 10)
                    .attr("height", tooltipScale.range()[1] - tooltipScale.range()[0]);


                var ttText = tooltip.selectAll("text").data(tooltipData)
                    .enter().append("text")
                    .attr("y", (d, i) => tooltipScale(i) + 10)
                    .style("font-weight", (d, i) => (i == 0) ? "bold" : "normal")
                    .text(d => d(mouseX));

                var maxTextWidth = d3.max(ttText.nodes(), d => d.getComputedTextLength());
                var tooltipWidth = (isNaN(maxTextWidth) ? 0 : maxTextWidth + 16);

                // var tooltipX = Math.max(10, Math.min(mouseX - (tooltipWidth / 2), chart.dim.width - 10 - tooltipWidth));

                ttText.attr("x", xForCenteredRect(mouseX, tooltipWidth, chart.dim.width, 10) + 8);

                tooltip.select("#ttBox")
                    .attr("x", xForCenteredRect(mouseX, tooltipWidth, chart.dim.width, 10)).attr("y", 10)
                    .attr("width", tooltipWidth);

                var circles = chart.element.selectAll("circle").data(markLocs)
                    .enter().append("circle")

                circles
                    .attr("cx", function(d) { return d(mouseX)[0]; })
                    .attr("cy", function(d) {
                        return d(mouseX)[1];
                    })
                    .attr("r", (d, i) => i == 0 ? 4 : 6)
                    .style("fill", (d, i) => chart.series[i].color);
            })
            .on("mousemove", function(d, i) {
                var mouseX = d3.mouse(this)[0];

                var markX = markLocs[0](mouseX)[0];
                chart.element.select("#mark")
                    .transition().duration(tranDur)
                    .attr("x1", markX).attr("x2", markX);

                // overlay.select(`#tooltip${chartIdx}`).transition().duration(tranDur).attr("x", mouseX);
                var ttText = tooltip.selectAll("text")
                    .text(d => d(mouseX));

                var maxTextWidth = d3.max(ttText.nodes(), d => d.getComputedTextLength());
                var tooltipWidth = (isNaN(maxTextWidth) ? 0 : maxTextWidth + 16);

                // var tooltipX = Math.max(10, Math.min(mouseX - (tooltipWidth / 2), chart.dim.width - 10 - tooltipWidth));

                ttText
                    .transition().duration(tranDur)
                    .attr("x", xForCenteredRect(mouseX, tooltipWidth, chart.dim.width, 10) + 8);

                tooltip.select("#ttBox")
                    .transition().duration(tranDur)
                    .attr("x", xForCenteredRect(mouseX, tooltipWidth, chart.dim.width, 10))
                    .attr("width", tooltipWidth);

                var circles = chart.element.selectAll("circle")
                    .transition().duration(tranDur)
                    .attr("cx", function(d) { return d(mouseX)[0]; })
                    .attr("cy", function(d) {
                        return d(mouseX)[1];
                    })
            })
            .on("mouseout", function(d, i) {
                // tooltip.transition().attr("opacity", 0);
                tooltip.selectAll("rect").remove();
                tooltip.selectAll("text").remove();
                chart.element.selectAll("#mark").style("opacity", 0);
                chart.element.selectAll("circle").remove();
            });
    });
}