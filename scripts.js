const margin = {top: 100, right: 50, bottom: 20, left: 100},
      width = 900,
      height = 600,
      educationSource = "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json";
      countyGeometrySource = "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json";

const svg = d3.select("svg")
              .attr("height", height + margin.top + margin.bottom)
              .attr("width", width + margin.left + margin.right);

const chart = svg.append("g")
                 .attr("height", height)
                 .attr("width", width)
                 .attr("transform", "translate(" + margin.left + ","+ margin.top +")")

let education = d3.map();

let path = d3.geoPath();

// Legend x Scale
let x = d3.scaleLinear()
          .domain([0, 70])
          .rangeRound([600, 850]);

// County fill color scale
let color = d3.scaleThreshold()
              // Defines the thresholds between colors:
              .domain(d3.range(7, 70, 7))
              // Defines the colors:
              .range(d3.schemeGreens[9]);

// Legend SVG Element
let g = chart.append("g")
           .attr("class", "key")
           .attr("transform", "translate(0, 40)");

// Tooltip
let toolTip = d3.select("body")
		  .append("div")
   		.attr("id", "toolTip")
   		.style("display", "none");

// Async call for data
d3.queue()
  // County polygon json
  .defer(d3.json, countyGeometrySource)
  // Education data json
  .defer(d3.json, educationSource)
  .await(ready);

function ready(error, us, edu) {
  if (error) throw error;

  // Legend 'Data'
  g.selectAll("rect")
    .data(color.range().map((d) => {
      // Generates 'data' for legend based on color range array
       d = color.invertExtent(d)
       // If extent is beyond the domain scale:
       console.log(d)
       if (d[0] === undefined) d[0] = x.domain()[0];
       if (d[1] === undefined) d[1] = x.domain()[1];
       console.log("corrected: ", d)
       return d;
    }))

    // Legend shape
    .enter().append("rect")
            .attr("height", 8)
            .attr("width", (d) => { console.log(x(d[1]), x(d[0])); return x(d[1]) - x(d[0]); })
            .attr("x", (d) => { return x(d[0]); })
            .attr("fill", (d) => { return color(d[0]); });

  // Calling the Legend x-axis function
  g.call(d3.axisBottom(x)
            .tickSize(13)
            .tickValues(color.domain()))
            .select(".domain")
            .remove();

  // Legend Caption
  g.append("text")
      .attr("class", "caption")
      .attr("x", x.range()[0])
      .attr("y", -6)
      .attr("fill", "#000")
      .attr("text-anchor", "start")
      .attr("font-weight", "bold")
      .text("Bachelors Degree Attainment (%)");

  // Create key:pair sets of county IDs and an array of county name and edu rate
  // from educationSource json.
  // Used to add color fill to county based on the cooresponding county id (key)
  edu.forEach((entry) => {
    education.set(entry.fips, [entry.area_name + ", " + entry.state, entry.bachelorsOrHigher]);
  });

  // Country Map
  chart.append("g")
    .attr("class", "counties")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.counties).features)
    .enter().append("path")
    .attr("fill", (d) => { return color(d.bachelorsOrHigher = education.get(d.id)[1]); })
    .attr("d", path)
    .on("mouseover", (d) => {
      toolTip
             .style("display", "block")
             .text(education.get(d.id)[0] + ": " + education.get(d.id)[1] + "%")
             .style("left", d3.event.pageX + "px")
             .style("top", d3.event.pageY - 50 + "px")
    })
    .on("mouseout", (d) => {
      toolTip
            .style("display", "none")
    })

 // State Boundaries
 chart.append("path")
    .attr("class", "states")
    .attr("d", path(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; })))
    .attr("fill", "none")
    .attr("stroke", "#00441b");

  // Chart Title
  chart.append("text")
     .attr("id", "title")
     .attr("text-anchor", "middle")
     .attr("transform", "translate(" + width / 2 + ", " + -(margin.top / 2) + ")")
     .text("US College Education by County")
}
