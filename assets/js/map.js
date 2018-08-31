
let adsbMap = (function(node) {

  var width = window.innerWidth * 0.8;
  var height = window.innerHeight * 0.8;
  var svg = d3.select('#d3_map')
    .append('svg')
    .attr('width', width)
    .attr('height', height);
  var projection = d3.geoAlbers()
    // .scale(15000)
    .scale(15000)
    .rotate([71.51941, 0])
    .center([0, 42.25397])
    .translate([width/2, height/2]);
  var geoPath = d3.geoPath().projection(projection);

  // how long an aircraft should be rendered
  var aircraftTtlInMs = 2500;
  // stores the aircraft to be plotted
  var aircraftPlotData = []

  var cleanupAircraft = setInterval(function () {
    var now = (new Date).getTime();
    aircraftPlotData = aircraftPlotData.filter(function (aircraft) {
      return (now - aircraft.lastSeen) > aircraftTtlInMs;
    })
  }, 5000);

  var altitudeScale = d3.scaleLinear()
    .domain([0,40000])
    .range([1,5]);

  var drawAircraft = function() {
    var selection = svg.selectAll("circle")
      .data(aircraftPlotData)
    selection.enter()
      .append("circle")
      .attr("cx", function (d) {
        return projection([d.lon, d.lat])[0];
      })
      .attr("cy", function (d) {
        return projection([d.lon, d.lat])[1];
      })
      .attr("r", function(d) {
        return altitudeScale(d.altitude);
      })
      .attr('fill', '#900')
      .attr('stroke', '#999')
      .attr('opacity', 1.0)
      .transition()
      .duration(aircraftTtlInMs)
      .attr('opacity', .001);
      // selection.exit().remove();
  }

  return {
    drawBackground: function() {
      d3.json("/js/newengland.geojson", function(data) {
        svg.append('g').selectAll('path')
          .data(data.features)
          .enter()
          .append('path')
          .attr('fill', '#ccc')
          .attr('stroke', '#333')
          .attr('d', geoPath);

          d3.json("/js/office.geojson", function(data) {
            svg.append('g').selectAll('path')
              .data(data.features)
              .enter()
              .append('path')
              .attr('fill', '#333')
              .attr('stroke', '#444')
              .attr('d', geoPath);
          });
      });
    },
    addAircraft: function(aircraft) {
      aircraft.lastSeen = (new Date).getTime();;
      aircraftPlotData.push(aircraft)
      drawAircraft()
    }
  }
})();

export default adsbMap;
