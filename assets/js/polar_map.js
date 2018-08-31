
let polarAdsbMap = (function(node) {

  var data = d3.range(0, 2 * Math.PI, .01).map(function(t) {
    return [t, 15 * (Math.sin(2 * t) * Math.cos(2 * t))];
  });

  // how long an aircraft should be rendered
  var aircraftTtlInMs = 2500;
  // stores the aircraft to be plotted
  var aircraftPlotData = []
  // cleans up aircraft that haven't updated recently
  var cleanupAircraft = setInterval(function () {
    var now = (new Date).getTime();
    aircraftPlotData = aircraftPlotData.filter(function (aircraft) {
      return (now - aircraft.lastSeen) > aircraftTtlInMs;
    })
  }, 5000);


  var width = window.innerWidth * 0.8;
  var height = window.innerHeight * 0.8;
  var radiusOfAxis = Math.min(width, height) / 2 - 30;
  var maxRadialDistance = 100;
  var center = {lat: 42.25397, lon: 71.51941};

  // SVG objects
  var line = null;
  var svg = null;
  // Scale the radial component
  var radialScale = d3.scaleLinear()
      .domain([0, maxRadialDistance])
      .range([0, radiusOfAxis]);

  var projection = d3.geoAlbers()
    // .scale(15000)
    .scale(15000)
    .rotate([center.lon, 0])
    .center([0, center.lat])
    .translate([width/2, height/2]);

  var drawRadar = function (selector) {

    line = d3.lineRadial()
        .radius(function(d) { return radialScale(d[1]); })
        .angle(function(d) { return -d[0] + Math.PI / 2; });

    svg = d3.select(selector).append("svg")
        .attr("width", width)
        .attr("height", height)
      .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var gr = svg.append("g")
        .attr("class", "r axis")
      .selectAll("g")
        .data(radialScale.ticks(5).slice(1))
      .enter().append("g");

    gr.append("circle")
        .attr("r", radialScale);

    gr.append("text")
        .attr("y", function(d) { return -radialScale(d) - 4; })
        .attr("transform", "rotate(15)")
        .style("text-anchor", "middle")
        .text(function(d) { return d; });

    var ga = svg.append("g")
        .attr("class", "a axis")
      .selectAll("g")
        .data(d3.range(0, 360, 30))
      .enter().append("g")
        .attr("transform", function(d) { return "rotate(" + -d + ")"; });

    ga.append("line")
        .attr("x2", radiusOfAxis);

    ga.append("text")
        .attr("x", radiusOfAxis + 6)
        .attr("dy", ".35em")
        .style("text-anchor", function(d) { return d < 270 && d > 90 ? "end" : null; })
        .attr("transform", function(d) { return d < 270 && d > 90 ? "rotate(180 " + (radiusOfAxis + 6) + ",0)" : null; })
        .text(function(d) { return d + "°"; });
  }

  var drawAircraft = function() {

    console.log(aircraftPlotData)

    var selection = svg.selectAll(".datapoints").data(aircraftPlotData);

    selection
      .enter()
      .append("circle")
      .attr("class", "datapoints")

    // var selection = svg.selectAll("circle")
    //   .data(aircraftPlotData)
    // selection.enter()
    // .append("svg:circle")                // full notation for the node
    .attr("r", 10)  // you must make big dots
    .attr("cx", function(d) {
      var foo = ( radialScale(d.radius) * Math.cos(d.angle - Math.PI / 2) ); // just as in trigonometry book
      console.log("cx: ", foo)
      return foo
    })
    .attr("cy", function(d) {
      var foo = ( radialScale(d.radius) * Math.sin(d.angle - Math.PI / 2) );
      console.log("cy: ", foo)
      return foo
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
    drawBackground: function(selector) {
      drawRadar(selector);

    console.log(data[10])

svg.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", line);


    },
    addAircraft: function(aircraft) {
      aircraft.lastSeen = (new Date).getTime();

      // console.log(aircraft)

      var cx = width / 2;
      var cy = height / 2;
      var x = projection([aircraft.lon, aircraft.lat])[0];
      var y = projection([aircraft.lon, aircraft.lat])[1];
      var dx = x - cx
      var dy = y - cy

      // console.log(dx, dy)

      var radius = Math.sqrt((dx*dx) + (dy*dy))
      var angle  = Math.tanh(dy/dx)

      // console.log(radius, angle)

      aircraftPlotData.push({radius: radius, angle: angle})
      drawAircraft()
    }
  }
})();

export default polarAdsbMap;
