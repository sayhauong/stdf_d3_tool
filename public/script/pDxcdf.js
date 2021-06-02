!function() {

   // module container
   var cdfPlotFunctions = {};

   cdfPlotFunctions.removeTooltip = removeTooltip;
   function removeTooltip (d, i, element) {
      if (!$(element).popover) return;
      $('.popover').each(function() {
         $(this).remove();
      });
   }

   cdfPlotFunctions.showTooltip = showTooltip;
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

   cdfPlotFunctions.defineTooltip = defineTooltip;
   function defineTooltip(constituents, options, events) {

       var tip = d3.tip().attr('class','explodingCdfplot tip')
            .direction('n')
            .html(tipFunction)

       function tipFunction(d) {

          var color = options.data.color_index && d[options.data.color_index] ?
             constituents.scales.color(d[options.data.color_index]) : 'blue';
          // var identifier = options.data.identifier && d[options.data.identifier] ?
          //    d[options.data.identifier] : 'undefined';
          // var value = options.axes.y.label && d[options.axes.y.label] ?
          //    options.axes.y.tickFormat(d[options.axes.y.label]) : '';
          var site = "site: " + d.site ;
          var identifier = "x: " + (Math.round( d.x * 10000) / 10000).toFixed(5);
          var value ="cumm: " + (Math.round( d.cum  * 10000) / 10000).toFixed(5);
          var message = ' <span style="color:#DDDDDD; block:inline">' + site +
                         '</span><span class="tipInfo" style="color:#DDDDDD; block:inline" >  ' + identifier +
                          '</span><span class="tipInfo" style="color:#DDDDDD; block:inline" >  ' + value + '</span>';
          // var message = ' <span style="color:' + color + '">' + identifier +
          //               '</span><span style="color:#DDDDDD;" > : ' + value + '</span>';
console.log(message);
          return message;
       }

       events.point.mouseover = tip.show;
       events.point.mouseout = tip.hide;

       if (constituents.elements.chartRoot) constituents.elements.chartRoot.call(tip);
   }

   cdfPlotFunctions.defaultDistribution = defaultDistribution;
   function defaultDistribution(tooltip,testName) {

      var container = d3.select('#pointDistributions');

      d3.json(default_distributions, function(error, result) {
         if (error || !result) {
           // console.log(error);
           return;
         }

         var xbp = explodingCdfplot();
         cdfPlotFunctions.xbp = xbp;

         if (tooltip) {
            if (tooltip == 'popover') xbp.events({ 'point': { 'mouseover': showTooltip, 'mouseout': removeTooltip } });
            if (tooltip == 'd3-tip') xbp.events({ 'update': { 'ready': defineTooltip } });
         }

         xbp.options(
            {
               id:   'demo',
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

         xbp.data(result.data);
         container.call(xbp);
         xbp.update();

      });
   }

   cdfPlotFunctions.demoSetup = demoSetup;
   function demoSetup() {
      var data;
      var original_width;
      var original_height;

      var vizcontrol = d3.select('#controls');
      var viztable = vizcontrol.append('table').attr('align', 'center');

      var row1 = viztable.append('tr').append('td').attr('align', 'left');
      row1.append('input').attr('name', 'tooltip').attr('id', 'popover').attr('type', 'radio').attr('value', 'popover');
      row1.append('label').html('&nbsp; Bootstrap Popover').style('font-size', '12px');
      document.getElementById("popover").addEventListener("change", function() {
         cdfPlotFunctions.xbp.events({ 'point': { 'mouseover': showTooltip, 'mouseout': removeTooltip }, 'update': { 'ready': null } });
      });

      var row2 = viztable.append('tr').append('td').attr('align', 'left');
      row2.append('input').attr('name', 'tooltip').attr('id', 'd3tip').attr('type', 'radio').attr('value', 'd3tip').attr('checked', 'checked');
      row2.append('label').html('&nbsp; d3-tip Tooltip').style('font-size', '12px');
      document.getElementById("d3tip").addEventListener("change", function() {
         cdfPlotFunctions.xbp.events({ 'update': { 'ready': defineTooltip } });
         cdfPlotFunctions.xbp.update();
      });
      var row3 = viztable.append('tr').append('td').append('hr');

      var row4 = viztable.append('tr').append('td').attr('align', 'left');
      row4.append('input').attr('name', 'colors').attr('id', 'shuffle').attr('type', 'radio').attr('value', 'shuffle');
      row4.append('label').html('&nbsp; Shuffle Colors').style('font-size', '12px');
      document.getElementById("shuffle").addEventListener("change", function() {
         var shuffle_colors = {
            7: "#a6cee3", 4: "#ff7f00", 1: "#b2df8a", 3: "#1f78b4", 2: "#fdbf6f",  0: "#33a02c",
            5: "#cab2d6", 8: "#6a3d9a", 9: "#fb9a99", 6: "#e31a1c", 11: "#ffff99", 10: "#b15928"
         };
         cdfPlotFunctions.xbp.colors(shuffle_colors);
         cdfPlotFunctions.xbp.update();
      });

      var row5 = viztable.append('tr').append('td').attr('align', 'left');
      row5.append('input').attr('name', 'colors').attr('id', 'default').attr('type', 'radio').attr('value', 'default').attr('checked', 'checked');
      row5.append('label').html('&nbsp; Default Colors').style('font-size', '12px');
      document.getElementById("default").addEventListener("change", function() {
         cdfPlotFunctions.xbp.colors({foo: 'bogus'});
         cdfPlotFunctions.xbp.update();
      });

      var row6 = viztable.append('tr').append('td').append('hr');

      var row7 = viztable.append('tr').append('td').attr('align', 'left');
      row7.append('input').attr('name', 'size').attr('id', 'resize').attr('type', 'radio').attr('value', 'resize');
      row7.append('label').html('&nbsp; Resize').style('font-size', '12px');
      document.getElementById("resize").addEventListener("change", function() {
         original_width = cdfPlotFunctions.xbp.width();
         original_height = cdfPlotFunctions.xbp.height();
         cdfPlotFunctions.xbp.width(400).height(300);
         cdfPlotFunctions.xbp.update();
      });

      var row8 = viztable.append('tr').append('td').attr('align', 'left');
      row8.append('input').attr('name', 'size').attr('id', 'original').attr('type', 'radio').attr('value', 'original').attr('checked', 'checked');
      row8.append('label').html('&nbsp; Original Dimensions').style('font-size', '12px');
      document.getElementById("original").addEventListener("change", function() {
         if (original_width && original_height) {
            cdfPlotFunctions.xbp.width(original_width).height(original_height);
            cdfPlotFunctions.xbp.update();
         }
      });

      var row9 = viztable.append('tr').append('td').append('hr');

      var row10 = viztable.append('tr').append('td').attr('align', 'left');
      row10.append('input').attr('name', 'data').attr('id', 'slice').attr('type', 'radio').attr('value', 'slice');
      row10.append('label').html('&nbsp; Slice Data').style('font-size', '12px');
      document.getElementById("slice").addEventListener("change", function() {
         data = cdfPlotFunctions.xbp.data();
         cdfPlotFunctions.xbp.data(data.slice(1000, 3000));
         cdfPlotFunctions.xbp.update();
      });

      var row11 = viztable.append('tr').append('td').attr('align', 'left');
      row11.append('input').attr('name', 'data').attr('id', 'full').attr('type', 'radio').attr('value', 'full').attr('checked', 'checked');
      row11.append('label').html('&nbsp; Original Data').style('font-size', '12px');
      document.getElementById("full").addEventListener("change", function() {
         if (data) {
            cdfPlotFunctions.xbp.data(data);
            cdfPlotFunctions.xbp.update();
         }
      });

      var row12 = viztable.append('tr').append('td').append('hr');

      var row13 = viztable.append('tr').append('td').attr('align', 'left');
      row13.append('input').attr('name', 'attribute').attr('id', 'shots').attr('type', 'radio').attr('value', 'shots');
      row13.append('label').html('&nbsp; Change Attribute').style('font-size', '12px');
      document.getElementById("shots").addEventListener("change", function() {
         cdfPlotFunctions.xbp.options( { axes: { y: { label: 'Total Shots' } } });
         cdfPlotFunctions.xbp.update();
      });

      var row14 = viztable.append('tr').append('td').attr('align', 'left');
      row14.append('input').attr('name', 'attribute').attr('id', 'points').attr('type', 'radio').attr('value', 'points').attr('checked', 'checked');
      row14.append('label').html('&nbsp; Original Attribute').style('font-size', '12px');
      document.getElementById("points").addEventListener("change", function() {
         cdfPlotFunctions.xbp.options( { axes: { y: { label: 'Total Points' } } });
         cdfPlotFunctions.xbp.update();
      });


      var row12 = viztable.append('tr').append('td').append('hr');
      var row13 = viztable.append('tr').append('td').attr('align', 'left')
                          .html('Explode: click on cdfes<br/>Reset: double-click background');

   }

   if (typeof define === "function" && define.amd) define(cdfPlotFunctions); else if (typeof module === "object" && module.exports) module.exports = cdfPlotFunctions;
   this.cdfPlotFunctions = cdfPlotFunctions;

}();
