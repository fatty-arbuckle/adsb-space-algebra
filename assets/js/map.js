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

  var ulAircraftList = d3.select('#aircraft_list').append('ul');

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
          if (aircraftPlotData[key].hasOwnProperty("circle")) {
            map.removeLayer(aircraftPlotData[key].circle);
          }
          if (aircraftPlotData[key].hasOwnProperty("headingIndicator")) {
            map.removeLayer(aircraftPlotData[key].headingIndicator);
          }
          if (aircraftPlotData[key].hasOwnProperty("flightPath")) {
            map.removeLayer(aircraftPlotData[key].flightPath);
          }
        } else {
          filtered[key] = aircraftPlotData[key];
        }
        return filtered;
    }, {});

    if (filtered.length < aircraftPlotData.length) {
      aircraftPlotData = filtered;
      fitMap();
      updateAircraftList();
    }

  }, 1000);

  // map.on("viewreset", update);
  // map.on("moveend", update);
  // update();















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
      if (d.value.hasOwnProperty("latitude") && d.value.hasOwnProperty("latitude")) {
        discoveredBounds.extend(new L.LatLng(d.value.latitude, d.value.longitude));
        if (d.value.hasOwnProperty("speed") && d.value.hasOwnProperty("heading")) {
          var current = new LatLon(d.value.latitude, d.value.longitude);
          var tail = current.destinationPoint(100 * d.value.speed, d.value.heading);
          discoveredBounds.extend(new L.LatLng(tail.lat, tail.lon));
        }

        if (d.value.hasOwnProperty("path")) {
          d.value.path.forEach(function (p) {
            discoveredBounds.extend(p);
          });
        }
      }

    });
    if (discoveredBounds.isValid()) {
      discoveredBounds.pad(1);
      map.fitBounds(discoveredBounds, {});
    }
  }

  var updateAircraftPosition = function(icoa) {
    if (!(aircraftPlotData[icoa].hasOwnProperty("circle"))) {
      aircraftPlotData[icoa].circle
        = L.circle(new L.LatLng(aircraftPlotData[icoa].latitude, aircraftPlotData[icoa].longitude),{className: "aircraftMarker"});
    } else {
    aircraftPlotData[icoa].circle
      .setLatLng(new L.LatLng(aircraftPlotData[icoa].latitude, aircraftPlotData[icoa].longitude));
    }

    if (aircraftPlotData[icoa].hasOwnProperty("headingIndicator")) {
      map.removeLayer(aircraftPlotData[icoa].headingIndicator);
    }

    if (aircraftPlotData[icoa].hasOwnProperty("speed") && aircraftPlotData[icoa].hasOwnProperty("heading")) {
      var speed = aircraftPlotData[icoa].speed;
      var heading = aircraftPlotData[icoa].heading;
      var center = new LatLon(aircraftPlotData[icoa].latitude, aircraftPlotData[icoa].longitude);
      var tail = center.destinationPoint(-10 * speed, heading);
      aircraftPlotData[icoa].headingIndicator = L.polyline([
        new L.LatLng(aircraftPlotData[icoa].latitude, aircraftPlotData[icoa].longitude),
        new L.LatLng(tail.lat, tail.lon)
      ],{className: "headingIndicator"});
    }

    if (!(aircraftPlotData[icoa].hasOwnProperty("path"))) {
      aircraftPlotData[icoa].path = [];
    }
    aircraftPlotData[icoa].path.push(
      new L.LatLng(aircraftPlotData[icoa].latitude, aircraftPlotData[icoa].longitude)
    );
    console.log("path for " + icoa + " is " + aircraftPlotData[icoa].path.length + " long");


  }

  var updateAircraftData = function(aircraft) {
    if (!(aircraft.icoa in aircraftPlotData)) {
      aircraftPlotData[aircraft.icoa] = {
        "icoa":aircraft.icoa,
      }
    }
    aircraftPlotData[aircraft.icoa].lastSeen = (new Date).getTime();
    if (aircraft.hasOwnProperty("speed")) {
      aircraftPlotData[aircraft.icoa].speed = aircraft.speed;
    }
    if (aircraft.hasOwnProperty("heading")) {
      aircraftPlotData[aircraft.icoa].heading = aircraft.heading;
    }
    if (aircraft.hasOwnProperty("altitude")) {
      aircraftPlotData[aircraft.icoa].altitude = aircraft.altitude;
    }
    if (aircraft.hasOwnProperty("lat") && aircraft.hasOwnProperty("lon")) {
      if (aircraft.lat != 0 && aircraft.lon != 0) {
        aircraftPlotData[aircraft.icoa].latitude = aircraft.lat;
        aircraftPlotData[aircraft.icoa].longitude = aircraft.lon;
        updateAircraftPosition(aircraft.icoa);
      }
    }
  }

  var updateAircraftList = function() {
    var aircraftEntries = d3.entries(aircraftPlotData);

	  var listItems = ulAircraftList.selectAll('li').data(aircraftEntries);
    listItems.exit().remove();
    listItems.enter()
    .append('li')
    .html(function (d) {
      var now = (new Date).getTime();
      var aliveTime = (now - d.value.lastSeen)
      return "" + d.value.icoa + ": " + aliveTime;
    });
  }

  return {
    drawBackground: function() {
    },
    addAircraft: function(aircraft) {

      console.log(aircraft);

      updateAircraftData(aircraft);
      if (aircraftPlotData[aircraft.icoa].hasOwnProperty("headingIndicator")) {
        aircraftPlotData[aircraft.icoa].headingIndicator.addTo(map);
      }
      if (aircraftPlotData[aircraft.icoa].hasOwnProperty("circle")) {
        aircraftPlotData[aircraft.icoa].circle.addTo(map);
      }
      if (aircraftPlotData[aircraft.icoa].hasOwnProperty("path")) {
        aircraftPlotData[aircraft.icoa].flightPath
              = L.polyline(aircraftPlotData[aircraft.icoa].path,{className: "flightPath"});
        aircraftPlotData[aircraft.icoa].flightPath.addTo(map);
      }

      updateAircraftList()

      fitMap();
    }
  }
})();

export default adsbMap;
