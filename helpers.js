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

function colorLuminance(hex, lum) {
    // validate hex string
    hex = String(hex).replace(/[^0-9a-f]/gi, '');
    if (hex.length < 6) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    lum = lum || 0;

    // convert to decimal and change luminosity
    var rgb = "#";
    for (var i = 0; i < 3; i++) {
        var c = parseInt(hex.substr(i * 2, 2), 16);
        c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
        rgb += ("00" + c).substr(c.length);
    }

    return rgb;
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

const chartedCounties = new Set(); //["Franklin", "Cuyahoga", "Lucas", "Knox", "Morrow"];
var countyColors = {};
var affectedCounties = new Set();

function generateCheckboxes(selection) {
    /*
    <div>
        <input type="checkbox" id="county" name="county">
        <label for="county">county</label>
    </div>
     */
    cbDiv = selection.enter().append("li").append("div")
    checkbox = cbDiv.append("input")
        .attr("type", "checkbox").attr("name", d => d).attr("value", d => d).attr("id", d => d);
    cbDiv.append("label").attr("for", d => d).text(d => d);

    checkbox.on("change", d => {
        if (d3.select(`#${d}`).property("checked")) {
            chartedCounties.add(d);
        } else {
            chartedCounties.delete(d);
        }
        // updateCharts(generateCharts(Array.from(chartedCounties.values())));
        updateCharts(generateCharts(chartedCounties));
    })
}

function addCounty(county) {
    affectedCounties.add(county);
    // d3.select("#counties")
    //     .selectAll("li").data(Array.from(affectedCounties.values()))
    //     .call(generateCheckboxes);
}

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
        // affectedCounties.add(datum.county);
        addCounty(datum.county);
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

var dailyData;
var cleanData;

function drawCharts(data, date) {
    dailyData = getDailyData(data);
    cleanData = collectData(dailyData, date);

    d3.select("#counties")
        .selectAll("li").data(Array.from(affectedCounties.values()))
        .call(generateCheckboxes);

    var charts = generateCharts(chartedCounties);
    updateCharts(charts);
}

function generateCharts(chartedCounties) {

    // Set the scales
    var xScale = d3.scaleTime()
        .domain(d3.extent(cleanData, d => d.date))
        .range([0, chartWidth()]);
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
    var firstFifteenth = d3.timeDay.filter(d => (d.getDate() === 1 || d.getDate() === 16));
    var xAxis = d3.axisBottom().scale(xScale)
        .ticks(firstFifteenth)
        // .ticks(d3.timeWeek);
        .tickFormat(d3.timeFormat("%b %d, %Y"));

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

    const countyCharts = [];
    var sortedCounties = Array.from(chartedCounties.values()).sort();
    sortedCounties.forEach(function(county, i) {
        var color = (county in countyColors) ? countyColors[county] : randomColor();
        countyColors[county] = color;
        const countyCasesSeries = new Series(
            cleanData,
            xScale, d => d.date,
            countyYScaleCases(county), d => (county in d.counties ? d.counties[county].daily.cases : 0),
            d => (county in d.counties ? d.counties[county].cumulative.cases : 0),
            colorLuminance(color, -0.5),
        );
        const countyCasesAverage = new Series(
            movingAverage(cleanData.map(d => {
                if (!(county in d.counties)) {
                    return 0;
                }
                return d.counties[county].daily.cases
            }), 7),
            xScale, (d, i) => cleanData[i].date,
            countyYScaleCases(county), d => (d),
            x => 0,
            color,
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

    const stateCasesSeries = new Series(
        cleanData,
        xScale, d => d.date,
        yScaleCases, d => (d.statewide.daily.cases),
        d => d.cumulative.cases,
        "steelblue");
    const stateCasesAverage = new Series(
        movingAverage(cleanData.map(d => d.statewide.daily.cases), 7),
        xScale, (d, i) => cleanData[i].date,
        yScaleCases, d => (d),
        d => 0,
        "green",
        d => !isNaN(d));
    const stateCasesChart = new Chart(
        xAxis,
        yAxisCases,
        make_x_gridlines,
        make_y_gridlines(yScaleCases), [stateCasesSeries, stateCasesAverage],
        "Daily Cases (Statewide)"
    );

    const stateDeathsSeries = new Series(
        cleanData,
        xScale, d => d.date,
        yScaleDeaths, d => (d.statewide.daily.deaths),
        d => d.cumulative.deaths,
        "#303030"
    );
    const stateDeathsAvg = new Series(
        movingAverage(cleanData.map(d => d.statewide.daily.deaths), 7),
        // (d, i) => xScale(cleanData[i].date),
        xScale, (d, i) => cleanData[i].date,
        yScaleDeaths, d => (d),
        d => 0,
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

    return [stateCasesChart].concat(countyCharts).concat([stateDeathsChart]);
}

function updateCharts(charts) {
    numCharts = charts.length;
    svg.style("height", fullHeight);
    chartsSel = svg.selectAll("#chart").data(charts) //.remove();

    chartsSel.enter().append("g")
        .merge(chartsSel)
        .attr("id", "chart")
        .attr("transform", (d, i) => translate(margin.left, margin.top + i * (chartHeight + margin.middle)))
        .style("margin", 0)
        .each(function(d, i) {
            d.plot(d3.select(this), i);
        })
        .exit().remove();
}

function getDataAndDrawCharts(endingDate) {
    d3.select("#subtitle").text("Date: " + endingDate.toDateOnlyString());

    d3.csv(dataFileFromDate(endingDate)).then(d => {
        // Remove footer row with total counts
        d.pop();
        return drawCharts(d, endingDate);
    });
}

function setupTooltips(chart, chartIdx) {
    chart.selection.append("line")
        .attr("id", "mark")
        .style("stroke", "black")
        .style("stroke-width", 1)
        .style("opacity", 0);

    var overlay = chart.selection.append("g")
        .attr("id", "overlay")
    overlay.append("rect")
        .attr("x", 0).attr("y", 0)
        .attr("width", chart.dim.width).attr("height", chart.dim.height)
        .style("opacity", 0);

    var tooltip = overlay.append("g")
        .attr("id", "tooltip")
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
        },
        function(xCoord) {
            var rawDate = series0.xScale.invert(xCoord);
            rawDate.setHours(rawDate.getHours() + 12);
            var roundDate = new Date(rawDate.toDateString());

            var startDate = series0.data[0].date;
            var startDateRound = new Date(startDate.toDateString());
            var timeDiff = roundDate.getTime() - startDateRound.getTime();
            var dayIdx = Math.round(timeDiff / (1000 * 60 * 60 * 24));

            var value = chart.series[0]
                .cum(chart.series[0].data[dayIdx]);

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

    var tooltipScale = d3.scaleBand().range([10, 100]).domain(arrayFromRange(0, tooltipData.length)).paddingOuter(0.25).align(0.5);

    var xForCenteredRect = function(mouseX, rectWidth, containerWidth, minPadding) {
        return Math.max(minPadding, Math.min(mouseX - (rectWidth / 2), containerWidth - minPadding - rectWidth));
    };

    const tranDur = 50;

    overlay.on("mouseover", function(d) {
            var mouseX = d3.mouse(this)[0];

            var markX = markLocs[0](mouseX)[0];

            chart.selection.select("#mark")
                .style("opacity", 0.7)
                .attr("x1", markX).attr("x2", markX)
                .attr("y1", 0).attr("y2", chart.dim.height);

            var circles = chart.selection.selectAll("circle").data(markLocs)
                .enter().append("circle");

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

            ttText.attr("x", xForCenteredRect(mouseX, tooltipWidth, chart.dim.width, 10) + 8);

            tooltip.select("#ttBox")
                .attr("x", xForCenteredRect(mouseX, tooltipWidth, chart.dim.width, 10))
                .attr("width", tooltipWidth);

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
            chart.selection.select("#mark")
                .transition().duration(tranDur)
                .attr("x1", markX).attr("x2", markX);

            // overlay.select(`#tooltip${chartIdx}`).transition().duration(tranDur).attr("x", mouseX);
            var ttText = tooltip.selectAll("text")
                .text(d => d(mouseX));

            var maxTextWidth = d3.max(ttText.nodes(), d => d.getComputedTextLength());
            var tooltipWidth = (isNaN(maxTextWidth) ? 0 : maxTextWidth + 16);

            // var tooltipX = Math.max(10, Math.min(mouseX - (tooltipWidth / 2), chart.dim.width - 10 - tooltipWidth));

            var circles = chart.selection.selectAll("circle")
                .transition().duration(tranDur)
                .attr("cx", function(d) { return d(mouseX)[0]; })
                .attr("cy", function(d) {
                    return d(mouseX)[1];
                });

            ttText
                .transition().duration(tranDur)
                .attr("x", xForCenteredRect(mouseX, tooltipWidth, chart.dim.width, 10) + 8);

            tooltip.select("#ttBox")
                .transition().duration(tranDur)
                .attr("x", xForCenteredRect(mouseX, tooltipWidth, chart.dim.width, 10))
                .attr("width", tooltipWidth);
        })
        .on("mouseout", function(d, i) {
            // tooltip.transition().attr("opacity", 0);
            tooltip.selectAll("rect").remove();
            tooltip.selectAll("text").remove();
            chart.selection.selectAll("#mark").style("opacity", 0);
            chart.selection.selectAll("circle").remove();
        });
}