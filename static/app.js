let mainChart;
let selectedRange = "1D";
let selectedView = "temperature";

async function loadMeasurements() {
    try {
        const response = await fetch(
    `/api/measurements?range=${encodeURIComponent(selectedRange)}`
);
        if (!response.ok) {
            console.error("API Error:", response.status);
            return;
        }

        const data = await response.json();

        if (data.length === 0) {
            return;
        }

        updateCards(data);
        updateCharts(data);

    } catch (error) {
        console.error("Fehler beim Laden der Messwerte:", error);
    }
}

function updateCards(data) {
    const latest = data[data.length - 1];

    document.getElementById("temperature").textContent =
        latest.temperature.toFixed(1) + " °C";

    document.getElementById("humidity").textContent =
        latest.humidity.toFixed(1) + " %";

    document.getElementById("pressure").textContent =
        latest.pressure.toFixed(1) + " hPa";

    document.getElementById("rssi").textContent =
        latest.rssi !== null
            ? latest.rssi + " dBm"
            : "-- dBm";
}

function formatTime(timestamp) {

    const date = new Date(timestamp);

    switch (selectedRange) {

        case "1H":
        case "6H":
        case "1D":
            return date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            });

        case "1W":
        case "1M":
            return date.toLocaleDateString([], {
                day: "2-digit",
                month: "2-digit"
            });

        default:
            return date.toLocaleDateString([], {
                month: "short",
                year: "2-digit"
            });

    }

}

function formatDateTime(timestamp) {
    return new Date(timestamp).toLocaleString(
        "de-DE",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }
    );
}

function updateCharts(data) {

    const labels = data.map(item =>
        formatTime(item.timestamp)
    );

    const timestamps = data.map(item =>
        item.timestamp
    );

    const values = data.map(item =>
        item[selectedView]
    );

    const units = {
        temperature: "°C",
        humidity: "%",
        pressure: "hPa"
    };

    if (!mainChart) {

        mainChart = createChart(
            "mainChart",
            selectedView,
            labels,
            values,
            timestamps,
            units[selectedView]
        );

    } else {

        mainChart.data.datasets[0].label =
            selectedView;

        updateChart(
            mainChart,
            labels,
            values,
            timestamps
        );

    }

}

function initializeViewSelector() {

    const buttons =
        document.querySelectorAll(
            "#view-selector button"
        );

    buttons.forEach(button => {

        button.addEventListener("click", () => {

            selectedView =
                button.dataset.view;

            buttons.forEach(item =>

                item.classList.toggle(
                    "active",
                    item === button
                )

            );

            loadMeasurements();

        });

    });

}

function createChart(canvasId, label, labels, values, fullTimestamps, unit) {
    return new Chart(
        document.getElementById(canvasId),
        {
            type: "line",

            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: values,
                    fullTimestamps: fullTimestamps,

                    borderColor: "#111111",
                    backgroundColor: "transparent",

                    borderWidth: 1,

                    pointRadius: 0,
                    pointHoverRadius: 3,
                    pointHitRadius: 10,

                    tension: 0.15
                }]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                animation: false,

                interaction: {
                    mode: "index",
                    intersect: false
                },

                plugins: {

                    legend: {
                        display: false
                    },

                    title: {
                        display: false
                    },

                    tooltip: {

                        displayColors: false,

                        callbacks: {

                            title(items) {
                                return items[0]
                                    .dataset
                                    .fullTimestamps[items[0].dataIndex];
                            },

                            label(item) {
                                return `${item.formattedValue} ${unit}`;
                            }

                        }

                    }

                },

                scales: {

                    x: {

                        grid: {
                            color: "#ececec",
                            lineWidth: 1
                        },

                        border: {
                            display: false
                        },

                        ticks: {
                            color: "#666666",
                            maxTicksLimit: 8
                        }

                    },

                    y: {

                        grid: {
                            color: "#ececec",
                            lineWidth: 1
                        },

                        border: {
                            display: false
                        },

                        ticks: {
                            color: "#666666",
                            maxTicksLimit: 6
                        }

                    }

                }

            }

        }
    );
}

function updateChart(chart, labels, values, fullTimestamps) {

    chart.data.labels = labels;

    chart.data.datasets[0].data = values;

    chart.data.datasets[0].fullTimestamps = fullTimestamps;

    chart.update("none");

}
function initializeRangeSelector() {
    const buttons = document.querySelectorAll(
        "#range-selector button[data-range]"
    );

    buttons.forEach((button) => {
        button.addEventListener("click", async () => {
            const newRange = button.dataset.range;

            if (!newRange || newRange === selectedRange) {
                return;
            }

            selectedRange = newRange;

            buttons.forEach((item) => {
                const isActive = item.dataset.range === selectedRange;

                item.classList.toggle("active", isActive);
                item.setAttribute(
                    "aria-pressed",
                    String(isActive)
                );
            });

            await loadMeasurements();
        });
    });
}

initializeRangeSelector();
initializeViewSelector();
loadMeasurements();

// Alle 60 Sekunden aktualisieren
setInterval(loadMeasurements, 60000);
