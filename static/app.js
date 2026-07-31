let temperatureChart;
let humidityChart;
let pressureChart;

async function loadMeasurements() {
    try {
        const response = await fetch("/api/measurements?limit=100");

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
    return new Date(timestamp).toLocaleTimeString(
        "de-DE",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
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
    const labels = data.map(measurement =>
        formatTime(measurement.timestamp)
    );

    const fullTimestamps = data.map(measurement =>
        formatDateTime(measurement.timestamp)
    );

    const temperatures = data.map(measurement =>
        measurement.temperature
    );

    const humidities = data.map(measurement =>
        measurement.humidity
    );

    const pressures = data.map(measurement =>
        measurement.pressure
    );

    if (!temperatureChart) {
        temperatureChart = createChart(
            "temperatureChart",
            "Temperatur",
            temperatures,
            labels,
            fullTimestamps,
            " °C"
        );

        humidityChart = createChart(
            "humidityChart",
            "Luftfeuchtigkeit",
            humidities,
            labels,
            fullTimestamps,
            " %"
        );

        pressureChart = createChart(
            "pressureChart",
            "Luftdruck",
            pressures,
            labels,
            fullTimestamps,
            " hPa"
        );
    } else {
        updateChart(
            temperatureChart,
            labels,
            temperatures,
            fullTimestamps
        );

        updateChart(
            humidityChart,
            labels,
            humidities,
            fullTimestamps
        );

        updateChart(
            pressureChart,
            labels,
            pressures,
            fullTimestamps
        );
    }
}

function createChart(
    canvasId,
    label,
    values,
    labels,
    fullTimestamps,
    unit
) {
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
                    unit: unit,
                    tension: 0.3,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    borderWidth: 2,
                    fill: false
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                interaction: {
                    mode: "index",
                    intersect: false
                },

                plugins: {
                    legend: {
                        display: false
                    },

                    tooltip: {
                        callbacks: {
                            title(items) {
                                const item = items[0];
                                const timestamps =
                                    item.dataset.fullTimestamps;

                                return timestamps[item.dataIndex];
                            },

                            label(context) {
                                const value = context.parsed.y;
                                const unit = context.dataset.unit;

                                return (
                                    context.dataset.label +
                                    ": " +
                                    value.toFixed(1) +
                                    unit
                                );
                            }
                        }
                    }
                },

                scales: {
                    x: {
                        title: {
                            display: true,
                            text: "Uhrzeit"
                        }
                    },

                    y: {
                        beginAtZero: false
                    }
                }
            }
        }
    );
}

function updateChart(
    chart,
    labels,
    values,
    fullTimestamps
) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = values;
    chart.data.datasets[0].fullTimestamps = fullTimestamps;
    chart.update();
}

loadMeasurements();

// Alle 60 Sekunden aktualisieren
setInterval(loadMeasurements, 60000);
