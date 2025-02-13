// Define global variables
let globalData = null; // For all data
let shownData = []; // For currently displayed data
let svg, xScale, yScale, colorScale;
let animationTimeout = null; // For managing setTimeout
const legendContainer = d3.select("div#plot").append("div")
.attr("id", "legend")
.style("display", "flex")
.style("flex-wrap", "wrap")
.style("margin-top", "20px")
.style("justify-content", "center");
// Load the data
d3.csv("data/debt_interest_data.csv").then(data => {
  // Parse the data
  globalData = data;
  data.forEach(d => {
    d.Year = +d.Year;
    d.Gross_Debt = +d.Gross_Debt;
    d.Interest_Payments = +d.Interest_Payments;
  });

  shownData = globalData.filter(d => d["COUNTRY.Name"] === "United States");

  // Set up dimensions and margins
  const margin = { top: 50, right: 150, bottom: 100, left: 80 }; // Adjust bottom margin for space
  const width = 900 - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;

  // Create the SVG container
  svg = d3.select("div#plot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Add scales
  xScale = d3.scaleLinear()
    .domain(d3.extent(globalData, d => d.Gross_Debt))
    .range([0, width]);

  yScale = d3.scaleLinear()
    .domain(d3.extent(globalData, d => d.Interest_Payments))
    .range([height, 0]);

  // Add axes
  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xScale).ticks(10));
  svg.append("g").call(d3.axisLeft(yScale).ticks(10));

  // Add labels
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .text("Gross Debt (% of GDP)");

  svg.append("text")
    .attr("x", -height / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Interest Payments (% of Revenue)");

  // Add color scale
  colorScale = d3.scaleOrdinal(d3.schemeCategory10)
    .domain([...new Set(globalData.map(d => d["COUNTRY.Name"]))]);

  // Create buttons for countries
  const countries = [...new Set(globalData.map(d => d["COUNTRY.Name"]))];
  const buttonContainer = d3.select("#buttons");
  countries.forEach(country => {
    buttonContainer
      .append("button")
      .attr("class", () => {
        // Add 'toggle' class if the country is in shownData
        return shownData.find(d => d["COUNTRY.Name"] === country) ? "button toggle" : "button";
      })
      .text(country)
      .on("click", function () {
        // Check if the country is already shown
        if (shownData.find(d => d["COUNTRY.Name"] === country)) {
          // Remove country from shownData and reset chart
          const uniqueCountries = new Set(shownData.map(item => item["COUNTRY.Name"]));
          if (uniqueCountries.size > 1) {
            shownData = shownData.filter(d => d["COUNTRY.Name"] !== country);
            d3.select(this).classed("toggle", false); 
            updateLegend();
          }
        } else {
          // Add country to shownData and update chart
          updateChart(country);
          d3.select(this).classed("toggle", true); // Add 'toggle' class
        }
      });
  });

  // Create legend below the graph (using div elements)

    function updateLegend() {
      // Clear existing legend
      legendContainer.selectAll("*").remove();
  
      // Add color boxes and country labels for shownData
      const uniqueCountries = [...new Set(shownData.map(d => d["COUNTRY.Name"]))];
      uniqueCountries.forEach(country => {
        const legendItem = legendContainer.append("div")
          .attr("class", "legend-item")
          .style("display", "flex")
          .style("align-items", "center")
          .style("margin-right", "20px")
          .style("margin-bottom", "10px");
  
        // Add color box
        legendItem.append("div")
          .style("width", "20px")
          .style("height", "20px")
          .style("background-color", colorScale(country))
          .style("margin-right", "10px");
  
        // Add country label
        legendItem.append("span")
          .text(country)
          .style("font-size", "14px");
      });
    }
  // Initial update of the legend
  updateLegend();

  // Initial animation
  animate();
});
function updateLegend() {
  // Clear existing legend
  legendContainer.selectAll("*").remove();

  // Add color boxes and country labels for the countries in shownData
  const uniqueCountries = [...new Set(shownData.map(d => d["COUNTRY.Name"]))];
  uniqueCountries.forEach(country => {
    const legendItem = legendContainer.append("div")
      .attr("class", "legend-item")
      .style("display", "flex")
      .style("align-items", "center")
      .style("margin-right", "20px")
      .style("margin-bottom", "10px");

    // Add color box
    legendItem.append("div")
      .style("width", "20px")
      .style("height", "20px")
      .style("background-color", colorScale(country))
      .style("margin-right", "10px");

    // Add country label
    legendItem.append("span")
      .text(country)
      .style("font-size", "14px");
  });
}
// Function to update chart with selected country
function updateChart(selectedCountry) {
  const filteredData = globalData.filter(d => d["COUNTRY.Name"] === selectedCountry);

  // Add unique data to shownData
  shownData = Array.from(new Set([...shownData, ...filteredData]));

  // Update the legend
  updateLegend();

  // Restart animation with updated data
  currentYear = null; // Reset year
  stopAnimation(); // Stop any existing animations
  animate(); // Start a new animation
}

// Animate through years
let currentYear = null;
function animate() {
  if (!shownData.length) return; // Ensure there is data to animate
  if (!currentYear) currentYear = d3.min(shownData, d => d.Year);

  const maxYear = d3.max(shownData, d => d.Year);

  if (currentYear > maxYear) {
    currentYear = d3.min(shownData, d => d.Year);
  }

  const filteredData = shownData.filter(d => d.Year === currentYear);

  // Bind data and transition points
  svg.selectAll(".point")
    .data(filteredData, d => `${d["COUNTRY.Name"]}-${d.Year}`)
    .join(
      enter => enter.append("circle")
        .attr("class", "point")
        .attr("cx", d => xScale(d.Gross_Debt))
        .attr("cy", d => yScale(d.Interest_Payments))
        .attr("r", 5)
        .attr("fill", d => colorScale(d["COUNTRY.Name"])),

      update => update
        .transition().duration(250) // Smooth transition
        .attr("cx", d => xScale(d.Gross_Debt))
        .attr("cy", d => yScale(d.Interest_Payments)),

      exit => exit.transition().duration(66).attr("r", 0).remove() // Smoothly remove points
    );

  // Update year display
  d3.select("h2#year").text(`Year: ${currentYear}`);
  currentYear++;

  // Schedule the next frame
  animationTimeout = setTimeout(animate, 250);
}

// Function to stop animation
function stopAnimation() {
  if (animationTimeout) {
    clearTimeout(animationTimeout);
    animationTimeout = null;
  }
}