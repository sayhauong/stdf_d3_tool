function explodingCdfplot() {

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
            cdfGroups = d3.group(data_set, d => d[options.data.group]);
        } else {
          cdfGroups = [{
            key: '',
            values: data_set
          }]
        }

        // let keys = Array.from(groups.keys());
        let cdfGroupsArray = Array.from(cdfGroups, ([key, value]) => ({
          key,
          value
        }));

        var scatterData1;
        var numBins = 10000;
        var cdfValueRange = d3.extent(data_set.map(function(m) {
          return m[options.axes.y.label];
        }));
        cdfValueRange[1] = cdfValueRange[1] + Math.abs(cdfValueRange[1]) * 0.1;
        cdfValueRange[0] = cdfValueRange[0] - Math.abs(cdfValueRange[1]) * 0.1;

        var xScale = d3.scaleLinear().domain(cdfValueRange).range([0, options.width]);
        var xScale2 = d3.scaleLinear().domain(cdfValueRange).range([0, options.width]);
        constituents.scales.X = xScale;

        //create CDF info
        cdfGroupsArray = cdfGroupsArray.map(function(g) {
          var o = compute_cdfplot(g.value, options.axes.y.label, options.width, cdfValueRange, numBins);
          o['group'] = g.key;
          return o;
        });


        var cdfNonLinDom = [-0.0001, 0.0001, 0.001, 0.01, 0.025, 0.1, 0.25, 0.50, 0.75, 0.90, 0.975, 0.999, 0.9999, 0.99999, 1];

        var yStep = (options.height - options.margins.top - options.margins.bottom) / cdfNonLinDom.length;
        var cdfNonLinRange = [];
        cdfNonLinDom.forEach(function(value, i) {
          cdfNonLinRange.push((options.height - options.margins.top - options.margins.bottom) - i * yStep);
        });
        var yScale = d3.scaleLinear().domain(cdfNonLinDom).range(cdfNonLinRange).nice();


        constituents.scales.Y = yScale;


        colorScale = d3.scaleOrdinal()
        .domain(cdfGroupsArray.map(function(d) {
          return d.key;
        }))
        .range(Object.keys(colors).map(function(m) {
          return colors[m];
        }));
        constituents.scales.color = colorScale;

        var zoomBeh = d3.zoom()
          .scaleExtent([-1, 30])
          .on("zoom", zoom)

        function zoom(event,d ) {
          // console.log("zoom detected");
          var newX = event.transform.rescaleX(xScale);

          xScale
            .domain(event.transform.rescaleX(xScale2).domain());

          chartRoot
            .select(".explodingCdfplot.x.axis")
            .call(xAxis);

          chartRoot.selectAll(".dot")
            // .attr("transform", transform);
            .attr("cx", function(d) {
              return xScale(d.x);
            })
        }

        chartRoot.call(zoomBeh);

        if (events.update.ready) {
          events.update.ready(constituents, options, events);
        }
        var xAxis = d3.axisBottom().scale(xScale)
        var yAxis =  d3.axisLeft().scale(yScale)
          .tickFormat(d3.format(".5"))
          .tickValues(cdfNonLinDom)


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
                .attr("x", -options.margins.top *0.95 - d3.mean(yScale.range()))
                .attr("dy", ".71em")
                .attr('y', -options.margins.left+5 )
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
          .attr("x", -options.margins.top *0.95 - d3.mean(yScale.range()))
          .attr("dy", ".71em")
          .attr('y', -options.margins.left+5 )
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


        var cdfContent = chartWrapper
        .selectAll('.cdfcontent')
          .data(cdfGroupsArray)
          .join(
            function(enter) {
              return enter
              .append('g')
              .attr("clip-path", "url(#clip)")
              .attr('class', 'explodingCdfplot cdfcontent')
              .attr('id', function(d, i) {
                return 'explodingCdfplot' + options.id + i
              })

            },
            function(update) {
              return update
            },
            function(exit) {
              return exit
                .remove();
            }
          )
          // .attr('transform', function(d) {
          //   return 'translate(' + xScale(d.group) + ',0)';
          // })
          .each(create_scatterplot)


        function create_jitter(g, i) {

          d3.select(this).append('g')
            .attr('class', 'explodingCdfplot outliers-points')
          d3.select(this).append('g')
            .attr('class', 'explodingCdfplot normal-points')
        };

        function init_jitter(s) {
          s.attr('class', 'explodingCdfplot point')
            .attr('r', options.datapoints.radius)
            .attr('fill', function(d) {
              return colorScale(d[options.data.color_index])
            })
            .on('mouseover', function(d, i, self) {
              if (events.point && typeof events.point.mouseover == 'function') {
                events.point.mouseover(d, i, d3.select(this), constituents, options);
              }
            })
            .on('mouseout', function(d, i, self) {
              if (events.point && typeof events.point.mouseout == 'function') {
                events.point.mouseout(d, i, d3.select(this), constituents, options);
              }
            })
            .on('click', function(d, i, self) {
              if (events.point && typeof events.point.click == 'function') {
                events.point.click(d, i, d3.select(this), constituents, options);
              }
            })
        };

        function draw_jitter(s) {
          s.attr('r', options.datapoints.radius)
            .attr('fill', function(d) {
              return colorScale(d[options.data.color_index])
            })
            .attr('cx', function(d) {
              var w = xScale.rangeBand();
              return Math.floor(Math.random() * w)
            })
            .attr('cy', function(d) {
              return yScale(d[options.axes.y.label])
            })
        };



        function create_cdfplot(g, i) {

          var s = d3.select(this).append('g')
            .attr('class', 'explodingCdfplot box')
            .attr('id', 'explodingCdfplot_box' + options.id + i)
            .selectAll('.box')
            .data([g])
            .enter()

          // s.append('line').attr('class', 'explodingBoxplot line max vline') //max vline
          s.append('path').attr('class', 'line')

        };

        function draw_cdfplot(g, i) {
          //Draw svg
          d3.select('#explodingCdfplot_box' + options.id + i)
            .on('click', function(d) {
              // explode_boxplot(i);
              // exploded_box_plots.push(i);
            })

          var s = d3.select(this);

          // var ycum = d3.scale.linear().domain([0, 1]).range([options.height, 0]);
          var ycum = d3.scale.linear().domain([0, 1]).range([options.height - options.margins.top - options.margins.bottom, 0]);

          var guide = d3.svg.line()
            .x(function(d) {

              return xScale(d.x);
              // return xScale(d.x);
            })
            .y(function(d) {

              return ycum(d.cum);
            })
            .interpolate('basis');

          s.select('path')
            .datum(g)
            .attr('d', guide)
            .attr('stroke', function(d) {
              return colorScale(d.site);
            });

        };

        function create_scatterplot(g, i) {



          var highlight = function(e,d) {
            // console.log("mouseover detected");
            // selected_specie = d.site
            d3.selectAll(".dot")
              .transition()
              .duration(200)
              .attr('fill-opacity', "0.25")
              .attr("r",2.5)

            d3.selectAll("#dot"+ d.site)
              .transition()
              .duration(200)
                .attr('fill-opacity', "1.0")
              .attr("r", 5)
              if (events.point && typeof events.point.mouseover == 'function') {
                   events.point.mouseover(e,d, d3.select(this), constituents, options);
                }
          }

          // Highlight the specie that is hovered
          var doNotHighlight = function(d) {
            d3.selectAll(".dot")
              .transition()
              .duration(200)
                .attr('fill-opacity', "1.0")
              .attr("r", 4)

              if (events.point && typeof events.point.mouseout == 'function') {
                   events.point.mouseout(d, i, d3.select(this), constituents, options);
                }
          }

          var color = colorScale(g.group);

          var ycum = d3.scaleLinear().domain(cdfNonLinDom).range(cdfNonLinRange);

          var s = d3.select('#' + 'explodingCdfplot' + options.id + i)
          .selectAll('circle')
          .data(g)
          .join(
            function(enter) {
              return enter
              .append("circle")
               .attr('class', 'dot')
                 .attr('id', 'dot'+g.group)
                . attr("cx", function(d) {
                     return xScale(d.x);
                   })
                   .attr("cy", function(d) {
                     // console.log(ycum(d.cum));
                     return ycum(d.cum);
                   })
                   .attr("r", function(d) {
                     return (4);
                   })
                   .style("fill", function(d) {
                     return color;
                   })

            },
            function(update) {
              return update
            .attr("cx", function(d) {
                  return xScale(d.x);
                })
                .attr("cy", function(d) {
                  // console.log(ycum(d.cum));
                  return ycum(d.cum);
                })
                .attr("r", function(d) {
                  return (4);
                })
                .style("fill", function(d) {
                  return color;
                })
            },
            function(exit) {
              return exit
                .remove();
            }
          )
          .on("mouseover", highlight)
          .on("mouseleave", doNotHighlight )


        };

        function draw_scatterplot(g, i) {
          //Draw svg
          d3.select('#explodingCdfplot_box' + options.id + i)
            .on('click', function(d) {
              // explode_boxplot(i);
              // exploded_box_plots.push(i);
            })

          var s = d3.select(this);


          // var ycum = d3.scale.linear().domain([0, 1]).range([options.height - options.margins.top - options.margins.bottom, 0]);
          var ycum = d3.scale.linear().domain(cdfNonLinDom).range(cdfNonLinRange);

          var guide = d3.svg.line()
            .x(function(d) {
              return xScale(d.x);
            })
            .y(function(d) {

              return ycum(d.cum);
            })
            .interpolate('basis');

          s.select('path')
            .datum(g)
            .attr('d', guide)
            .attr('stroke', function(d) {
              return colorScale(d.site);
            });

        };

        function hide_boxplot(g, i) {
        };

        function explode_boxplot(i) {
        };

        function jitter_plot(i) {
        };

        function implode_boxplot(elem, g) {

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
  var compute_cdfplot = function(data, value, width, cdfValueRange, numBins) {

    value = value || Number;
    // // CDF calculation copied from website
    var seriev = data.map(function(m) {
      // console.log(value + ":"+ m[value]);
      return m[value];
    }).sort(d3.ascending);

    var tmpXScale = d3.scaleLinear().domain(cdfValueRange).range([0, width]);

    var cdf_data = d3.bin().thresholds(tmpXScale.ticks(numBins))(seriev);

    cdf_data[0]['y'] = cdf_data[0].length;
    for (var i = 1; i < cdf_data.length; i++) {
      cdf_data[i]['y'] = cdf_data[i - 1].y + cdf_data[i].length;
    }

    var jstat = this.jStat(seriev);

    for (var i = 0; i < cdf_data.length; i++) {
      // console.log(jstat.normal(jstat.mean(), jstat.stdev()));
      // cdf_data[i]['cum'] = jstat.normal(jstat.mean(), jstat.stdev()).cdf(cdf_data[i].x);
      cdf_data[i]['cum'] = cdf_data[i].y / seriev.length;
    }

    cdf_data.site = data[0]["SITE_NUM"];


    let scatterData = [];
      cdf_data.map(function(d) {
        if (d.length > 0) {
          for (var i = 0; i < d.length; i++) {
            scatterData.push({
              x: d[i],
              cum: d.cum,
              site: cdf_data.site
            })
          }
        }
      })
    // return cdf_data
    return scatterData
  }



  var compute_boxplot = function(data, iqr_scaling_factor, value) {

  }

  return chart;
}
