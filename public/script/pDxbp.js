!function() {

   // module container
   var boxPlotFunctions = {};

   boxPlotFunctions.removeTooltip = removeTooltip;
   function removeTooltip (d, i, element) {
      if (!$(element).popover) return;
      $('.popover').each(function() {
         $(this).remove();
      });
   }

   boxPlotFunctions.showTooltip = showTooltip;
   function showTooltip (d, i, element, constituents, options) {
      if (!$(element).popover) return;
      $(element).popover({
         placement: 'auto top',
         container: '#' + constituents.elements.domParent.attr('id'),
         trigger: 'manual',
         html : true,
         content: function() {
            var identifier = options.data.identifier && d[options.data.identifier] ?
               d[options.data.identifier] : 'undefined';
            var value = options.axes.y.label && d[options.axes.y.label] ?
               options.axes.y.tickFormat(d[options.axes.y.label]) : '';

            var message = "<span style='font-size: 11px; text-align: center;'>";
            message += d[options.data.identifier] + ': ' + d[options.axes.y.label] + "</span>";

            return message;
         }
      });
      $(element).popover('show');
   }

   boxPlotFunctions.defineTooltip = defineTooltip;
   function defineTooltip(constituents, options, events) {
       var tip = d3.tip().attr('class','explodingBoxplot tip')
            .direction('n')
            .html(tipFunction)

       function tipFunction(d) {
          var color = options.data.color_index && d[options.data.color_index] ?
             constituents.scales.color(d[options.data.color_index]) : 'blue';
          var identifier = options.data.identifier && d[options.data.identifier] ?
             d[options.data.identifier] : 'undefined';
          var value = options.axes.y.label && d[options.axes.y.label] ?
             options.axes.y.tickFormat(d[options.axes.y.label]) : '';
          var message = ' <span style="color:' + color + '">' + identifier +
                        '</span><span style="color:#DDDDDD;" > : ' + value + '</span>';
                          console.log(message);
          return message;
       }

       events.point.mouseover = tip.show;
       events.point.mouseout = tip.hide;

       if (constituents.elements.chartRoot) constituents.elements.chartRoot.call(tip);
   }

   boxPlotFunctions.defaultDistribution = defaultDistribution;
   function defaultDistribution(tooltip,testName) {

      var container = d3.select('#pointDistributions');

      d3.json(default_distributions, function(error, result) {
         if (error || !result) {
           console.log(error);
           return;
         }

         var xbp = explodingBoxplot();
         boxPlotFunctions.xbp = xbp;

         xbp.events({ 'update': { 'ready': defineTooltip } });

         // if (tooltip) {
         //    if (tooltip == 'popover') xbp.events({ 'point': { 'mouseover': showTooltip, 'mouseout': removeTooltip } });
         //    if (tooltip == 'd3-tip') xbp.events({ 'update': { 'ready': defineTooltip } });
         // }
// console.log(result.limit[0][testName]);
         xbp.options(
            {
               id:   'demo',
              loLim :result.limit[0][testName],
               hiLim :result.limit[1][testName],


               data: {
                  // group: 'Set Score',
                  group: 'Site',
                  color_index: 'Site',
                  identifier: 'h2h'
               },
               width: 700,
               height: 480,
               axes: {
                  // x: { label: 'Set Score' },
                  // y: { label: 'Total Points' }
                  x: { label: 'Site' },
                    y: { label: testName }

               }
            }
         );

         xbp.data(result.data); // load data into javascript
         xbp.limit(result.limit); // load limit into javascript
         container.call(xbp);
         xbp.update();

      });
   }

   boxPlotFunctions.demoSetup = demoSetup;
   function demoSetup() {
      var data;
      var original_width;
      var original_height;

      var vizcontrol = d3.select('#controls');
      var viztable = vizcontrol.append('table').attr('align', 'center');

      var dataRow1 = viztable.append('tr').append('td').append('hr');
      var dataRow1 = viztable.append('tr').append('td').attr('align', 'left')
        .html(' LoLimit : ');
      var dataRow1 = viztable.append('tr').append('td').attr('align', 'left')
        .html('hiLimit : ');
      var dataRow1 = viztable.append('tr').append('td').attr('align', 'left')
        .html('Mean : ');
      var dataRow1 = viztable.append('tr').append('td').attr('align', 'left')
          .html('CPL : ');
      var dataRow1 = viztable.append('tr').append('td').attr('align', 'left')
          .html('CPU : ');
      var dataRow1 = viztable.append('tr').append('td').attr('align', 'left')
        .html('CPK : ');
      var dataRow1 = viztable.append('tr').append('td').append('hr');

      var controlRow1 = viztable.append('tr').append('td').style('white-space','nowrap').attr('align', 'left');
      controlRow1.append('label').html('&nbsp; LoLim:').style('font-size', '12px');
         // console.log("lolim is " +boxPlotFunctions.xbp.options({loLim}));
      controlRow1.append('input').attr('name', 'loLimit').attr('id', 'loLimit').attr('type', 'text').attr('value', '');

      document.getElementById("loLimit").addEventListener("change", function(e) {
          boxPlotFunctions.xbp.loLim(e.target.value);
          boxPlotFunctions.xbp.limitRangeType('custom');
          boxPlotFunctions.xbp.update();
      });

      var controlRow2 = viztable.append('tr').append('td').attr('align', 'left');
      controlRow2.append('label').html('&nbsp; HiLim:').style('font-size', '12px');
      controlRow2.append('input').attr('name', 'hiLimit').attr('id', 'hiLimit').attr('type', 'text').attr('value', "").style('margin-left','10px');
      document.getElementById("hiLimit").addEventListener("change", function(e) {
         // boxPlotFunctions.xbp.events({ 'update': { 'ready': defineTooltip } });
            boxPlotFunctions.xbp.hiLim(e.target.value);
               boxPlotFunctions.xbp.limitRangeType('custom');
         boxPlotFunctions.xbp.update();
      });
      var controlRow3 = viztable.append('tr').append('td').append('hr');

      // var controlRow1 = viztable.append('tr').append('td').attr('align', 'left');
      // controlRow1.append('input').attr('name', 'tooltip').attr('id', 'popover').attr('type', 'radio').attr('value', 'popover');
      // controlRow1.append('label').html('&nbsp; Bootstrap Popover').style('font-size', '12px');
      // document.getElementById("popover").addEventListener("change", function() {
      //    boxPlotFunctions.xbp.events({ 'point': { 'mouseover': showTooltip, 'mouseout': removeTooltip }, 'update': { 'ready': null } });
      // });
      //
      // var controlRow2 = viztable.append('tr').append('td').attr('align', 'left');
      // controlRow2.append('input').attr('name', 'tooltip').attr('id', 'd3tip').attr('type', 'radio').attr('value', 'd3tip').attr('checked', 'checked');
      // controlRow2.append('label').html('&nbsp; d3-tip Tooltip').style('font-size', '12px');
      // document.getElementById("d3tip").addEventListener("change", function() {
      //    boxPlotFunctions.xbp.events({ 'update': { 'ready': defineTooltip } });
      //    boxPlotFunctions.xbp.update();
      // });
      // var controlRow3 = viztable.append('tr').append('td').append('hr');
      //
      // var controlRow4 = viztable.append('tr').append('td').attr('align', 'left');
      // controlRow4.append('input').attr('name', 'colors').attr('id', 'shuffle').attr('type', 'radio').attr('value', 'shuffle');
      // controlRow4.append('label').html('&nbsp; Shuffle Colors').style('font-size', '12px');
      // document.getElementById("shuffle").addEventListener("change", function() {
      //    var shuffle_colors = {
      //       7: "#a6cee3", 4: "#ff7f00", 1: "#b2df8a", 3: "#1f78b4", 2: "#fdbf6f",  0: "#33a02c",
      //       5: "#cab2d6", 8: "#6a3d9a", 9: "#fb9a99", 6: "#e31a1c", 11: "#ffff99", 10: "#b15928"
      //    };
      //    boxPlotFunctions.xbp.colors(shuffle_colors);
      //    boxPlotFunctions.xbp.update();
      // });
      //
      // var controlRow5 = viztable.append('tr').append('td').attr('align', 'left');
      // controlRow5.append('input').attr('name', 'colors').attr('id', 'default').attr('type', 'radio').attr('value', 'default').attr('checked', 'checked');
      // controlRow5.append('label').html('&nbsp; Default Colors').style('font-size', '12px');
      // document.getElementById("default").addEventListener("change", function() {
      //    boxPlotFunctions.xbp.colors({foo: 'bogus'});
      //    boxPlotFunctions.xbp.update();
      // });
      //
      // var controlRow4 = viztable.append('tr').append('td').append('hr');

      var controlRow4 = viztable.append('tr').append('td').attr('align', 'left');
      controlRow4.append('input').attr('name', 'size').attr('id', 'limitRadio').attr('type', 'radio').attr('value', 'limit');
      controlRow4.append('label').html('&nbsp; limit').style('font-size', '12px');
      document.getElementById("limitRadio").addEventListener("change", function() {
         boxPlotFunctions.xbp.limitRangeType('limit');
         boxPlotFunctions.xbp.update();
      });

      var controlRow5 = viztable.append('tr').append('td').attr('align', 'left');
      controlRow5.append('input').attr('name', 'size').attr('id', 'zoomRadio').attr('type', 'radio').attr('value', 'zoom');
      controlRow5.append('label').html('&nbsp; zoom').style('font-size', '12px');
      document.getElementById("zoomRadio").addEventListener("change", function() {
        boxPlotFunctions.xbp.limitRangeType('zoom');
        boxPlotFunctions.xbp.update();
      });
      // var controlRow8 = viztable.append('tr').append('td').append('hr');

      // var controlRow9 = viztable.append('tr').append('td').attr('align', 'left');
      // controlRow9.append('input').attr('name', 'size').attr('id', 'resize').attr('type', 'radio').attr('value', 'resize');
      // controlRow9.append('label').html('&nbsp; Resize').style('font-size', '12px');
      // document.getElementById("resize").addEventListener("change", function() {
      //    original_width = boxPlotFunctions.xbp.width();
      //    original_height = boxPlotFunctions.xbp.height();
      //    boxPlotFunctions.xbp.width(400).height(300);
      //    boxPlotFunctions.xbp.update();
      // });
      //
      // var controlRow8 = viztable.append('tr').append('td').attr('align', 'left');
      // controlRow8.append('input').attr('name', 'size').attr('id', 'original').attr('type', 'radio').attr('value', 'original').attr('checked', 'checked');
      // controlRow8.append('label').html('&nbsp; Original Dimensions').style('font-size', '12px');
      // document.getElementById("original").addEventListener("change", function() {
      //    if (original_width && original_height) {
      //       boxPlotFunctions.xbp.width(original_width).height(original_height);
      //       boxPlotFunctions.xbp.update();
      //    }
      // });
      //
      // var controlRow9 = viztable.append('tr').append('td').append('hr');
      //
      // var controlRow10 = viztable.append('tr').append('td').attr('align', 'left');
      // controlRow10.append('input').attr('name', 'data').attr('id', 'slice').attr('type', 'radio').attr('value', 'slice');
      // controlRow10.append('label').html('&nbsp; Slice Data').style('font-size', '12px');
      // document.getElementById("slice").addEventListener("change", function() {
      //    data = boxPlotFunctions.xbp.data();
      //    boxPlotFunctions.xbp.data(data.slice(1000, 3000));
      //    boxPlotFunctions.xbp.update();
      // });
      //
      // var controlRow11 = viztable.append('tr').append('td').attr('align', 'left');
      // controlRow11.append('input').attr('name', 'data').attr('id', 'full').attr('type', 'radio').attr('value', 'full').attr('checked', 'checked');
      // controlRow11.append('label').html('&nbsp; Original Data').style('font-size', '12px');
      // document.getElementById("full").addEventListener("change", function() {
      //    if (data) {
      //       boxPlotFunctions.xbp.data(data);
      //       boxPlotFunctions.xbp.update();
      //    }
      // });

      // var controlRow12 = viztable.append('tr').append('td').append('hr');

      // var controlRow13 = viztable.append('tr').append('td').attr('align', 'left');
      // controlRow13.append('input').attr('name', 'attribute').attr('id', 'shots').attr('type', 'radio').attr('value', 'shots');
      // controlRow13.append('label').html('&nbsp; Change Attribute').style('font-size', '12px');
      // document.getElementById("shots").addEventListener("change", function() {
      //    boxPlotFunctions.xbp.options( { axes: { y: { label: 'Total Shots' } } });
      //    boxPlotFunctions.xbp.update();
      // });
      //
      // var controlRow14 = viztable.append('tr').append('td').attr('align', 'left');
      // controlRow14.append('input').attr('name', 'attribute').attr('id', 'points').attr('type', 'radio').attr('value', 'points').attr('checked', 'checked');
      // controlRow14.append('label').html('&nbsp; Original Attribute').style('font-size', '12px');
      // document.getElementById("points").addEventListener("change", function() {
      //    boxPlotFunctions.xbp.options( { axes: { y: { label: 'Total Points' } } });
      //    boxPlotFunctions.xbp.update();
      // });


      var controlRow6 = viztable.append('tr').append('td').append('hr');
      var controlRow6 = viztable.append('tr').append('td').attr('align', 'left')
                          .html('Explode: click on boxes<br/>Reset: double-click background');

   }

   if (typeof define === "function" && define.amd) define(boxPlotFunctions); else if (typeof module === "object" && module.exports) module.exports = boxPlotFunctions;
   this.boxPlotFunctions = boxPlotFunctions;

}();
