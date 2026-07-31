let temperatureChart;
let humidityChart;
let pressureChart;

async function loadMeasurements() {

    const response = await fetch("/api/measurements?limit=100");

    if (!response.ok) {
        console.error("API Error");
        return;
    }

    const data = await response.json();

    if (data.length === 0) {
        return;
    }

    // Aktuellster Messwert
    const latest = data[data.length - 1];

    document.getElementById("temperature").textContent =
        latest.temperature.toFixed(1) + " °C";

    document.getElementById("humidity").textContent =
        latest.humidity.toFixed(1) + " %";

    document.getElementById("pressure").textContent =
        latest.pressure.toFixed(1) + " hPa";

    document.getElementById("rssi").textContent =
        latest.rssi + " dBm";

    updateCharts(data);
}

function updateCharts(data) {

    const labels = data.map(m => {
        return new Date(m.timestamp).toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit"
        });
    });

    const temperatures = data.map(m => m.temperature);
    const humidities = data.map(m => m.humidity);
    const pressures = data.map(m => m.pressure);

    if (!temperatureChart) {

        temperatureChart = createChart(
            "temperatureChart",
            "Temperatur",
            temperatures,
            labels
        );

        humidityChart = createChart(
            "humidityChart",
            "Luftfeuchtigkeit",
            humidities,
            labels
        );

        pressureChart = createChart(
            "pressureChart",
            "Luftdruck",
            pressures,
            labels
        );

    } else {

        updateChart(temperatureChart, labels, temperatures);
        updateChart(humidityChart, labels, humidities);
        updateChart(pressureChart, labels, pressures);

    }
}

function createChart(canvasId, label, values, labels) {

    return new Chart(
        document.getElementById(canvasId),
        {
            type: "line",

            data: {
                labels: labels,

                datasets: [{
                    label: label,
                    data: values,
                    tension: 0.3
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        }
    );
}

function updateChart(chart, labels, values) {

    chart.data.labels = labels;
    chart.data.datasets[0].data = values;
    chart.update();
}

loadMeasurements();

// alle 60 Sekunden aktualisieren
setInterval(loadMeasurements, 60000);
