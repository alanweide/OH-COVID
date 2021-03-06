const milestones = [{
        "date": new Date("March 22, 2020"),
        "event": "Stay-at-Home Order Takes Effect"
    },
    {
        "date": new Date("April 15, 2020"),
        "event": "Anti-Lockdown Protests in Full Swing"
    },
    {
        "date": new Date("May 1, 2020"),
        "event": "Stay-at-Home Order Lifting Begins"
    },
    {
        "date": new Date("May 19, 2020"),
        "event": "Stay-at-Home Order Completely Lifted"
    },
    {
        "date": new Date("May 28, 2020"),
        "event": "BLM Protests Begin"
    },
    {
        "date": new Date("July 2, 2020"),
        "event": "Kings Island Opens"
    },
    {
        "date": new Date("July 7, 2020"),
        "event": "High-Alert County Mask Mandate"
    },
    {
        "date": new Date("July 9, 2020"),
        "event": "Cedar Point Opens"
    },
    {
        "date": new Date("July 23, 2020"),
        "event": "Statewide Mask Mandate"
    },
    {
        "date": new Date("August 12, 2020"),
        "event": "Ohio State Begins Move-in"
    },
    {
        "date": new Date("August 25, 2020"),
        "event": "Ohio State Begins Classes"
    },
    {
        "date": new Date("October 31, 2020"),
        "event": "Halloween"
    },
    {
        "date": new Date("November 3, 2020"),
        "event": "Election Day"
    },
    {
        "date": new Date("November 26, 2020"),
        "event": "Thanksgiving Day"
    },
    {
        "date": new Date("December 14, 2020"),
        "event": "First Ohio COVID-19 Vaccinations"
    },
    {
        "date": new Date("December 25, 2020"),
        "event": "Christmas Day"
    },
    {
        "date": new Date("January 1, 2021"),
        "event": "New Year's Day"
    },
    {
        "date": new Date("January 6, 2021"),
        "event": "US Capitol Riots"
    },
    {
        "date": new Date("January 20, 2021"),
        "event": "Joe Biden Inaugurated"
    },
    {
        "date": new Date("February 4, 2021"),
        "event": "1,000,000 Ohioan Vaccinations Started (52 days)"
    },
    {
        "date": new Date("March 6, 2021"),
        "event": "2,000,000 Ohioan Vaccinations Started (30 days)"
    }
];

const prelimDataDelay = 14;
const chartedDayCount = 100;
const firstChartedDay = new Date("January 1, 2020");

function updateCountyCases(daily, datum) {
    if (!(datum.county in daily.counties)) {
        daily.counties[datum.county] = new DailyCumPair();
    }
    daily.counties[datum.county].daily.cases += datum.caseCount;
}

function updateCountyHosps(daily, datum) {
    if (!(datum.daily in daily.counties)) {
        daily.counties[datum.county] = new DailyCumPair();
    }
    daily.counties[datum.county].daily.hospitalizations += datum.hospCount;
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

function getDailyData(data) {
    var dailyData = new Object();
    data.forEach(function(d) {
        var datum = {
            county: d["County"],
            age: d["Age Range"],
            onset: new Date(d["Onset Date"]),
            deathDate: new Date(d["Date Of Death"]),
            admissionDate: new Date(d["Admission Date"]),
            caseCount: +d["Case Count"],
            deathCount: +d["Death Due To Illness Count - County Of Death"],
            hospCount: +d["Hospitalized Count"]
        };
        affectedCounties.add(datum.county);

        // Cases
        if (isValidDate(datum.onset)) {
            if (!(datum.onset in dailyData)) {
                dailyData[datum.onset] = new DateStat(datum.onset);
            }
            dailyData[datum.onset].statewide.daily.cases += datum.caseCount;
            dailyData[datum.onset].agedists.cases[datum.age] += datum.caseCount;
            dailyData[datum.onset].agedists.cases.total += datum.caseCount;
            updateCountyCases(dailyData[datum.onset], datum);
        }

        // Hospitalizations
        // if (isValidDate(datum.admissionDate)) {
        //     if (!(datum.admissionDate in dailyData)) {
        //         dailyData[datum.admissionDate] = new DateStat(datum.admissionDate);
        //     }
        //     dailyData[datum.admissionDate].statewide.daily.hospitalizations += datum.hospCount;
        //     dailyData[datum.admissionDate].agedists.hospitalizations[datum.age] += datum.hospCount;
        //     dailyData[datum.admissionDate].agedists.hospitalizations.total += datum.hospCount;
        //     updateCountyHosps(dailyData[datum.admissionDate], datum);
        // }

        // Deaths
        if (isValidDate(datum.deathDate)) {
            if (!(datum.deathDate in dailyData)) {
                dailyData[datum.deathDate] = new DateStat(datum.deathDate);
            }
            dailyData[datum.deathDate].statewide.daily.deaths += datum.deathCount;
            dailyData[datum.deathDate].agedists.deaths[datum.age] += datum.deathCount;
            dailyData[datum.deathDate].agedists.deaths.total += datum.deathCount;
            udpateCountyDeaths(dailyData[datum.deathDate], datum);
        }
    });

    return dailyData;
}

function collectData(d, today) {
    var data = [];
    // var date = today;
    // while (date in d) {
    //     data.unshift(d[date]);
    //     date.setDate(date.getDate() - 1);
    // }
    let dates = Object.keys(d);
    dates.sort((a, b) => new Date(a) - new Date(b));
    let allDates = getDates(new Date(dates[0]), new Date(dates[dates.length - 1]))
    allDates.forEach((date) => {
        if (date in d) {
            data.push(d[date])
        } else {
            data.push(new DateStat(date));
        }
    })
    var cumulative = new DataPoint();
    var cumCounties = {};

    // Compute cumulative totals
    data.forEach((datum, i) => {
        cumulative.cases += datum.statewide.daily.cases;
        cumulative.hospitalizations += datum.statewide.daily.hospitalizations;
        cumulative.deaths += datum.statewide.daily.deaths;
        datum.cumulative = new DataPoint(cumulative.cases, cumulative.hospitalizations, cumulative.deaths);
        let iteratorVar = {...datum.counties, ...cumCounties};
        for (var county in iteratorVar) {
            if (!(county in cumCounties)) {
                cumCounties[county] = new DataPoint();
            } else if (!(county in datum.counties)) {
                datum.counties[county] = new DailyCumPair();
            }
            cumCounties[county].cases += datum.counties[county].daily.cases;
            cumCounties[county].hospitalizations += datum.counties[county].daily.hospitalizations;
            cumCounties[county].deaths += datum.counties[county].daily.deaths;
            datum.counties[county].cumulative = new DataPoint(cumCounties[county].cases, cumCounties[county].hospitalizations, cumCounties[county].deaths);
        }
    });
    return data;
}

var dailyData;
var cleanData;

function drawDailyCharts(data, date) {
    dailyData = getDailyData(data);
    cleanData = collectData(dailyData, date);

    d3.select("#counties")
        .selectAll("li").data(Array.from(affectedCounties.values()))
        .call(generateCheckboxes);

    var charts = generateCharts(chartedCounties);

    updateCharts(charts);
}

function domain(data) {
    let max = d3.extent(data, d => d.date)[1];
    let min = max.plusDays(-chartedDayCount);
    // let min = firstChartedDay;
    return [min, max];
}

function generateCharts(chartedCounties) {

    // Set the scales
    var xScale = d3.scaleTime()
        // .domain(d3.extent(cleanData, d => d.date))
        .domain(domain(cleanData)).clamp(true)
        .range([0, columnWidths()[0]]);
    var yScaleCases = d3.scaleLinear()
        .domain([0, d3.max(cleanData, d => +d.statewide.daily.cases)]).nice()
        .range([chartHeight, 0]);
    var yScaleDeaths = d3.scaleLinear()
        .domain([0, d3.max(cleanData, d => +d.statewide.daily.deaths)]).nice()
        .range([chartHeight, 0]);
    var yScaleAgeDists = d3.scaleLinear()
        .domain([0, 1])
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
    var biweekly = d3.timeDay.filter(d => (d.getDate() === 1 || d.getDate() === 16));
    var xAxis = d3.axisBottom().scale(xScale)
        .ticks(biweekly)
        // .ticks(d3.timeWeek);
        .tickFormat(d3.timeFormat("%b %d, %Y"));

    var yAxisCases = d3.axisLeft().scale(yScaleCases);
    var yAxisDeaths = d3.axisLeft().scale(yScaleDeaths);
    var yAxisAgeDist = d3.axisLeft().scale(yScaleAgeDists);

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

    let transluscent = 0.2;

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
            colorLuminance(color, -0.6), transluscent,
            "Daily cases", undefined, "column"
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
            colorLuminance(color, -0.1), 1,
            "7-day moving average",
            d => !isNaN(d), "line");
        const countyCasesChart = new Chart(
            xAxis,
            d3.axisLeft().scale(countyYScaleCases(county)),
            make_x_gridlines,
            make_y_gridlines(countyYScaleCases(county)), [countyCasesSeries, countyCasesAverage],
            `Daily Cases (${county} County)`,
            undefined, { "withTooltip": true, "milestones": true, "prelimPeriod": true }
        );
        countyCharts.push(countyCasesChart);
    });

    const stateCasesSeries = new Series(
        cleanData,
        xScale, d => d.date,
        yScaleCases, d => (d.statewide.daily.cases),
        d => d.cumulative.cases,
        "steelblue", transluscent,
        "Daily cases", undefined, "column"
    );
    const stateCasesAverage = new Series(
        movingAverage(cleanData.map(d => d.statewide.daily.cases), 7),
        xScale, (d, i) => {
            cleanData[i].date
        },
        yScaleCases, d => (d),
        d => 0,
        "green", 1,
        "7-day moving average",
        d => !isNaN(d), "line"
    );
    const stateCasesChart = new Chart(
        xAxis,
        yAxisCases,
        make_x_gridlines,
        make_y_gridlines(yScaleCases), [stateCasesSeries, stateCasesAverage],
        "Daily Cases (Statewide)",
        undefined, { "withTooltip": true, "milestones": true, "prelimPeriod": true }
    );

    const stateDeathsSeries = new Series(
        cleanData,
        xScale, d => d.date,
        yScaleDeaths, d => (d.statewide.daily.deaths),
        d => d.cumulative.deaths,
        "#303030", transluscent,
        "Daily deaths", undefined, "line"
    );
    const stateDeathsAvg = new Series(
        movingAverage(cleanData.map(d => d.statewide.daily.deaths), 7),
        // (d, i) => xScale(cleanData[i].date),
        xScale, (d, i) => cleanData[i].date,
        yScaleDeaths, d => (d),
        d => 0,
        "#808080", 1,
        "7-day moving average",
        d => !isNaN(d), "line"
    );
    const stateDeathsChart = new Chart(
        xAxis,
        yAxisDeaths,
        make_x_gridlines,
        make_y_gridlines(yScaleDeaths), [stateDeathsSeries, stateDeathsAvg],
        "Daily Deaths (Statewide)",
        undefined, { "withTooltip": true, "prelimPeriod": true, "milestones": true }
    );

    // Age Distribution Chart

    var ageRanges = [];
    for (r in new AgeStat("")) {
        if (r != "category" && r != "total") {
            ageRanges.push(r);
        }
    }
    ageRanges.sort();

    var ageColors = [];
    ageRanges.forEach((d, i) => {
        ageColors.push(d3.hsl(0, 0, ((i + 1) / (ageRanges.length - 0))));
    });

    var ageSeries = [];
    ageRanges.forEach((d, i) => {
        // Raw distributions
        // ageSeries.push(new Series(
        //     cleanData,
        //     xScale, (d, i) => cleanData[i].date,
        //     yScaleAgeDists, d => (d.agedists.cases[ageRanges[i]] / d.agedists.cases.total),
        //     d => 0,
        //     ageColors[i], 1
        // ))

        // Moving average distributions
        ageSeries.push(new Series(
            // cleanData,
            movingAverage(cleanData.map(d => (d.agedists.cases[ageRanges[i]] / d.agedists.cases.total)), 7),
            xScale, (d, i) => cleanData[i].date,
            yScaleAgeDists, d => d,
            d => 0,
            ageColors[i], 1,
            ageRanges[i],
            d => !(isNaN(d[0]) || isNaN(d[1])), "area"
        ))
    });

    const ageDistsChart = new Chart(
        xAxis,
        yAxisAgeDist,
        make_x_gridlines,
        make_y_gridlines(yScaleAgeDists),
        ageSeries,
        "Statewide Age Distribution of Cases by Date (7-day moving average)",
        undefined, { "stacked": true, "stackKeys": ageRanges, "filled": true, "legend": true }
    );

    return [stateCasesChart].concat(countyCharts).concat([stateDeathsChart, ageDistsChart]);
}

function updateCharts(charts) {
    numCharts = charts.length;
    svg.style("height", fullHeight);
    chartsSel = svg.selectAll("#chart").data(charts) //.remove();

    chartsSel.enter().append("g")
        .merge(chartsSel)
        .attr("id", "chart")
        .attr("transform", (d, i) => translate(svgMargin.left, svgMargin.top + i * (chartHeight + svgMargin.middleVert)))
        .style("margin", 0)
        .each(function(d, i) {
            d.plot(d3.select(this), i);
        })
        .exit().remove();
}

// Get and filter today's data
// var todayDT = new Date("Jul 7 2020");
var todayDT = new Date();

var date = new Date(todayDT.getFullYear(), todayDT.getMonth(), todayDT.getDate());

// Get latest date for which we have data

while (!fileExists(dataFileFromDate(date))) {
    date.setDate(date.getDate() - 1);
}

// Get that data and draw our charts
getDataAndDrawCharts(date);