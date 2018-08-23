
let drawBackgroundMap = function() {
  var width = window.innerWidth * 0.8,
      height = window.innerHeight * 0.8;

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
            .attr('fill', '#900')
            .attr('stroke', '#999')
            .attr('d', geoPath);
        });
    });

    return geoPath;
}

export default drawBackgroundMap;
