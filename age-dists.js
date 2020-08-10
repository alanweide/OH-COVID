var vis = d3.select("#chartsvg");
let categories = ["Cases", "Hospitalizations", "Deaths"];
const legendHeight = 100

function getAgeData(rawData) {
    var ageData = [];
    categories.forEach((e, i) => {
        ageData.push(new AgeStat(e))
    });
    rawData.forEach(e => {
        let eCases = +e["Case Count"];
        let eHosps = +e["Hospitalized Count"];
        let eDeaths = +e["Death Count"];

        ageData[0][e["Age Range"]] += eCases;
        ageData[1][e["Age Range"]] += eHosps;
        ageData[2][e["Age Range"]] += eDeaths;

        ageData[0].total += eCases;
        ageData[1].total += eHosps;
        ageData[2].total += eDeaths;
    });
    return ageData;
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
        // .paddingOuter(0.01);

    var ageDistsYScale = d3.scaleLinear().domain([1, 0]).rangeRound([0, ageChartHeight]);
    var colorScale = d3.scaleOrdinal().domain(ageRanges).range(ageColors);

    var xAxis = d3.axisBottom().scale(caseHospDeathXScale);
    var yAxis = d3.axisLeft().scale(ageDistsYScale);

    var stackLayout = d3.stack().keys(ageRanges).value((d, k) => d[k] / d.total);

    var chartsvg = vis.append("g")
        .attr("transform", translate(svgMargin.left + columnWidths()[0] + svgMargin.middleHoriz, svgMargin.top))
        .attr("width", columnWidths()[1])
        .attr("height", ageChartHeight)

    chartsvg.append("text")
        .attr("transform", translate(columnWidths()[1] / 2, -15))
        .attr("text-anchor", "middle")
        .attr("class", "title")
        .text("Cumulative Distribution of Severity by Age");

    chartsvg.selectAll("#stack").data(stackLayout(ageData))
        .enter()
        .append("g").attr("id", "stack")
        .attr("fill", d => colorScale(d))
        .attr("stroke", d => colorScale(d))
        .selectAll("#bar").data(stack => stack)
        .enter()
        // .each(d => console.log(d))
        .append("rect").attr("id", "bar")
        .attr("x", (d, i) => caseHospDeathXScale(categories[i]))
        .attr("y", d => Math.round(ageChartHeight * ageDistsYScale(d[1])) / ageChartHeight)
        .attr("width", caseHospDeathXScale.bandwidth())
        .attr("height", d => ageDistsYScale(d[0]) - ageDistsYScale(d[1]))

    chartsvg.append("g").attr("class", "x-axis")
        .attr("transform", translate(0, ageChartHeight))
        .call(xAxis)

    chartsvg.append("g").attr("class", "y-axis")
        .call(yAxis)

    const legendData = ageRanges
        .map((d, i) => { return { "name": d, "color": colorScale(d) } })
        .filter(d => d.name !== "Unknown");
    const legendScale = d3.scaleBand().range([chartHeight / 2, 0]).domain(arrayFromRange(0, legendData.length)).paddingOuter(0.25) //.align(0.5);

    var legend = chartsvg.append("g").attr("id", "legend").attr("transform", translate(10, 10));
    var box = legend.append("rect")
        .attr("id", "legendBox")
        .attr("class", "legend-box")
        .attr("rx", 10).attr("ry", 10)
        .attr("height", chartHeight / 2);

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