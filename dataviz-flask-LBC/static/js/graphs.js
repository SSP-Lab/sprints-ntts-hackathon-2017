queue()
    .defer(d3.json, "/data")
    .await(makeGraphs);


function makeGraphs(error, recordsJson) {
	//Clean data
	var records = recordsJson;
	var dateFormat = d3.time.format("%Y-%m-%d"); 
	
	records.forEach(function(d) {
		d["date"] = dateFormat.parse(d["date_clean"]);
		d["long"] = +d["long"];
		d["lat"] = +d["lat"];
	});


	//Create a Crossfilter instance
	var ndx = crossfilter(records);


	//Define Dimensions
	var dateDim = ndx.dimension(function(d) { return d["date"]; });
	var tpsDim = ndx.dimension(function(d) { return d["tps"]; });
	var expDim = ndx.dimension(function(d) { return d["exp"]; });
	var sectDim = ndx.dimension(function(d) { return d["sect"]; });
	var contratDim = ndx.dimension(function(d) {return d["contrat"];});
	var formationDim = ndx.dimension(function(d) {return d["formation"];});
    var fonctionDim = ndx.dimension(function (d) { return d['fonction'];});//.text_field || "" });
	var allDim = ndx.dimension(function(d) {return d;});


	//Group Data
	var numRecordsByDate = dateDim.group();
	var tpsGroup = tpsDim.group();
	var expGroup = expDim.group();
	var sectGroup = sectDim.group();
	var contratGroup = contratDim.group();
	var formationGroup = formationDim.group();
	var fonctionGroup = fonctionDim.group();
	var all = ndx.groupAll();


	//Define values (to be used in charts)
	var minDate = dateDim.bottom(1)[0]["date"];
	var maxDate = dateDim.top(1)[0]["date"];


    //Charts
    var numberRecordsND = dc.numberDisplay("#number-records-nd");
	var timeChart = dc.barChart("#time-chart");
	var tpsChart = dc.rowChart("#tps-row-chart");
	var expChart = dc.rowChart("#exp-row-chart");
	var sectChart = dc.rowChart("#sect-row-chart");
	var contratChart = dc.rowChart("#contrat-row-chart");
	var formationChart = dc.rowChart("#formation-row-chart");
    var fonctionChart = dc.pieChart("#fonctions-pie-chart");
    var separator = "~"; //pour le tag cloud



	numberRecordsND
		.formatNumber(d3.format("d"))
		.valueAccessor(function(d){return d; })
		.group(all);

	timeChart
		.width(310)
		.height(140)
		.margins({top: 10, right: 50, bottom: 20, left: 20})
		.dimension(dateDim)
		.group(numRecordsByDate)
		.transitionDuration(500)
		.x(d3.time.scale().domain([minDate, maxDate]))
		.elasticY(true)
		.yAxis().ticks(3);

	tpsChart
        .width(210)
        .height(100)
        .dimension(tpsDim)
        .group(tpsGroup)
        .ordering(function(d) { return -d.value })
        .colors(['#6baed6'])
        .elasticX(true)
        .xAxis().ticks(3);

	expChart
		.width(210)
		.height(120)
        .dimension(expDim)
        .group(expGroup)
        .colors(['#6baed6'])
        .elasticX(true)
        .labelOffsetY(10)
        .xAxis().ticks(3);

	contratChart
		.width(210)
		.height(190)
        .dimension(contratDim)
        .group(contratGroup)
        .colors(['#6baed6'])
        .elasticX(true)
        .labelOffsetY(10)
        .xAxis().ticks(3);

	sectChart
		.width(300)
		.height(330)
        .dimension(sectDim)
        .group(sectGroup)
        .ordering(function(d) { return -d.value })
        .colors(['#6baed6'])
        .elasticX(true)
        .xAxis().ticks(4);

	formationChart
		.width(300)
		.height(170)
        .dimension(formationDim)
        .group(formationGroup)
        .ordering(function(d) { return -d.value })
        .colors(['#6baed6'])
        .elasticX(true)
        .xAxis().ticks(4);

    fonctionChart
        .width(270)
        .height(300)
        .slicesCap(10)
        .innerRadius(20)
        .dimension(fonctionDim)
        .group(fonctionGroup)
        .on('pretransition', function(chart) {
            chart.selectAll('text.pie-slice').text(function(d) {
            return d.data.key + ' ' + dc.utils.printSingleValue((d.endAngle - d.startAngle) / (2*Math.PI) * 100) + '%';
            })
        });


    var map = L.map('map');

	var drawMap = function(){

	    map.setView([46, 3], 5); 
		mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';
		L.tileLayer(
			'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '&copy; ' + mapLink + ' Contributors',
				maxZoom: 15,
			}).addTo(map);

		//HeatMap
		var geoData = [];
		_.each(allDim.top(Infinity), function (d) {
			geoData.push([d["lat"], d["long"], 1]);
	      });
		var heat = L.heatLayer(geoData,{
			radius: 5,
			blur: 10, 
			maxZoom: 1,
		}).addTo(map);

	};

	//Draw Map
	drawMap();

	//Update the heatmap if any dc chart get filtered
	dcCharts = [timeChart, tpsChart, expChart, sectChart, formationChart, contratChart, fonctionChart];

	_.each(dcCharts, function (dcChart) {
		dcChart.on("filtered", function (chart, filter) {
			map.eachLayer(function (layer) {
				map.removeLayer(layer)
			}); 
			drawMap();
		});
	});

	dc.renderAll();

};