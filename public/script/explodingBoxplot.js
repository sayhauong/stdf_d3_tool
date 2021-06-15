function explodingBoxplot() {

  // options which should be accessible via ACCESSORS
  var data_set = [];
  var _data_set = [];

  var limit_set = [];
  var _limit_set = [];

  var groups;
  var exploded_box_plots = [];

  var options = {

    id: '',
    class: 'xBoxPlot',

    width: window.innerWidth,
    height: window.innerHeight,
    loLim: undefined,
    hiLim: undefined,
    domain_range: undefined,
    limitRangeType: 'zoom', //limit,zoom, custom initial setting for first plot

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


      // use any shape



      mobileScreen = ($(window).innerWidth() < options.mobileScreenMax ? true : false);

      // boolean resize used to disable transitions during resize operation
      update = function(resize) {

        chartRoot
          .attr('width', (options.width + options.margins.left + options.margins.right))
          .attr('height', (options.height + options.margins.top + options.margins.bottom));


        chartWrapper

          .attr("transform", "translate(" + options.margins.left + "," + options.margins.top + ")")


        var clip = chartWrapper.append("defs").append("svg:clipPath")
          .attr("id", "clip")
          .append("svg:rect")
          .attr("id", "clip-rect")
          .attr("x", "-50")
          .attr("y", "0")
          .attr("width", options.width)
          .attr("height", options.height - options.margins.bottom - options.margins.top);

        if (events.update.begin) {
          events.update.begin(constituents, options, events);
        }

        if (options.data.group) {
          // groups = d3.group()
          //     .key(function(k) { return k[options.data.group]; })
          //     .entries(data_set)
          groups = d3.group(data_set, d => d[options.data.group]);
          // .key(function(k) { return k[options.data.group]; })
          // .entries(data_set)
        } else {
          groups = [{
            key: '',
            values: data_set
          }]
        }

        let keys = Array.from(groups.keys());
        let groupsArray = Array.from(groups, ([key, value]) => ({
          key,
          value
        }));

        // var xScale = d3.scaleOrdinal()
        //      .domain([groups].map(function(d) { return d.key } ))
        //       // .domain(groups.get(function(d) { return d.key } ))
        //      .rangeRoundBands([0, options.width - options.margins.left - options.margins.right], options.display.boxpadding);
        var xScale = d3.scaleBand()
          .domain(groupsArray.map(function(d) {
            return d.key
          }))
          // .domain(Array.from( groups.keys() ))
          // .domain(groups.get(function(d) { return d.key } ))
          .rangeRound([0, options.width - options.margins.left - options.margins.right], options.display.boxpadding)
          .padding(0.1);;
        constituents.scales.X = xScale;

        //create boxplot data
        groupsArray = groupsArray.map(function(g) {
          var o = compute_boxplot(g.value, options.display.iqr, options.axes.y.label);
          o['group'] = g.key;
          return o;
        });

        switch (options.limitRangeType) {
          case 'limit':
            // domain_range =[limit_set[0][options.axes.y.label],limit_set[1][options.axes.y.label]];
            domain_range = [limit_set[options.axes.y.label]['LO_LIMIT'], limit_set[options.axes.y.label]['HI_LIMIT']];
            document.getElementById("limitRadio").checked = true;
            document.getElementById("zoomRadio").checked = false;
            break;
          case 'zoom':
            domain_range = d3.extent(data_set.map(function(m) {
              return m[options.axes.y.label];
            }))
            document.getElementById("limitRadio").checked = false;
            document.getElementById("zoomRadio").checked = true;
            break;
          case 'custom':
            domain_range = [options.loLim, options.hiLim]
            document.getElementById("limitRadio").checked = false;
            document.getElementById("zoomRadio").checked = false;
            break;
          default:
            domain_range = d3.extent(data_set.map(function(m) {
              return m[options.axes.y.label];
            }))
            break;
        }
        // d3.select('#loLimit').attr('value','');
        //   d3.select('#hiLimit').attr('value','');
        //   d3.select('#hiLimit').attr('value',domain_range[1]);
        // d3.select('#loLimit').attr('value',domain_range[0]);
        document.getElementById('hiLimit').value = domain_range[1].toFixed(4);
        document.getElementById('loLimit').value = domain_range[0].toFixed(4);
        // loLim = limit_set[0][options.axes.y.label];
        // hiLim = limit_set[1][options.axes.y.label];
        // domain_range =[loLim,hiLim];

        var yScale = d3.scaleLinear()
          // .domain([limit_set[0][options.axes.y.label],limit_set[1][options.axes.y.label]])
          .domain(domain_range)
          .range([options.height - options.margins.top - options.margins.bottom, 0])
          .nice();
        constituents.scales.Y = yScale;

        colorScale = d3.scaleOrdinal()

          .domain(groupsArray.map(function(d) {
            return d.key;
          }))
          .range(Object.keys(colors).map(function(m) {
            return colors[m];
          }));

        constituents.scales.color = colorScale;

        // const clip = DOM.uid("clip");


        // const extent = [[options.margins.left, options.margins.top],[options.width-options.margins.right, options.height - options.margins.top - options.margins.bottom]];

        var zoomBeh = d3.zoom()
          .extent([
            [0, 0],
            [0, options.height - options.margins.top - options.margins.bottom]
          ])
          // .scaleExtent([-0.1, 30])
          .scaleExtent([1, 8])
          // .translateExtent(extent)
          // .extent(extent)
          .on("zoom", zoom)

        // const gy = chartRoot.append("g");

        function zoom(event) {


          var newY = event.transform.rescaleY(yScale);
          // console.log(newY);
          // yScale.range([options.height - options.margins.top - options.margins.bottom, 0].map(d => event.transform.applyY(d)));
          yScale.range([options.height - options.margins.top - options.margins.bottom, 0].map(d => event.transform.applyY(d)));


          chartRoot
            .select(".explodingBoxplot.y.axis")
            .call(yAxis, newY);

          // update limit textview
          document.getElementById('hiLimit').value = domain_range[1];
          document.getElementById('loLimit').value = domain_range[0];

          boxContent
            // .attr("transform", transform)
            // .attr('transform',function(d){ return 'translate(' + xScale(d.group) + ',0)'; })
            //    .each(create_jitter)
            //    .each(create_boxplot)
            .each(draw_boxplot)

          // chartRoot.selectAll(".line")
          //     .attr("transform", function(d) { return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")"; })
          //
          // }

          chartRoot.selectAll("circle.point")
            // .attr("transform", event.transform)
            .attr('cx', function(d) {
              var w = xScale.bandwidth();
              return Math.floor(Math.random() * 0.8 * w)
            })
            .attr('cy', function(d) {
              return 0.8 * yScale(d[options.axes.y.label])
            })
        }

        chartRoot
          .call(zoomBeh).on("dblclick.zoom", null);

        if (events.update.ready) {
          events.update.ready(constituents, options, events);
        }

        var xAxis = d3.axisBottom().scale(xScale)
        var yAxis = d3.axisLeft().scale(yScale).tickFormat(options.axes.y.tickFormat)


        resetArea
          .on('dblclick', implode_boxplot);


        update_xAxis = chartWrapper.selectAll('#xpb_xAxis')
          .data([0])
          .join(
            function(enter) {
              return enter.append('g')
                .attr('class', 'explodingBoxplot x axis')
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



        update_yAxis = chartWrapper

          .selectAll('#xpb_yAxis')
          // .attr("clip-path", clip)
          .data([0])
          .join(
            function(enter) {
              return enter.append('g')
                .attr("clip-path", "url(#clip)")
                .attr('class', 'explodingBoxplot y axis')
                .attr('id', 'xpb_yAxis')
                .call(yAxis, yScale)
                .append("text")
                .attr('class', 'axis text')
                .attr("transform", "rotate(-90)")
                .attr("x", -options.margins.top - d3.mean(yScale.range()))
                .attr("dy", ".71em")
                .attr('y', -options.margins.left + 5)
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
          .attr("x", -options.margins.top - d3.mean(yScale.range()))
          .attr("dy", ".71em")
          .attr('y', -options.margins.left + 5)
          .style("text-anchor", "middle")
          .text(options.axes.y.label);


        //         update_lim = chartWrapper
        //                    .selectAll('#xbp_lim')
        //                   .data(domain_range);
        //
        //      update_lim.enter()
        //             .append('g')
        //               .attr('class','explodingBoxplot limit-line')
        //               .attr('id',  'xpb_lim')
        //
        //      update_lim.exit()
        //         .remove();
        //
        //      update_lim
        //      .each(create_limit);
        //
        //
        //      function create_limit(g, i) {
        //        console.log('cr8limit: ' + g + ' ,i : ' + i);
        //        var s = d3
        //        .select(this)
        //        .append('line')
        //          .attr('id', 'xpb_lim' + i)
        //          .data([g])
        //          .enter();
        //
        //    var s = d3.select('#xpb_lim' + i);
        //
        //    s.style("stroke", "lightgreen")
        //                .style("stroke-width", 2)
        //                .attr("x1", -15)
        //                .attr("y1",yScale(g)
        //
        //              )
        //                .attr("x2", 600)
        //                .attr("y2",yScale(g)
        //
        //              );
        //
        //      };





        boxContent = chartWrapper
          .selectAll('.boxcontent')
          .data(groupsArray)
          .join(
            function(enter) {
              return enter
                .append('g')
                .attr("clip-path", "url(#clip)")
                .attr('class', 'explodingBoxplot boxcontent')
                .attr('id', function(d, i) {
                  // console.log(d, );
                  // console.log( i )
                  return 'explodingBoxplot' + options.id + i
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
          .attr('transform', function(d) {
            return 'translate(' + xScale(d.group) + ',0)';
          })
          .each(create_jitter)
          .each(create_boxplot)
          .each(draw_boxplot)





        function create_jitter(g, i) {

          d3.select(this).append('g')
            .attr('class', 'explodingBoxplot outliers-points')
          d3.select(this).append('g')
            .attr('class', 'explodingBoxplot normal-points')
        };

        function init_jitter(s) {
          s.attr('class', 'explodingBoxplot point')
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
              // if (events.point && typeof events.point.click == 'function') {
              //    events.point.click(d, i, d3.select(this), constituents, options);
              // }
            })
        };

        function draw_jitter(s) {
          s.attr('r', options.datapoints.radius)
            .attr('fill', function(d) {
              return colorScale(d[options.data.color_index])
            })
            .attr('cx', function(d) {
              var w = xScale.bandwidth();
              return Math.floor(Math.random() * w)
            })
            .attr('cy', function(d) {
              return yScale(d[options.axes.y.label])
            })
        };

        function create_boxplot(g, i) {
          var s = d3.select(this).append('g')
            .attr('class', 'explodingBoxplot box')
            .attr('id', 'explodingBoxplot_box' + options.id + i)
            .selectAll('.box')
            .data([g])
            .enter()

          s.append('rect')
            .attr('class', 'explodingBoxplot box')
            .attr('fill', function(d) {
              return colorScale(d.normal[0][options.data.color_index])
            })
          s.append('line').attr('class', 'explodingBoxplot median line') //median line
          s.append('line').attr('class', 'explodingBoxplot min line hline') //min line
          s.append('line').attr('class', 'explodingBoxplot line min vline') //min vline
          s.append('line').attr('class', 'explodingBoxplot max line hline') //max line
          s.append('line').attr('class', 'explodingBoxplot line max vline') //max vline
        };

        function draw_boxplot(s, i) {
          d3.select('#explodingBoxplot_box' + options.id + i)
            .on('click', function(d) {
              explode_boxplot(i);
              exploded_box_plots.push(i);
            })

          var s = d3.select(this);
          if (exploded_box_plots.indexOf(i) >= 0) {
            explode_boxplot(i);
            jitter_plot(i);
            return;
          } else {
            jitter_plot(i);
          }
          s.select('rect.box') // box
            .transition().duration(transition_time)
            .attr('x', 0)
            .attr('width', xScale.bandwidth())
            .attr('y', function(d) {
              return yScale(d.quartiles[2])
            })
            .attr('height', function(d) {
              return yScale(d.quartiles[0]) - yScale(d.quartiles[2]);
            })
            .attr('fill', function(d) {
              return colorScale(d.normal[0][options.data.color_index]);
            });
          s.select('line.median') // median line
            .transition().duration(transition_time)
            .attr('x1', 0).attr('x2', xScale.bandwidth())
            .attr('y1', function(d) {
              return yScale(d.quartiles[1])
            })
            .attr('y2', function(d) {
              return yScale(d.quartiles[1])
            })
          s.select('line.min.hline') // min line
            .transition().duration(transition_time)
            .attr('x1', xScale.bandwidth() * 0.25)
            .attr('x2', xScale.bandwidth() * 0.75)
            .attr('y1', function(d) {
              return yScale(Math.min(d.min, d.quartiles[0]))
            })
            .attr('y2', function(d) {
              return yScale(Math.min(d.min, d.quartiles[0]))
            })
          s.select('line.min.vline') // min vline
            .transition().duration(transition_time)
            .attr('x1', xScale.bandwidth() * 0.5)
            .attr('x2', xScale.bandwidth() * 0.5)
            .attr('y1', function(d) {
              return yScale(Math.min(d.min, d.quartiles[0]))
            })
            .attr('y2', function(d) {
              return yScale(d.quartiles[0])
            })
          s.select('line.max.hline') // max line
            .transition().duration(transition_time)
            .attr('x1', xScale.bandwidth() * 0.25)
            .attr('x2', xScale.bandwidth() * 0.75)
            .attr('y1', function(d) {
              return yScale(Math.max(d.max, d.quartiles[2]))
            })
            .attr('y2', function(d) {
              return yScale(Math.max(d.max, d.quartiles[2]))
            })
          s.select('line.max.vline') // max vline
            .transition().duration(transition_time)
            .attr('x1', xScale.bandwidth() * 0.5)
            .attr('x2', xScale.bandwidth() * 0.5)
            .attr('y1', function(d) {
              return yScale(d.quartiles[2])
            })
            .attr('y2', function(d) {
              return yScale(Math.max(d.max, d.quartiles[2]))
            })
        };

        function hide_boxplot(g, i) {
          var s = this
          s.select('rect.box')
            .attr('x', xScale.bandwidth() * 0.5)
            .attr('width', 0)
            .attr('y', function(d) {
              return yScale(d.quartiles[1])
            })
            .attr('height', 0)
          s.selectAll('line') //median line
            .attr('x1', xScale.bandwidth() * 0.5)
            .attr('x2', xScale.bandwidth() * 0.5)
            .attr('y1', function(d) {
              return yScale(d.quartiles[1])
            })
            .attr('y2', function(d) {
              return yScale(d.quartiles[1])
            })
        };

        function explode_boxplot(i) {
          d3.select('#' + 'explodingBoxplot' + options.id + i)
            .select('g.box').transition()
            .ease(d3.ease('back-in'))
            .duration((transition_time * 1.5))
            .call(hide_boxplot)

          var explode_normal = d3.select('#' + 'explodingBoxplot' + options.id + i)
            .select('.normal-points')
            .selectAll('.point')
            .data(groupsArray[i].normal)

          explode_normal.enter()
            .append('circle')

          explode_normal.exit()
            .remove()

          explode_normal
            .attr('cx', xScale.bandwidth() * 0.5)
            .attr('cy', yScale(groupsArray[i].quartiles[1]))
            .call(init_jitter)
            .transition()
            .ease(d3.ease('back-out'))
            .delay(function() {
              return (transition_time * 1.5) + 100 * Math.random()
            })
            .duration(function() {
              return (transition_time * 1.5) + (transition_time * 1.5) * Math.random()
            })
            .call(draw_jitter)
        };

        function jitter_plot(i) {
          var elem = d3.select('#' + 'explodingBoxplot' + options.id + i)
            .select('.outliers-points');

          var display_outliers = elem.selectAll('.point')
            .data(groupsArray[i].outlier)
            .join(
              function(enter) {
                return enter
                  .append('circle')
                  .attr('cx', xScale.bandwidth() * 0.5)
                  .attr('cy', yScale(groupsArray[i].quartiles[1]))
                  .call(init_jitter)
                  .call(enter => enter.transition()
                    .delay(function() {
                      return (transition_time * 1.5 * 10000) + 100 * Math.random()
                    })
                    .duration(function() {
                      return (transition_time * 1.5 * 10000) + (transition_time * 1.5) * Math.random()
                    })
                    .ease(d3.easeBackOut, (transition_time * 1.5) + 100 * Math.random())
                  )
                  .call(draw_jitter)

              },
              function(update) {
                return update.attr('cx', xScale.bandwidth() * 0.5)
                  .attr('cy', yScale(groupsArray[i].quartiles[1]))
                  .call(init_jitter)
                  .call(enter => enter.transition()

                    .delay(function() {
                      return (transition_time * 1.5 * 10000) + 100 * Math.random()
                    })
                    .duration(function() {
                      return (transition_time * 1.5 * 10000) + (transition_time * 1.5) * Math.random()
                    })
                    .ease(d3.easeBackOut, (transition_time * 1.5 * 10000) + 100 * Math.random()))
                  .call(draw_jitter)
              },
              function(exit) {
                return exit
                  .remove();
              }
            )



        };

        function implode_boxplot(elem, g) {
          exploded_box_plots = [];
          chartWrapper.selectAll('.normal-points')
            .each(function(g) {
              d3.select(this)
                .selectAll('circle')
                .transition()
                .ease(d3.ease('back-out'))
                .duration(function() {
                  return (transition_time * 1.5) + (transition_time * 1.5) * Math.random()
                })
                .attr('cx', xScale.bandwidth() * 0.5)
                .attr('cy', yScale(g.quartiles[1]))
                .remove()
            })

          chartWrapper.selectAll('.boxcontent')
            .transition()
            .ease(d3.ease('back-out'))
            .duration((transition_time * 1.5))
            .delay(transition_time)
            .each(draw_boxplot)
        };



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

  chart.loLim = function(value) {
    if (!arguments.length) return options.loLim;
    options.loLim = parseFloat(value);
    return chart;
  };

  chart.hiLim = function(value) {
    if (!arguments.length) return options.hiLim;
    options.hiLim = parseFloat(value);
    return chart;
  };

  chart.limitRangeType = function(value) {
    if (!arguments.length) return options.limitRangeType;
    options.limitRangeType = value;
    return chart;
  };

  chart.data = function(value) {
    if (!arguments.length) return data_set;
    // console.log(value);
    value.sort(function(x, y) {
      // return x['Set Score'].split('-').join('')-y['Set Score'].split('-').join('') ;
      return x['SITE_NUM'] - y['SITE_NUM'];
    });
    data_set = JSON.parse(JSON.stringify(value));

    // console.log(data_set);
    return chart;
  };

  chart.limit = function(value) {
    if (!arguments.length) return limit_set;

    limit_set = JSON.parse(JSON.stringify(value));
    domain_range = []
    // console.log(data_set);
    return chart;
  };

  // chart.push = function(value) {
  //    var _value = JSON.parse(JSON.stringify(value));
  //    if (!arguments.length) return false;
  //    if ( _value.constructor === Array ) {
  //       for (var i=0; i < _value.length; i++) {
  //          data_set.push(_value[i]);
  //          _data_set.push(_value[i]);
  //       }
  //    } else {
  //       data_set.push(_value);
  //       _data_set.push(_value);
  //    }
  //    return true;
  // }
  //
  // chart.pop = function() {
  //    if (!data_set.length) return;
  //    var count = data_set.length;
  //    _data_set.pop();
  //    return data_set.pop();
  // };

  chart.update = function(resize) {
    if (typeof update === 'function') update(resize);
  }

  chart.duration = function(value) {
    if (!arguments.length) return transition_time;
    transition_time = value;
    return chart;
  }

  // END ACCESSORS

  var compute_boxplot = function(data, iqr_scaling_factor, value) {
    iqr_scaling_factor = iqr_scaling_factor || 1.5;
    value = value || Number;

    var seriev = data.map(function(m) {
      return m[value];
    }).sort(d3.ascending);

    var quartiles = [
      d3.quantile(seriev, 0.25),
      d3.quantile(seriev, 0.5),
      d3.quantile(seriev, 0.75)
    ]

    var iqr = (quartiles[2] - quartiles[0]) * iqr_scaling_factor;

    // separate outliers
    var max = -Number.MAX_VALUE

    var min = Number.MAX_VALUE

    var groupMap_box_data = d3.group(data, function(d) {
      var v = d[value];
      var type = (v < quartiles[0] - iqr || v > quartiles[2] + iqr) ? 'outlier' : 'normal';
      if (type == 'normal' && (v < min || v > max)) {
        max = Math.max(max, v);
        min = Math.min(min, v);
      }

      return type;
      // {key, value}))
    })



    var box_data = {};
    box_data.key = data[0]['Site'];
    box_data.quartiles = quartiles
    box_data.iqr = iqr
    box_data.max = max
    box_data.min = min
    box_data.normal = groupMap_box_data.get("normal")
    box_data.outlier = groupMap_box_data.get("outlier")

    if (!box_data.outlier) box_data.outlier = []

    return box_data
  }

  return chart;
}
