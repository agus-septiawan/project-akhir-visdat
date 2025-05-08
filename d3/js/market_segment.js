// Market Segment Visualization

function createMarketSegmentChart() {
    // Set dimensions and margins
    const margin = {top: 60, right: 200, bottom: 80, left: 80},
          width = 1000 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

    // Clear any existing SVG
    d3.select("#market-segment-chart").html("");

    // Create SVG
    const svg = d3.select("#market-segment-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -30)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .text("Distribusi Pemesanan berdasarkan Segmen Pasar");

    // Load data
    d3.csv("data/hotel_bookings_processed.csv").then(function(data) {
        // Process data - count bookings by market segment and hotel type
        const segmentData = d3.rollup(
            data,
            v => v.length,
            d => d.market_segment,
            d => d.hotel
        );

        // Convert to array format for easier manipulation
        const processedData = [];
        segmentData.forEach((hotelTypes, segment) => {
            const segmentData = {segment: segment};
            let total = 0;
            
            hotelTypes.forEach((count, hotelType) => {
                segmentData[hotelType] = count;
                total += count;
            });
            
            segmentData.total = total;
            processedData.push(segmentData);
        });

        // Sort by total bookings (descending)
        processedData.sort((a, b) => b.total - a.total);

        // Set up scales
        const x = d3.scaleBand()
            .domain(processedData.map(d => d.segment))
            .range([0, width])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(processedData, d => d.total)])
            .range([height, 0])
            .nice();

        // Define colors
        const colors = {
            "City Hotel": "#3498db",
            "Resort Hotel": "#e74c3c",
            "Total": "#2ecc71"
        };

        // Add X axis
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-30)")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em");

        // Add Y axis
        svg.append("g")
            .call(d3.axisLeft(y).ticks(10).tickFormat(d3.format(",.0f")));

        // Add Y axis label
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -60)
            .attr("x", -height / 2)
            .attr("text-anchor", "middle")
            .text("Jumlah Pemesanan");

        // Add X axis label
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + 60)
            .attr("text-anchor", "middle")
            .text("Segmen Pasar");

        // Calculate bar width
        const barWidth = x.bandwidth() / 2;

        // Add stacked bars
        // City Hotel bars
        svg.selectAll(".bar-city")
            .data(processedData)
            .enter()
            .append("rect")
            .attr("class", "bar bar-city")
            .attr("x", d => x(d.segment))
            .attr("y", d => y(d["City Hotel"] || 0))
            .attr("width", barWidth)
            .attr("height", d => height - y(d["City Hotel"] || 0))
            .attr("fill", colors["City Hotel"]);

        // Resort Hotel bars
        svg.selectAll(".bar-resort")
            .data(processedData)
            .enter()
            .append("rect")
            .attr("class", "bar bar-resort")
            .attr("x", d => x(d.segment) + barWidth)
            .attr("y", d => y(d["Resort Hotel"] || 0))
            .attr("width", barWidth)
            .attr("height", d => height - y(d["Resort Hotel"] || 0))
            .attr("fill", colors["Resort Hotel"]);

        // Add percentage labels for each segment
        svg.selectAll(".percentage-label")
            .data(processedData)
            .enter()
            .append("text")
            .attr("class", "percentage-label")
            .attr("x", d => x(d.segment) + x.bandwidth() / 2)
            .attr("y", d => y(d.total) - 10)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .text(d => `${((d.total / d3.sum(processedData, d => d.total)) * 100).toFixed(1)}%`);

        // Add legend
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width + 20}, 0)`);

        // City Hotel
        legend.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", colors["City Hotel"]);

        legend.append("text")
            .attr("x", 25)
            .attr("y", 12)
            .text("City Hotel");

        // Resort Hotel
        legend.append("rect")
            .attr("x", 0)
            .attr("y", 30)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", colors["Resort Hotel"]);

        legend.append("text")
            .attr("x", 25)
            .attr("y", 42)
            .text("Resort Hotel");

        // Add tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Add tooltip for bars
        svg.selectAll(".bar")
            .on("mouseover", function(event, d) {
                const hotelType = d3.select(this).classed("bar-city") ? "City Hotel" : "Resort Hotel";
                const value = hotelType === "City Hotel" ? d["City Hotel"] : d["Resort Hotel"];
                const percentage = ((value / d.total) * 100).toFixed(1);
                
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`<strong>${d.segment}</strong><br>${hotelType}: ${d3.format(",")(value)} (${percentage}% dari segmen ini)<br>Total segmen: ${d3.format(",")(d.total)}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        // Add annotations for key insights
        // Find Online TA and Direct segments
        const onlineTA = processedData.find(d => d.segment === "Online TA");
        const direct = processedData.find(d => d.segment === "Direct");

        if (onlineTA && direct) {
            // Highlight Online TA vs Direct comparison
            svg.append("path")
                .attr("d", d3.line()([
                    [x(onlineTA.segment) + x.bandwidth() / 2, y(onlineTA.total) - 30],
                    [x(direct.segment) + x.bandwidth() / 2, y(direct.total) - 30]
                ]))
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "5,5")
                .attr("fill", "none");

            // Add comparison text
            const comparisonRatio = (onlineTA.total / direct.total).toFixed(1);
            svg.append("text")
                .attr("x", (x(onlineTA.segment) + x(direct.segment) + x.bandwidth()) / 2)
                .attr("y", y(Math.max(onlineTA.total, direct.total)) - 40)
                .attr("text-anchor", "middle")
                .style("font-size", "12px")
                .style("font-style", "italic")
                .text(`Online TA ${comparisonRatio}x lebih banyak dari Direct`);
        }

        // Add caption
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + 80)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("font-style", "italic")
            .text(`Segmen pasar Online TA mendominasi dengan ${((processedData[0].total / d3.sum(processedData, d => d.total)) * 100).toFixed(1)}% dari total pemesanan.`);
    });
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', createMarketSegmentChart);