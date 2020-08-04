d3.selection.prototype.moveToFront = function() {
    return this.each(function() {
        this.parentNode.appendChild(this);
    });
};

Date.prototype.plusDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

function getDates(startDate, stopDate) {
    var dateArray = new Array();
    var currentDate = startDate;
    while (currentDate < stopDate) {
        dateArray.push(new Date(currentDate));
        currentDate = currentDate.plusDays(1);
    }
    return dateArray;
}

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

function movingAverage(values, N, backfill = true) {
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
    if (backfill) {
        for (let i = 0; i < N; i++) {
            means[i] = means[N];
        }
    }
    return means;
}

function transpose(a) {
    return Object.keys(a[0]).map(function(c) {
        return a.map(function(r) { return r[c]; });
    });
}

function getDataAndDrawCharts(endingDate) {
    d3.select("#subtitle").text("Date: " + endingDate.toDateOnlyString());

    d3.csv(dataFileFromDate(endingDate)).then(d => {
        // Remove footer row
        d.pop();
        drawDailyCharts(d, endingDate);
        drawAgeDistCharts(d, endingDate);
    });
}