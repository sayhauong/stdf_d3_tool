! function() {

  // module container
  var testsListFunction = {};



  testsListFunction.popTestsList = popTestsList;

  function popTestsList(plotType) {

    var ul = document.getElementById("testsList");


    d3.json(default_distributions, function(error, result) {
      if (error || !result) {
        console.log(error);
        return;
      }

      // for (var key in result.data[0]) {
          for (var key in result.limit) {
        // console.log(key);

        // var li = document.createElement("li");
        // li.appendChild(document.createTextNode(key));
        // li.classList.add("list-group-item", "test-name");

        // // list-group-item list-group-item-action
        // //
        var li = document.createElement("a");
        // // li.title=key;
        li.appendChild(document.createTextNode(key));
        li.classList.add("list-group-item", "list-group-item-action", "test-name");
        li.addEventListener('click', function(e) {


          if (plotType === "CDF") {
            cdfPlotFunctions.xbp.options({
              axes: {
                y: {
                  label: e.target.innerText
                }
              }
            });
            // container.call(xbp);
            cdfPlotFunctions.xbp.update();

          } else if (plotType === "BOX")  {
            boxPlotFunctions.xbp.options({
              limitRangeType:'limit',
              axes: {
                y: {
                  label: e.target.innerText
                }
              }
            });

            // container.call(xbp);
            boxPlotFunctions.xbp.update();
          }
        });
        ul.appendChild(li);
      }


    });

    // li.click( function(e) {
    //   console.log(e);
    //   if (e.target.tagName === 'LI') {
    //     console.log(e.target.innerText); // Check if the element is a LI
    //       // boxPlotFunctions.defaultDistribution('d3-tip', e.target.innerText);
    //       boxPlotFunctions.xbp.options( { axes: { y: { label:e.target.innerText } } });
    //
    //       // container.call(xbp);
    //       boxPlotFunctions.xbp.update();
    //   }
    // });

    // ul.addEventListener('click', function(e) {
    //   if (e.target.tagName === 'LI') {
    //     console.log(e.target.innerText); // Check if the element is a LI
    //       // boxPlotFunctions.defaultDistribution('d3-tip', e.target.innerText);
    //       boxPlotFunctions.xbp.options( { axes: { y: { label:e.target.innerText } } });
    //
    //       // container.call(xbp);
    //       boxPlotFunctions.xbp.update();
    //   }
    // });

  }


  if (typeof define === "function" && define.amd) define(testsListFunction);
  else if (typeof module === "object" && module.exports) module.exports = testsListFunction;
  this.testsListFunction = testsListFunction;

}();
