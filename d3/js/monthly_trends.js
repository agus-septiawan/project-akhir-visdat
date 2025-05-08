// Monthly Booking Trends Visualization

function createMonthlyTrendsChart() {
    // Set dimensions and margins
    const margin = {top: 60, right: 120, bottom: 80, left: 80},
          width = 1000 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

    // Clear any existing SVG
    d3.select("#monthly-trends-chart").html("");

    // Create SVG
    const svg = d3.select("#monthly-trends-chart")
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
        .text("Tren Jumlah Pemesanan Hotel Setiap Bulan");

    // Load data
    d3.csv("data/hotel_bookings_processed.csv").then(function(data) {
        // Process data - count bookings by month and hotel type
        const monthOrder = ["January", "February", "March", "April", "May", "June", 
                           "July", "August", "September", "October", "November", "December"];
        
        // Group data by month and hotel type
        const monthlyData = d3.rollup(
            data,
            v => v.length,
            d => d.arrival_month,
            d => d.hotel
        );

        // Convert to array format for easier manipulation
        const processedData = [];
        monthlyData.forEach((hotelTypes, month) => {
            const monthData = {month: month};
            let total = 0;
            
            hotelTypes.forEach((count, hotelType) => {
                monthData[hotelType] = count;
                total += count;
            });
            
            monthData.total = total;
            processedData.push(monthData);
        });

        // Sort by month order
        processedData.sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));

        // Find max and min months
        const maxMonth = processedData.reduce((max, d) => d.total > max.total ? d : max, processedData[0]);
        const minMonth = processedData.reduce((min, d) => d.total < min.total ? d : min, processedData[0]);

        // Set up scales
        const x = d3.scaleBand()
            .domain(monthOrder)
            .range([0, width])
            .padding(0.2);

        const y1 = d3.scaleLinear()
            .domain([0, d3.max(processedData, d => Math.max(d["City Hotel"] || 0, d["Resort Hotel"] || 0))])
            .range([height, 0])
            .nice();

        const y2 = d3.scaleLinear()
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

        // Add Y axis for hotel types
        svg.append("g")
            .call(d3.axisLeft(y1).ticks(10).tickFormat(d3.format(",.0f")));

        // Add Y axis for total
        svg.append("g")
            .attr("transform", `translate(${width}, 0)`)
            .call(d3.axisRight(y2).ticks(10).tickFormat(d3.format(",.0f")));

        // Add Y axis label for hotel types
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -60)
            .attr("x", -height / 2)
            .attr("text-anchor", "middle")
            .text("Jumlah Pemesanan per Hotel");

        // Add Y axis label for total
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", width + 60)
            .attr("x", -height / 2)
            .attr("text-anchor", "middle")
            .text("Total Pemesanan");

        // Add X axis label
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + 60)
            .attr("text-anchor", "middle")
            .text("Bulan");

        // Calculate bar width
        const barWidth = x.bandwidth() / 2;

        // Add bars for City Hotel
        svg.selectAll(".bar-city")
            .data(processedData)
            .enter()
            .append("rect")
            .attr("class", "bar bar-city")
            .attr("x", d => x(d.month))
            .attr("y", d => y1(d["City Hotel"] || 0))
            .attr("width", barWidth)
            .attr("height", d => height - y1(d["City Hotel"] || 0))
            .attr("fill", colors["City Hotel"]);

        // Add bars for Resort Hotel
        svg.selectAll(".bar-resort")
            .data(processedData)
            .enter()
            .append("rect")
            .attr("class", "bar bar-resort")
            .attr("x", d => x(d.month) + barWidth)
            .attr("y", d => y1(d["Resort Hotel"] || 0))
            .attr("width", barWidth)
            .attr("height", d => height - y1(d["Resort Hotel"] || 0))
            .attr("fill", colors["Resort Hotel"]);

        // Add line for total
        const line = d3.line()
            .x(d => x(d.month) + x.bandwidth() / 2)
            .y(d => y2(d.total));

        svg.append("path")
            .datum(processedData)
            .attr("class", "line")
            .attr("d", line)
            .attr("stroke", colors["Total"])
            .attr("stroke-width", 3)
            .attr("fill", "none");

        // Add area under the line
        const area = d3.area()
            .x(d => x(d.month) + x.bandwidth() / 2)
            .y0(height)
            .y1(d => y2(d.total));

        svg.append("path")
            .datum(processedData)
            .attr("class", "area")
            .attr("d", area)
            .attr("fill", colors["Total"])
            .attr("opacity", 0.1);

        // Add dots for total line
        svg.selectAll(".dot")
            .data(processedData)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("cx", d => x(d.month) + x.bandwidth() / 2)
            .attr("cy", d => y2(d.total))
            .attr("r", 5)
            .attr("fill", colors["Total"]);

        // Add labels for total line
        svg.selectAll(".label")
            .data(processedData)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => x(d.month) + x.bandwidth() / 2)
            .attr("y", d => y2(d.total) - 15)
            .attr("text-anchor", "middle")
            .style("font-size", "10px")
            .style("font-weight", "bold")
            .text(d => d3.format(",")(d.total));

        // Highlight max and min months
        svg.append("rect")
            .attr("class", "highlight max-highlight")
            .attr("x", x(maxMonth.month) - 5)
            .attr("y", 0)
            .attr("width", x.bandwidth() + 10)
            .attr("height", height)
            .attr("fill", "green")
            .attr("opacity", 0.1);

        svg.append("rect")
            .attr("class", "highlight min-highlight")
            .attr("x", x(minMonth.month) - 5)
            .attr("y", 0)
            .attr("width", x.bandwidth() + 10)
            .attr("height", height)
            .attr("fill", "red")
            .attr("opacity", 0.1);

        // Add legend
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width - 200}, -40)`);

        // City Hotel
        legend.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", colors["City Hotel"]);

        legend.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .text("City Hotel");

        // Resort Hotel
        legend.append("rect")
            .attr("x", 0)
            .attr("y", 20)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", colors["Resort Hotel"]);

        legend.append("text")
            .attr("x", 20)
            .attr("y", 32)
            .text("Resort Hotel");

        // Total
        legend.append("rect")
            .attr("x", 100)
            .attr("y", 0)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", colors["Total"]);

        legend.append("text")
            .attr("x", 120)
            .attr("y", 12)
            .text("Total");

        // Add tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Add tooltip for bars
        svg.selectAll(".bar")
            .on("mouseover", function(event, d) {
                const hotelType = d3.select(this).classed("bar-city") ? "City Hotel" : "Resort Hotel";
                const value = hotelType === "City Hotel" ? d["City Hotel"] : d["Resort Hotel"];
                
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`<strong>${d.month}</strong><br>${hotelType}: ${d3.format(",")(value)}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        // Add tooltip for dots
        svg.selectAll(".dot")
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`<strong>${d.month}</strong><br>Total: ${d3.format(",")(d.total)}<br>City Hotel: ${d3.format(",")(d["City Hotel"] || 0)}<br>Resort Hotel: ${d3.format(",")(d["Resort Hotel"] || 0)}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        // Add caption
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + 80)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("font-style", "italic")
            .text(`Tren pemesanan hotel menunjukkan pola musiman dengan puncak di ${maxMonth.month} (${d3.format(",")(maxMonth.total)} pemesanan) dan terendah di ${minMonth.month} (${d3.format(",")(minMonth.total)} pemesanan).`);
    });
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', createMonthlyTrendsChart);