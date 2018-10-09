import LatLon from "./latlon-spherical"

let adsbMap = (function() {

  var width = window.innerWidth * 0.8;
  var height = window.innerHeight * 0.8;
  var center = { latitude: 0.0, longitude: 0.0 }
  // how long an aircraft should be rendered
  var aircraftTtlInMs = 25000;
  // stores the aircraft to be plotted
  var aircraftPlotData = {}
  var aircraftOverlays = []
  var discoveredBounds = new L.latLngBounds();


  var map = L.map('map').setView([center.latitude, center.longitude], 1);
  var mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';
  L.tileLayer(
    'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution: '&copy; ' + mapLink + ' Contributors',
      maxZoom: 15,
    }
  ).addTo(map);

  // var layer = new L.StamenTileLayer("toner");
  // map.addLayer(layer);

  // /* Initialize the SVG layer */
  // map._initPathRoot()

  /* We simply pick up the SVG from the map object */
  var svg = d3.select("#map").select("svg");
  var g = svg.append("g");

  var update = function() {
      var aircraft = g.selectAll("aircraft").remove();

      var aircraftEntries = d3.entries(aircraftPlotData);

      var aircraft = g.selectAll("aircraft")
        .data(aircraftEntries)
        .enter()
          .append("path")
            .attr('d', d3.symbol().type(d3.symbolTriangle).size(100))
            .style("stroke", "black")
            .style("opacity", .6)
            .style("fill", "red");

      // var aircraft_speed = g.selectAll("aircraft-speed")
      //   .data(aircraftEntries)
      //   .enter()
      //     .append("rect")
      //       .attr("height", function (d) { return d.speed; })
      //       .attr("width", 1)
      //       .style("stroke", "black")
      //       .style("opacity", .6)
      //       .style("fill", "black");
      //
      aircraft.attr("transform", function (d) { return translate(d) });
      aircraft.transition()
      .duration(aircraftTtlInMs)
      .attr('opacity', .001);
      //
      // aircraft_speed.attr("transform", function (d) { return translate(d) });
      // aircraft_speed.transition()
      // .duration(aircraftTtlInMs)
      // .attr('opacity', .001);
      //
      // g.attr("transform", d3.eventTransform);
  }

  var translate = function(d) {
    var x = map.latLngToLayerPoint(d.value.LatLng).x;
    var y = map.latLngToLayerPoint(d.value.LatLng).y;
    // map.fitBounds(map.getBounds().extend(L.point(x,y)));
    // console.log("processing " + d.id + ": " + map.getBounds())
    return "translate("+x+","+y+")"+
      "rotate(" + d.value.heading + ")";
  }

  var cleanupAircraft = setInterval(function () {
    var now = (new Date).getTime();
    var filtered = Object.keys(aircraftPlotData).reduce(function (filtered, key) {
        if ((now - aircraftPlotData[key].lastSeen) > aircraftTtlInMs) {
          map.removeLayer(aircraftPlotData[key].circle);
          map.removeLayer(aircraftPlotData[key].headingIndicator);
        } else {
          filtered[key] = aircraftPlotData[key];
        }
        return filtered;
    }, {});

    if (filtered.length < aircraftPlotData.length) {
      aircraftPlotData = filtered;
      fitMap();
    }

  }, 1000);

  // map.on("viewreset", update);
  // map.on("moveend", update);
  // update();













  // var svg = d3.select('#d3_map')
  //   .append('svg')
  //   .attr('width', width)
  //   .attr('height', height);
  // var projection = d3.geoAlbers()
  //   // .scale(15000)
  //   .scale(15000)
  //   .rotate([71.51941, 0])
  //   .center([0, 42.25397])
  //   .translate([width/2, height/2]);
  // var geoPath = d3.geoPath().projection(projection);


  // var cleanupAircraft = setInterval(function () {
  //   var now = (new Date).getTime();
  //   aircraftPlotData = aircraftPlotData.filter(function (aircraft) {
  //     return (now - aircraft.lastSeen) > aircraftTtlInMs;
  //   })
  // }, 5000);

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


  var fitMap = function() {
    d3.entries(aircraftPlotData).forEach(function (d) {
      discoveredBounds.extend(new L.LatLng(d.value.latitude, d.value.longitude));
      var current = new LatLon(d.value.latitude, d.value.longitude);
      var tail = current.destinationPoint(100 * d.value.speed, d.value.heading);
      discoveredBounds.extend(new L.LatLng(tail.lat, tail.lon));

      d.value.path.forEach(function (p) {
        discoveredBounds.extend(p);
      });
    });
    if (discoveredBounds.isValid()) {
      discoveredBounds.pad(1);
      map.fitBounds(discoveredBounds, {});
    }
  }

  return {
    drawBackground: function() {
    },
    addAircraft: function(aircraft) {

      console.log(aircraft);

      if (aircraft.icoa in aircraftPlotData) {
        aircraftPlotData[aircraft.icoa].lastSeen = (new Date).getTime();
        if ("heading" in aircraft) {
          aircraftPlotData[aircraft.icoa].heading = aircraft.heading;
        }
        if ("speed" in aircraft) {
          aircraftPlotData[aircraft.icoa].speed = aircraft.speed;
        }
        if ("lat" in aircraft && "lon" in aircraft && aircraft.lat != 0, aircraft.lon != 0) {

          aircraftPlotData[aircraft.icoa].latitude = aircraft.lat;
          aircraftPlotData[aircraft.icoa].longitude = aircraft.lon;

          aircraftPlotData[aircraft.icoa].circle
            .setLatLng(new L.LatLng(aircraft.lat, aircraft.lon));

          map.removeLayer(aircraftPlotData[aircraft.icoa].headingIndicator);

          if (aircraft.speed && aircraft.heading) {
            var center = new LatLon(aircraft.lat, aircraft.lon);
            var tail = center.destinationPoint(100 * aircraft.speed, aircraft.heading);
            aircraftPlotData[aircraft.icoa].headingIndicator = L.polyline([
              new L.LatLng(aircraft.lat, aircraft.lon),
              new L.LatLng(tail.lat, tail.lon)
            ],{
              stroke: true,
              color: "red",
              opacity: 0.8,
            });
            aircraftPlotData[aircraft.icoa].headingIndicator.addTo(map);
          }

          aircraftPlotData[aircraft.icoa].path.push(
            new L.LatLng(aircraft.lat, aircraft.lon)
          );
          map.removeLayer(aircraftPlotData[aircraft.icoa].headingIndicator);
          aircraftPlotData[aircraft.icoa].headingIndicator
            = L.polyline(aircraftPlotData[aircraft.icoa].path,{
              stroke: true,
              color: "red",
              opacity: 0.8,
            });
          aircraftPlotData[aircraft.icoa].headingIndicator.addTo(map);
        }
      } else {
        aircraftPlotData[aircraft.icoa] = {
          "icoa":aircraft.icoa,
          "lastSeen": (new Date).getTime(),
          "heading":aircraft.heading,
          "speed":aircraft.speed,
        }

        if ("lat" in aircraft && "lon" in aircraft && aircraft.lat != 0, aircraft.lon != 0) {

          var current = new LatLon(aircraft.lat, aircraft.lon);
          var tail = current.destinationPoint(100 * aircraft.speed, aircraft.heading);

          aircraftPlotData[aircraft.icoa].path = [new L.LatLng(aircraft.lat, aircraft.lon)];
          aircraftPlotData[aircraft.icoa].latitude = aircraft.lat;
          aircraftPlotData[aircraft.icoa].longitude = aircraft.lon;
          aircraftPlotData[aircraft.icoa].circle = L.circle(new L.LatLng(aircraft.lat, aircraft.lon),
              {
                radius: 100,
                stroke: true,
                color: "red",
                fill: true,
                fillColor: "red",
                opacity: 0.8,
              }
            );
            aircraftPlotData[aircraft.icoa].headingIndicator  = L.polyline([
              new L.LatLng(aircraft.lat, aircraft.lon),
              new L.LatLng(tail.lat, tail.lon)
            ],{
              stroke: true,
              color: "red",
              opacity: 0.8,
            });

          aircraftPlotData[aircraft.icoa].circle.addTo(map);
          aircraftPlotData[aircraft.icoa].headingIndicator.addTo(map);
        }
      }

      console.log(aircraftPlotData[aircraft.icoa])

      fitMap();
    }
  }
})();

export default adsbMap;
