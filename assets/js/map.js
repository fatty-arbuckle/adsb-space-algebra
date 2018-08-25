
let adsbMap = (function() {

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

  var symbol = d3.symbol().size([100]);

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
    drawAircraft: function(aircraft) {
      svg.append('g').selectAll('path')
        .data(aircraft.features)
        .enter()
        .append('path')
        .attr('fill', '#900')
        .attr('stroke', '#999')
        .attr('opacity', 1.0)
        .attr('d', geoPath)
        .transition()
        .duration(5000)
        .attr('opacity', .001);

      // d3.select("svg")
      //   .append("circle")
      //   .style("fill", "red")
      //   .attr("r", 2)
      //   .attr("cx",  function(d) {return projection(aircraft.lat, aircraft.lon)[0]})
      //   .attr("cy", function(d) {return projection(aircraft.lon, aircraft.lat)[0]});
    }
  }
})();

export default adsbMap;
