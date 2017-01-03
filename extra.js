var colnames = Object.keys(data[0]);

data = JSON.parse(JSON.stringify(data).split('"' + colnames[0]+'":').join('"name":')); // name

data = JSON.parse(JSON.stringify(data).split('"' + colnames[1]+'":').join('"x":')); // x

data = JSON.parse(JSON.stringify(data).split('"' + colnames[2]+'":').join('"y":')); // y

     
// axis title variables     
   var yaxistext = colnames[2];   
   var xaxistext = colnames[1];   
     

// alternative way - iterate this through whole array.
// data[0].name = data[0][colnames[0]];
// delete data[0][colnames[0]];   
   
   
// setup   
     
    var margin = {top: 33, right: 5, bottom: 20, left: 50},
	    width = 450 - margin.left - margin.right,
	    height = 500 - margin.top - margin.bottom;

	  var svg = d3.select(".chart").append("svg")
	      .attr("width", width + margin.left + margin.right)
	      .attr("height", height + margin.top + margin.bottom)
	      .append("g")
	      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	  var x = d3.scaleLinear()
	      .range([0,width]);

	  var y = d3.scaleLinear()
	      .range([height,0]);

	  var xAxis = d3.axisBottom()
	      .scale(x);

	  var yAxis = d3.axisLeft()
	      .scale(y);

      
      
// add basic axes, all points, calculate scales     

      y.domain(d3.extent(data, function(d){ return d.y}));
	    x.domain(d3.extent(data, function(d){ return d.x}));
      
      
	    svg.append("g")
	        .attr("class", "x axis")
	        .attr("transform", "translate(0," + height + ")")
	        .call(xAxis);

	    svg.append("g")
	        .attr("class", "y axis")
	        .call(yAxis);

	    svg.selectAll(".point")
	        .data(data)
	      .enter().append("circle")
	        .attr("class", "point")
	        .attr("r", 4)
	        .attr("cy", function(d){ return y(d.y); })
	        .attr("cx", function(d){ return x(d.x); });
       
   
      
            
// text label for the x axis
  svg.append("text")
      .attr("class", "axistext")
      .attr("transform",
            "translate(" + (width - margin.left) + " ," + 
                           (height + margin.top) + ")")
      .style("text-anchor", "middle")
      .text(xaxistext);

// text label for the y axis
  svg.append("text")
      .attr("class", "axistext")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x",0 - (height/2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text(yaxistext);  
      

      
      
      
      
 // Group/filter by selector............      
      
 var names = d3.nest()
.key(function(d){ return d.name;})     // group by name
.rollup(function(a) { return a.length})  // aggregation on array
.entries(data);

 //add all
 names.unshift({"key": "ALL",
                "value": d3.sum(names,function(d) {return d.value;})}); 

  
 
// add dropdown options to selector
 
 var selector= d3.select("#selector"); // selector

 selector
   .selectAll("option")
   .data(names)
   .enter()
   .append("option")
   .text(function(d) { return d.key + ": " + d.value;})
   .attr("value", function(d){ return d.key;});


 
 
//  Calculate R2, slope, add trendline
  
      var xSeries = data.map(function(e) { return e.x; });  // minimum of all x 
      var ySeries = data.map(function(e) { return e.y; });  // minimum of all y
      var rsq = leastSquares(xSeries,ySeries);   // do lin.reg. calculations
  
   

     // Add trendline
      ptAx =  d3.min(xSeries);
      ptAy =  rsq[0] *  d3.min(xSeries) + rsq[1];
      ptBy =  d3.min(ySeries);
      ptBx =  (d3.min(ySeries) - rsq[1]) / rsq[0];
      
       svg.append("line")
	        .attr("class", "regression")
	        .attr("x1", x(ptAx))
	        .attr("y1", y(ptAy))
	        .attr("x2", x(ptBx))
	        .attr("y2", y(ptBy));
      
      
      
//   Dynamically alter when dropdown menu changes ......
      
selector.on("change", function(){

   d3.selectAll("line.regression").remove();  // remove preexisting lines
   

  //  Change points
    d3.selectAll(".point")
    .attr("opacity", 1);
    var value = selector.property("value");
    
  
     if(value!="ALL") {
      d3.selectAll(".point")
      .filter(function(d) { return d.name != value; })
      .attr("opacity",0.1);

      filteredData  = filterJSON(data, 'name', value);

      var xSeries1 = filteredData.map(function(e) { return e.x; });
      var ySeries1 = filteredData.map(function(e) { return e.y; });
      var rsq1 = leastSquares(xSeries1,ySeries1);
      


	     
      
     // Add trendline
      ptAx1 =  d3.min(xSeries1);
      ptAy1 =  rsq1[0] *  d3.min(xSeries1) + rsq1[1];
      ptBy1 =  d3.max(ySeries1);
      ptBx1 =  (d3.max(ySeries1) - rsq1[1]) / rsq1[0];
    
      svg.append("line")
	        .attr("class", "regression")
	        .attr("x1", x(ptAx1))
	        .attr("y1", y(ptAy1))
	        .attr("x2", x(ptBx1))
	        .attr("y2", y(ptBy1));
              
    } // end of if value!=ALL loop  
  

  
// re-add equations + trendline if ALL re-selected:
  if(value==="ALL") {

  
	  
       svg.append("line")
	        .attr("class", "regression")
	        .attr("x1", x(ptAx))
	        .attr("y1", y(ptAy))
	        .attr("x2", x(ptBx))
	        .attr("y2", y(ptBy));
   
  } // end of if value=ALL loop
    
  }); // end of on.change function
   

	 

     
/// FUNCTIONS..................................................     
     
     
// round decimals   
function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

      
// filter JSON data
function filterJSON(json, key, value) {
    var result = [];
    for (var indicator in json) {
        if (json[indicator][key] === value) {
            result.push(json[indicator]);
        }
    }
    return result;
}

      
// calculate linear regression
function leastSquares(xSeries,ySeries) {
  
  var reduceSumFunc = function(prev, cur) { return prev + cur; };
  
  var xBar = xSeries.reduce(reduceSumFunc) * 1.0 / xSeries.length;
  var yBar = ySeries.reduce(reduceSumFunc) * 1.0 / ySeries.length;

  var ssXX = xSeries.map(function(d) { return Math.pow(d - xBar, 2); })
    .reduce(reduceSumFunc);
  
  var ssYY = ySeries.map(function(d) { return Math.pow(d - yBar, 2); })
    .reduce(reduceSumFunc);
    
  var ssXY = xSeries.map(function(d, i) { return (d - xBar) * (ySeries[i] - yBar); })
    .reduce(reduceSumFunc);
    
  var slope = ssXY / ssXX;
  var intercept = yBar - (xBar * slope);
  var rSquare = Math.pow(ssXY, 2) / (ssXX * ssYY);
  
  return [slope, intercept, rSquare];
}
            
