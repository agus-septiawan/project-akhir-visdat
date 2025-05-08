// Hotel Type Comparison Visualization

function createHotelComparisonChart() {
    // Set dimensions and margins
    const margin = {top: 60, right: 30, bottom: 60, left: 80},
          width = 1000 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

    // Clear any existing SVG
    d3.select("#hotel-comparison-chart").html("");

    // Create SVG
    const svg = d3.select("#hotel-comparison-chart")
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
        .text("Perbandingan Pemesanan City Hotel vs Resort Hotel");

    // Load data
    d3.csv("data/hotel_bookings_processed.csv").then(function(data) {
        // Process data - count bookings by hotel type
        const hotelCounts = d3.rollup(
            data,
            v => v.length,
            d => d.hotel
        );

        // Convert to array format for easier manipulation
        const processedData = Array.from(hotelCounts, ([key, value]) => ({hotel: key, count: value}));
        
        // Calculate percentages
        const total = d3.sum(processedData, d => d.count);
        processedData.forEach(d => {
            d.percentage = (d.count / total) * 100;
        });

        // Define colors
        const colors = {
            "City Hotel": "#3498db",
            "Resort Hotel": "#e74c3c"
        };

        // Create a two-part visualization: pie chart and bar chart
        const pieWidth = width / 2;
        const barWidth = width / 2;

        // 1. PIE CHART
        const radius = Math.min(pieWidth, height) / 2;
        
        // Create pie chart group
        const pieGroup = svg.append("g")
            .attr("transform", `translate(${pieWidth/2}, ${height/2})`);

        // Create pie layout
        const pie = d3.pie()
            .value(d => d.count)
            .sort(null);

        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(radius * 0.8);

        const outerArc = d3.arc()
            .innerRadius(radius * 0.9)
            .outerRadius(radius * 0.9);

        // Add pie slices
        const slices = pieGroup.selectAll(".arc")
            .data(pie(processedData))
            .enter()
            .append("g")
            .attr("class", "arc");

        slices.append("path")
            .attr("d", arc)
            .attr("fill", d => colors[d.data.hotel])
            .attr("stroke", "white")
            .style("stroke-width", "2px")
            .style("opacity", (d, i) => i === 0 ? 1 : 0.9);  // Slightly emphasize City Hotel

        // Add labels with percentages
        slices.append("text")
            .attr("transform", d => {
                const pos = outerArc.centroid(d);
                const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
                pos[0] = radius * 0.95 * (midAngle < Math.PI ? 1 : -1);
                return `translate(${pos})`;
            })
            .attr("dy", ".35em")
            .attr("text-anchor", d => {
                const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
                return midAngle < Math.PI ? "start" : "end";
            })
            .text(d => `${d.data.hotel} (${d.data.percentage.toFixed(1)}%)`)
            .style("font-size", "12px")
            .style("font-weight", "bold");

        // Add polylines between slices and labels
        slices.append("polyline")
            .attr("points", d => {
                const pos = outerArc.centroid(d);
                const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
                pos[0] = radius * 0.95 * (midAngle < Math.PI ? 1 : -1);
                return [arc.centroid(d), outerArc.centroid(d), pos];
            })
            .style("fill", "none")
            .style("stroke", "black")
            .style("stroke-width", "1px")
            .style("opacity", 0.5);

        // Add pie chart title
        pieGroup.append("text")
            .attr("x", 0)
            .attr("y", -radius - 10)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Persentase Pemesanan berdasarkan Jenis Hotel");

        // 2. BAR CHART
        // Create bar chart group
        const barGroup = svg.append("g")
            .attr("transform", `translate(${pieWidth + 30}, 0)`);

        // Set up scales
        const x = d3.scaleBand()
            .domain(processedData.map(d => d.hotel))
            .range([0, barWidth - 60])
            .padding(0.3);

        const y = d3.scaleLinear()
            .domain([0, d3.max(processedData, d => d.count)])
            .range([height, 0])
            .nice();

        // Add X axis
        barGroup.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));

        // Add Y axis
        barGroup.append("g")
            .call(d3.axisLeft(y).ticks(10).tickFormat(d3.format(",.0f")));

        // Add Y axis label
        barGroup.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -40)
            .attr("x", -height / 2)
            .attr("text-anchor", "middle")
            .text("Jumlah Pemesanan");

        // Add X axis label
        barGroup.append("text")
            .attr("x", (barWidth - 60) / 2)
            .attr("y", height + 40)
            .attr("text-anchor", "middle")
            .text("Jenis Hotel");

        // Add bars
        barGroup.selectAll(".bar")
            .data(processedData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.hotel))
            .attr("y", d => y(d.count))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.count))
            .attr("fill", d => colors[d.hotel]);

        // Add value labels inside bars
        barGroup.selectAll(".label")
            .data(processedData)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => x(d.hotel) + x.bandwidth() / 2)
            .attr("y", d => y(d.count) + (height - y(d.count)) / 2)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "white")
            .text(d => d3.format(",")(d.count));

        // Add bar chart title
        barGroup.append("text")
            .attr("x", (barWidth - 60) / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Jumlah Pemesanan berdasarkan Jenis Hotel");

        // Add tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Add tooltip for pie slices
        slices.selectAll("path")
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`<strong>${d.data.hotel}</strong><br>Jumlah: ${d3.format(",")(d.data.count)}<br>Persentase: ${d.data.percentage.toFixed(1)}%`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        // Add tooltip for bars
        barGroup.selectAll(".bar")
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`<strong>${d.hotel}</strong><br>Jumlah: ${d3.format(",")(d.count)}<br>Persentase: ${d.percentage.toFixed(1)}%`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        // Calculate ratio
        const ratio = processedData[0].count / processedData[1].count;

        // Add ratio text
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + 40)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text(`Rasio ${processedData[0].hotel} : ${processedData[1].hotel} = ${ratio.toFixed(1)} : 1`);
    });
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', createHotelComparisonChart);