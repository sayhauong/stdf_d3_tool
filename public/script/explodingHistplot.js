function explodingHistplot() {

  // options which should be accessible via ACCESSORS
  var data_set = [];
  var _data_set = [];

  var groups;
  var exploded_box_plots = [];

  var options = {

    id: '',
    class: 'xBoxPlot',

    width: window.innerWidth,
    height: window.innerHeight,

    margins: {
      top: 10,
      right: 10,
      bottom: 30,
      left: 40
    },

    axes: {
      x: {
        label: '',
        ticks: 10,
        scale: 'linear',
        nice: true,
        tickFormat: undefined,
        domain: undefined
      },
      y: {
        label: '',
        ticks: 10,
        scale: 'linear',
        nice: true,
        tickFormat: function(n) {
          return n.toLocaleString()
        },
        domain: undefined
      }
    },

    data: {
      color_index: 'color',
      label: 'undefined',
      group: undefined,
      identifier: undefined
    },

    datapoints: {
      radius: 3
    },

    display: {
      iqr: 1.5, // interquartile range
      boxpadding: 0.2
    },

    resize: true,
    mobileScreenMax: 500

  }

  var constituents = {
    elements: {
      domParent: undefined,
      chartRoot: undefined
    },
    scales: {
      X: undefined,
      Y: undefined,
      color: undefined
    }
  }

  var mobileScreen = ($(window).innerWidth() < options.mobileScreenMax ? true : false);

  var default_colors = {
    0: "#a6cee3",
    1: "#ff7f00",
    2: "#b2df8a",
    3: "#1f78b4",
    4: "#fdbf6f",
    5: "#33a02c",
    6: "#cab2d6",
    7: "#6a3d9a",
    8: "#fb9a99",
    9: "#e31a1c",
    10: "#ffff99",
    11: "#b15928"
  };
  var colors = JSON.parse(JSON.stringify(default_colors));

  var update;

  // programmatic
  var transition_time = 200;

  // DEFINABLE EVENTS
  // Define with ACCESSOR function chart.events()
  var events = {
    'point': {
      'click': null,
      'mouseover': null,
      'mouseout': null
    },
    'update': {
      'begin': null,
      'ready': null,
      'end': null
    }
  };

  function chart(selection) {
    selection.each(function() {

      var domParent = d3.select(this);
      constituents.elements.domParent = domParent;

      var chartRoot = domParent.append('svg')
        .attr('class', 'svg-class')
      constituents.elements.chartRoot = chartRoot;

      // background click area added first
      var resetArea = chartRoot.append('g').append('rect')
        .attr('id', 'resetArea')
        .attr('width', options.width)
        .attr('height', options.height)
        .style('color', 'white')
        .style('opacity', 0);

      // main chart area
      var chartWrapper = chartRoot.append("g").attr("class", "chartWrapper").attr('id', 'chartWrapper' + options.id)

      mobileScreen = ($(window).innerWidth() < options.mobileScreenMax ? true : false);

      // boolean resize used to disable transitions during resize operation
      update = function(resize) {

        chartRoot
          .attr('width', (options.width + options.margins.left + options.margins.right))
          .attr('height', (options.height + options.margins.top + options.margins.bottom));

        chartWrapper
          .attr("transform", "translate(" + options.margins.left + "," + options.margins.top + ")");

        if (events.update.begin) {
          events.update.begin(constituents, options, events);
        }

        if (options.data.group) {
          histGroups = d3.group(data_set, d => d[options.data.group]);
          // histGroups = d3.nest()
          //   .key(function(k) {
          //     return k[options.data.group];
          //   })
          //   .entries(data_set)
        } else {
          histGroups = [{
            key: '',
            values: data_set
          }]
        }

        let histGroupsArray = Array.from(histGroups, ([key, value]) => ({
          key,
          value
        }));

        var scatterData1;
        var numBins = 70;
        var histValueRange = d3.extent(data_set.map(function(m) {
          return m[options.axes.y.label];
        }));
        histValueRange[1] = histValueRange[1] + Math.abs(histValueRange[1]) * 0.1;
        histValueRange[0] = histValueRange[0] - Math.abs(histValueRange[1]) * 0.1;
        var xScale = d3.scaleLinear().domain(histValueRange).range([0, options.width]);
        var xScale2 = d3.scaleLinear().domain(histValueRange).range([0, options.width]);
        constituents.scales.X = xScale;

        //create CDF info
        histGroupsArray = histGroupsArray.map(function(g) {
          var o = compute_histplot(g.value, options.axes.y.label, options.width, histValueRange, numBins);
          o['group'] = g.key;
          return o;
        });
        domain_range = [0, d3.max(histGroupsArray, function(d) {
          // d.y;
          return (
            d3.max(d, function(e) {
              // console.log(e.y);
              return e.length;
            })
          );
        })];

        var histNonLinDom = [-0.0001, 0.0001, 0.001, 0.01, 0.025, 0.1, 0.25, 0.50, 0.75, 0.90, 0.975, 0.999, 0.9999, 0.99999, 1];
        // var  cdfNonLinRange =[400,371,342,314,285,257,229,200,171,142,114,86,57,29, 0];
        var yStep = (options.height - options.margins.top - options.margins.bottom) / histNonLinDom.length;
        var histNonLinRange = [];
        histNonLinDom.forEach(function(value, i) {
          histNonLinRange.push((options.height - options.margins.top - options.margins.bottom) - i * yStep);
        });
        var yScale = d3.scaleLinear()
          .domain(domain_range)
          .range([options.height - options.margins.top - options.margins.bottom, 0])
          // .domain(histNonLinDom)
          // .range(histNonLinRange)
          .nice();


        constituents.scales.Y = yScale;

        colorScale = d3.scaleOrdinal()
          .domain(histGroupsArray.map(function(d) {
            return d.key;
          }))
          .range(Object.keys(colors).map(function(m) {
            return colors[m];
          }));
        constituents.scales.color = colorScale;

        var zoomBeh = d3.zoom()
          //.x(xScale)
          // .y(yScale)
          .scaleExtent([0, 500])
          .on("zoom", zoom);

        function zoom(event, d) {
          // console.log("zoom detected");
          var newX = event.transform.rescaleX(xScale);

          xScale
            .domain(event.transform.rescaleX(xScale2).domain());

          chartRoot
            .select(".explodingCdfplot.x.axis")
            .call(xAxis);
          // chartRoot.select(".y.axis").call(yAxis);

          chartRoot.selectAll(".bar")
            //   // .attr("transform", transform);
            .attr("transform", function(d) {
              return "translate(" + xScale(d.x0) + "," + yScale(d.length) + ")";
            })
          //   // .attr("cx", function(d) {
          //   //   return xScale(d.x);
          //   // })
        }


        chartRoot.call(zoomBeh);


        if (events.update.ready) {
          events.update.ready(constituents, options, events);
        }
        var xAxis = d3.axisBottom().scale(xScale)
        var yAxis = d3.axisLeft().scale(yScale)
          // .tickFormat(d3.format(".5"))
          // .tickValues(domain_range)
          .tickFormat(options.axes.y.tickFormat)

        // resetArea
        //   .on('dblclick', implode_boxplot);

        // update_xAxis = chartWrapper.selectAll('#xpb_xAxis')
        //   .data([0]);
        //
        // update_xAxis.enter()
        //   .append('g')
        //   .attr('class', 'explodingHistplot x axis')
        //   .attr('id', 'xpb_xAxis')
        //   .append("text")
        //   .attr('class', 'axis text')
        //
        // update_xAxis.exit()
        //   .remove();
        //
        // update_xAxis
        //   .attr("transform", "translate(0," + (options.height - options.margins.top - options.margins.bottom) + ")")
        //   .call(xAxis)
        //   .select('.axis.text')
        //   .attr("x", (options.width - options.margins.left - options.margins.right) / 2)
        //   .attr("dy", ".71em")
        //   .attr('y', options.margins.bottom - 10)
        //   .style("text-anchor", "middle")
        //   .text(options.axes.x.label);

        update_xAxis = chartWrapper.selectAll('#xpb_xAxis')
          .data([0])
          .join(
            function(enter) {
              return enter.append('g')
                .attr('class', 'explodingCdfplot x axis')
                .attr('id', 'xpb_xAxis')
                .attr("transform", "translate(0," + (options.height - options.margins.top - options.margins.bottom) + ")")
                .call(xAxis)

                .append("text")
                .attr('class', 'axis text')
                .attr("x", (options.width - options.margins.left - options.margins.right) / 2)
                .attr("dy", ".71em")
                .attr('y', options.margins.bottom - 10)
                .style("text-anchor", "middle")
                .text(options.axes.x.label);
            },
            function(update) {
              return update
                .attr("transform", "translate(0," + (options.height - options.margins.top - options.margins.bottom) + ")")
                .call(xAxis)

            },
            function(exit) {
              return exit.exit()
                .remove();
            }

          )

        update_yAxis = chartWrapper.selectAll('#xpb_yAxis')
          .data([0])
          .join(
            function(enter) {
              return enter.append('g')
                .attr("clip-path", "url(#clip)")
                .attr('class', 'explodingCdfplot y axis')
                .attr('id', 'xpb_yAxis')
                .call(yAxis, yScale)
                .append("text")
                .attr('class', 'axis text')
                .attr("transform", "rotate(-90)")
                .attr("x", -options.margins.top * 0.95 - d3.mean(yScale.range()))
                .attr("dy", ".71em")
                .attr('y', -options.margins.left )
                .style("text-anchor", "middle")
                .text(options.axes.y.label);
            },
            function(update) {
              return update

            },
            function(exit) {
              return exit.remove();
              //    .remove();
            }
          )
          .call(yAxis, yScale)
          .select('.axis.text')
          .attr("transform", "rotate(-90)")
          .attr("x", -options.margins.top * 0.95 - d3.mean(yScale.range()))
          .attr("dy", ".71em")
          .attr('y', -options.margins.left )
          .style("text-anchor", "middle")
          .text(options.axes.y.label);



        var clip = chartWrapper.append("defs").append("svg:clipPath")
          .attr("id", "clip")
          .append("svg:rect")
          .attr("id", "clip-rect")
          .attr("x", "-50")
          .attr("y", "0")
          .attr("width", options.width)
          .attr("height", options.height - options.margins.bottom - options.margins.top);
        // .attr("width", options.width -options.margins.left - 10)
        // .attr("height", options.height );

        // var histContent = chartWrapper.selectAll('.histcontent')
        //   .data(histGroups)
        var histContent = chartWrapper
          // .append("g")
          // .attr("clip-path", "url(#clip)")
          .selectAll('.histcontent')
          .data(histGroupsArray)
          .join(
            function(enter) {
              return enter
                .append('g')
                .attr("clip-path", "url(#clip)")
                .attr('class', 'explodingHistplot histcontent')
                .attr('id', function(d, i) {
                  return 'explodingHistplot' + options.id + i
                })
              // .each(create_histplot)
              // .each(draw_histplot)
            },
            function(update) {
              return update
            },
            function(exit) {
              return exit
                .remove();
            }
          )

          .each(draw_histplot)


        function draw_histplot(g, i) {

          var highlight = function(e,d) {
            // console.log("mouseover detected");
            // selected_specie = d.site
            d3.selectAll(".bar")
              .transition()
              .duration(200)
              .attr('fill-opacity', "0.05")


            d3.selectAll("#bar"+ d.site)
              .transition()
              .duration(200)
                .attr('fill-opacity', "1.0")

              if (events.point && typeof events.point.mouseover == 'function') {
                   events.point.mouseover(e,d, d3.select(this), constituents, options);
                }
          }

          // Highlight the specie that is hovered
          var doNotHighlight = function(d) {
            d3.selectAll(".bar")
              .transition()
              .duration(200)
                .attr('fill-opacity', "1.0")


              if (events.point && typeof events.point.mouseout == 'function') {
                   events.point.mouseout(d, i, d3.select(this), constituents, options);
                }
          }

          var s = d3.select('#' + 'explodingHistplot' + options.id + i)
            .selectAll('rect')
            .data(g)
            .join(
              function(enter) {
                return enter
                  .append("rect")
                  .attr("class", "bar")
                  .attr('id', 'bar' + g.group)

                  .attr("transform", function(d) {
                    return "translate(" + xScale(d.x0) + "," + yScale(d.length) + ")";
                  })
                  // .attr("xScale", 1)
                  // .attr("width", Math.abs(xScale(g[0].x1) - xScale(g[0].x0)))

                   .attr("width",  options.width/(numBins))
                  .attr("height", function(d) {
                    return options.height - options.margins.top - options.margins.bottom - yScale(d.length);
                    // return options.height - yScale(d.y);
                  })
                  .attr("fill", function(d) {
                    return colorScale(d.site)
                  })
                  .style("opacity", 0.6)

              },
              function(update) {
                return update
                  .attr("transform", function(d) {
                    return "translate(" + xScale(d.x0) + "," + yScale(d.length) + ")";
                  })
                  // .attr("xScale", 1)
                  // .attr("width", (xScale(g[0].x1) - xScale(g[0].x0)) - 1)
                 .attr("width",  options.width/(numBins))
                  .attr("height", function(d) {
                    return options.height - options.margins.top - options.margins.bottom - yScale(d.length);
                    // return options.height - yScale(d.y);
                  })
                  .attr("fill", function(d) {
                    return colorScale(d.site)
                  })
                  .style("opacity", 0.6)
              },
              function(exit) {
                return exit
                  .remove();
              }
            )
            .on("mouseover", highlight)
            .on("mouseleave", doNotHighlight )
            // .on("mouseover", function(e, d) {
            //   if (events.point && typeof events.point.mouseover == 'function') {
            //     events.point.mouseover(e, d, d3.select(this), constituents, options);
            //   }
            // })
            // .on("mouseout", function(d) {
            //   if (events.point && typeof events.point.mouseout == 'function') {
            //     events.point.mouseout(d, i, d3.select(this), constituents, options);
            //   }
            // });

          //
          // bar.attr("transform", function(d) { return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")"; })
          // .attr("xScale", 1)
          // .attr("width", (xScale(g[0].dx) - xScale(0)) - 1)
          // .attr("height", function(d) {
          //   return  options.height - options.margins.top - options.margins.bottom - yScale(d.y);
          //   // return options.height - yScale(d.y);
          //  })
          // .attr("fill", function(d) { return colorScale(d.y) })
          //       .style("opacity", 0.6)
          // .on("mouseover",  function(d){if (events.point && typeof events.point.mouseover == 'function') {
          //        events.point.mouseover(d, i, d3.select(this), constituents, options);
          //     }})
          //   .on("mouseout", function(d){  if (events.point && typeof events.point.mouseout == 'function') {
          //          events.point.mouseout(d, i, d3.select(this), constituents, options);
          //       }});
          // var bar = s.selectAll('#explodingHistplot_box' + options.id + i)
          // .selectAll('rect')
          //     .data(g)
          //
          //   bar.enter().
          //   append("rect")
          //     .attr("class", "bar")
          //       .attr('id', 'bar'+g.group);
          //
          //
          //     bar.exit().remove()
          //
          // // bar.append("rect")
          //     bar.attr("transform", function(d) { return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")"; })
          //     .attr("xScale", 1)
          //     .attr("width", (xScale(g[0].dx) - xScale(0)) - 1)
          //     .attr("height", function(d) {
          //       return  options.height - options.margins.top - options.margins.bottom - yScale(d.y);
          //       // return options.height - yScale(d.y);
          //      })
          //     .attr("fill", function(d) { return colorScale(d.y) })
          //           .style("opacity", 0.6)
          //     .on("mouseover",  function(d){if (events.point && typeof events.point.mouseover == 'function') {
          //            events.point.mouseover(d, i, d3.select(this), constituents, options);
          //         }})
          //       .on("mouseout", function(d){  if (events.point && typeof events.point.mouseout == 'function') {
          //              events.point.mouseout(d, i, d3.select(this), constituents, options);
          //           }});

        };





        // function transform(d) {
        //   return "translate(" + xScale(d.x) + "," + yScale(d.cum) + ")";
        // }

        if (events.update.end) {
          setTimeout(function() {
            events.update.end(constituents, options, events);
          }, transition_time);
        }

      } // end update()

    });
  }

  // ACCESSORS

  // chart.options() allows updating individual options and suboptions
  // while preserving state of other options
  chart.options = function(values) {
    if (!arguments.length) return options;
    keyWalk(values, options);
    return chart;
  }

  function keyWalk(valuesObject, optionsObject) {
    if (!valuesObject || !optionsObject) return;
    var vKeys = Object.keys(valuesObject);
    var oKeys = Object.keys(optionsObject);
    for (var k = 0; k < vKeys.length; k++) {
      if (oKeys.indexOf(vKeys[k]) >= 0) {
        var oo = optionsObject[vKeys[k]];
        var vo = valuesObject[vKeys[k]];
        if (typeof oo == 'object' && typeof vo !== 'function') {
          keyWalk(valuesObject[vKeys[k]], optionsObject[vKeys[k]]);
        } else {
          optionsObject[vKeys[k]] = valuesObject[vKeys[k]];
        }
      }
    }
  }

  chart.events = function(functions) {
    if (!arguments.length) return events;
    keyWalk(functions, events);
    return chart;
  }

  chart.constituents = function() {
    return constituents;
  }

  chart.colors = function(color3s) {
    if (!arguments.length) return colors; // no arguments, return present value
    if (typeof color3s !== 'object') return false; // argument is not object
    var keys = Object.keys(color3s);
    if (!keys.length) return false; // object is empty
    // remove all properties that are not colors
    keys.forEach(function(f) {
      if (!/(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(color3s[f])) delete color3s[f];
    })
    if (Object.keys(color3s).length) {
      colors = color3s;
    } else {
      colors = JSON.parse(JSON.stringify(default_colors)); // no remaining properties, revert to default
    }
    return chart;
  }

  chart.width = function(value) {
    if (!arguments.length) return options.width;
    options.width = value;
    return chart;
  };

  chart.height = function(value) {
    if (!arguments.length) return options.height;
    options.height = value;
    return chart;
  };

  chart.data = function(value) {
    if (!arguments.length) return data_set;
    value.sort(function(x, y) {
      // return x['Set Score'].split('-').join('')-y['Set Score'].split('-').join('') ;
      return x['SITE_NUM'] - y['SITE_NUM'];
    });

    data_set = JSON.parse(JSON.stringify(value));

    return chart;
  };

  chart.push = function(value) {
    var _value = JSON.parse(JSON.stringify(value));
    if (!arguments.length) return false;
    if (_value.constructor === Array) {
      for (var i = 0; i < _value.length; i++) {
        data_set.push(_value[i]);
        _data_set.push(_value[i]);
      }
    } else {
      data_set.push(_value);
      _data_set.push(_value);
    }
    return true;
  }

  chart.pop = function() {
    if (!data_set.length) return;
    var count = data_set.length;
    _data_set.pop();
    return data_set.pop();
  };

  chart.update = function(resize) {
    if (typeof update === 'function') update(resize);
  }

  chart.duration = function(value) {
    if (!arguments.length) return transition_time;
    transition_time = value;
    return chart;
  }

  // END ACCESSORS
  var compute_histplot = function(data, value, width, histValueRange, numBins) {

    value = value || Number;
    // // CDF calculation copied from website
    var seriev = data.map(function(m) {
      // console.log(value + ":"+ m[value]);
      return m[value];
    }).sort(d3.ascending);

    var xScale = d3.scaleLinear().domain(histValueRange).range([0, width]);
    var hist_data = d3.histogram().thresholds(xScale.ticks(numBins))(seriev);

    for (var i = 0; i < hist_data.length; i++) {
      hist_data[i].site = data[0]["SITE_NUM"];
    }
    //
    // var jstat = this.jStat(seriev);


    hist_data.site = data[0]["SITE_NUM"];


    return hist_data
    // return scatterData
  }



  var compute_boxplot = function(data, iqr_scaling_factor, value) {

  }

  return chart;
}
