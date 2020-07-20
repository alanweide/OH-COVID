var vis = d3.select("#chartsvg");
let categories = ["Cases", "Hospitalizations", "Deaths"];
const legendHeight = 100

function getAgeData(rawData) {
    var ageStats = [];
    categories.forEach((e, i) => {
        ageStats.push(new AgeStat(e))
    });
    rawData.forEach(e => {
        let eCases = +e["Case Count"];
        let eHosps = +e["Hospitalized Count"];
        let eDeaths = +e["Death Count"];

        ageStats[0][e["Age Range"]] += eCases;
        ageStats[1][e["Age Range"]] += eHosps;
        ageStats[2][e["Age Range"]] += eDeaths;

        ageStats[0].total += eCases;
        ageStats[1].total += eHosps;
        ageStats[2].total += eDeaths;
    });
    return ageStats;
}

function drawAgeDistCharts(data, date) {
    var ageData = getAgeData(data);
    var ageRanges = [];
    for (r in ageData[0]) {
        if (r != "category" && r != "total") {
            ageRanges.push(r);
        }
    }
    ageRanges.sort();

    var ageColors = [];
    var numRanges = ageRanges.length;
    ageRanges.forEach((d, i) => {
        ageColors.push(d3.hsl(0, 0, ((i + 1) / (numRanges - 0))));
    });

    var ageChartHeight = chartHeight; // 2 * chartHeight + svgMargin.middleVert;

    var caseHospDeathXScale = d3.scaleBand()
        .domain(categories)
        .rangeRound([0, columnWidths()[1]])
        // .paddingOuter(0.1);

    var ageDistsYScale = d3.scaleLinear().domain([1, 0]).rangeRound([0, ageChartHeight]);
    var colorScale = d3.scaleOrdinal().domain(ageRanges).range(ageColors);

    var xAxes = [d3.axisBottom().scale(caseHospDeathXScale)];
    var yAxes = [d3.axisLeft().scale(ageDistsYScale)];

    var stackLayout = d3.stack().keys(ageRanges).value((d, k) => d[k] / d.total);

    var chartsvg = vis.append("g")
        .attr("transform", translate(svgMargin.left + columnWidths()[0] + svgMargin.middleHoriz, svgMargin.top))
        .attr("width", columnWidths()[1])
        .attr("height", ageChartHeight)

    chartsvg.append("g").attr("class", "x-axis")
        .attr("transform", translate(0, ageChartHeight))
        .call(xAxes[0])

    chartsvg.append("g").attr("class", "y-axis")
        .call(yAxes[0])

    chartsvg.append("text")
        .attr("transform", translate(columnWidths()[1] / 2, -15))
        .attr("text-anchor", "middle")
        .attr("class", "title")
        .text("Distribution of Severity by Age");


    chartsvg.selectAll("#stack").data(stackLayout(ageData))
        .enter()
        .append("g").attr("id", "stack")
        .attr("fill", d => colorScale(d))
        .selectAll("#bar").data(stack => stack)
        .enter()
        // .each(d => console.log(d))
        .append("rect").attr("id", "bar")
        .attr("x", (d, i) => {
            return caseHospDeathXScale(categories[i])
        })
        .attr("y", d => Math.round(ageChartHeight * ageDistsYScale(d[1])) / ageChartHeight)
        .attr("width", caseHospDeathXScale.bandwidth())
        .attr("height", d => ageDistsYScale(d[0]) - ageDistsYScale(d[1]))

}