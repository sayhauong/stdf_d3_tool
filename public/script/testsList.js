! function() {

  // module container
  var testsListFunction = {};



  testsListFunction.popTestsList = popTestsList;

  function popTestsList(plotType) {


    var ul = document.getElementById("tests-list");

    // d3.json(default_distributions, function(error, result) {
      d3.json(default_distributions).then( function(result) {
      // if (error || !result) {
      //   console.log(error);
      //   return;
      // }
      if ( !result) {
        console.log(error);
        return;
      }
      for (var key in result.limit) {

        var li = document.createElement("a");
        li.setAttribute("id", key);
        li.appendChild(document.createTextNode(result.limit[key]['TEST_NUM'] + ":" + key));
        li.classList.add("list-group-item", "list-group-item-action", "test-name");
        li.addEventListener('click', function(e) {

          if (plotType === "CDF") {
            cdfPlotFunctions.xbp.options({
              axes: {
                y: {
                  // label: e.target.innerText
                  label: e.target.id
                }
              }
            });
            // container.call(xbp);
            cdfPlotFunctions.xbp.update();

          } else if (plotType === "BOX") {
            boxPlotFunctions.xbp.options({
              //set limit plot here
              limitRangeType: 'limit',
              axes: {
                y: {
                  // label: e.target.innerText
                  label: e.target.id
                }
              }
            });
            // container.call(xbp);
            boxPlotFunctions.xbp.update();
          }
          else if (plotType === "HIST") {
            histPlotFunctions.xbp.options({
              //set limit plot here
              limitRangeType: 'limit',
              axes: {
                y: {
                  // label: e.target.innerText
                  label: e.target.id
                }
              }
            });
            // container.call(xbp);
            histPlotFunctions.xbp.update();
          }
        });
        ul.appendChild(li);

        var searchInput = document.getElementById("search-input");
        searchInput.onkeyup = function() {
          var filter = searchInput.value.toUpperCase();
          var lis = document.getElementsByClassName('test-name');
          if (filter) {
            for (var i = 0; i < lis.length; i++) {
              var name = lis[i].innerHTML;
              if (name.toUpperCase().indexOf(filter) >= 0)
                lis[i].style.display = 'list-item';
              else
                lis[i].style.display = 'none';
            }
          }
        }

      }
    });

  }


  if (typeof define === "function" && define.amd) define(testsListFunction);
  else if (typeof module === "object" && module.exports) module.exports = testsListFunction;
  this.testsListFunction = testsListFunction;

}();
