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
        updateInstrumentLabels();
        updateRecordObservation(data);
        updateRecordSummary(data);
        updateRecordLabels();

    } catch (error) {
        console.error("Fehler beim Laden der Messwerte:", error);
    }
}

function calculateSummary(values) {
    const validValues = values.filter(
        value => Number.isFinite(value)
    );

    if (validValues.length === 0) {
        return null;
    }

    const minimum = Math.min(...validValues);
    const maximum = Math.max(...validValues);

    const mean =
        validValues.reduce(
            (sum, value) => sum + value,
            0
        ) / validValues.length;

    return {
        minimum,
        mean,
        maximum,
        range: maximum - minimum
    };
}

function setSummaryRow(prefix, summary, decimals) {
    if (!summary) {
        return;
    }

    const fields = {
        min: summary.minimum,
        mean: summary.mean,
        max: summary.maximum,
        range: summary.range
    };

    Object.entries(fields).forEach(([name, value]) => {
        const element =
            document.getElementById(
                `${prefix}-${name}`
            );

        if (element) {
            element.textContent =
                value.toFixed(decimals);
        }
    });
}

function updateRecordSummary(data) {
    if (!Array.isArray(data) || data.length === 0) {
        return;
    }

    const temperatures = data.map(
        measurement => measurement.temperature
    );

    const humidities = data.map(
        measurement => measurement.humidity
    );

    const pressures = data.map(
        measurement => measurement.pressure
    );

    setSummaryRow(
        "temperature",
        calculateSummary(temperatures),
        2
    );

    setSummaryRow(
        "humidity",
        calculateSummary(humidities),
        2
    );

    setSummaryRow(
        "pressure",
        calculateSummary(pressures),
        2
    );
}

function updateRecordLabels() {
    const periodNames = {
        "1H": "1 HOUR",
        "6H": "6 HOURS",
        "1D": "1 DAY",
        "1W": "1 WEEK",
        "1M": "1 MONTH",
        "3M": "3 MONTHS",
        "6M": "6 MONTHS",
        "1Y": "1 YEAR",
        "5Y": "5 YEARS",
        "ALL": "ALL RECORDS"
    };

    const variableNames = {
        temperature: "TEMPERATURE",
        humidity: "HUMIDITY",
        pressure: "PRESSURE"
    };

    const period =
        periodNames[selectedRange] ?? selectedRange;

    const variable =
        variableNames[selectedView]
        ?? selectedView.toUpperCase();

    const periodLabel =
        document.getElementById(
            "record-period-label"
        );

    const caption =
        document.getElementById(
            "record-chart-caption"
        );

    if (periodLabel) {
        periodLabel.textContent = period;
    }

    if (caption) {
        caption.textContent =
            `${variable} OBSERVATIONS — ${period}`;
    }
}

function updateRecordObservation(data) {
    if (!Array.isArray(data) || data.length === 0) {
        return;
    }

    const latest = data[data.length - 1];

    const temperature =
        document.getElementById("record-temperature");

    const humidity =
        document.getElementById("record-humidity");

    const pressure =
        document.getElementById("record-pressure");

    const rssi =
        document.getElementById("record-rssi");

    if (temperature) {
        temperature.textContent =
            latest.temperature.toFixed(2);
    }

    if (humidity) {
        humidity.textContent =
            latest.humidity.toFixed(2);
    }

    if (pressure) {
        pressure.textContent =
            latest.pressure.toFixed(2);
    }

    if (rssi) {
        rssi.textContent =
            latest.rssi ?? "—";
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

async function loadSystemStatus() {
    try {
        const response = await fetch("/api/status");

        if (!response.ok) {
            setSystemOffline();
            return;
        }

        const status = await response.json();
        updateSystemStatus(status);

    } catch (error) {
        console.error("Failed to load system status:", error);
        setSystemOffline();
    }
}

function updateSystemStatus(status) {
    const online = status.status === "online";

    document.getElementById("system-status").textContent =
        online ? "● ONLINE" : "○ OFFLINE";

    document.getElementById("system-device").textContent =
        status.device ?? "—";

    document.getElementById("system-firmware").textContent =
        status.firmware ?? "—";

    document.getElementById("system-uptime").textContent =
        formatUptime(status.uptime);

    document.getElementById("system-heap").textContent =
        status.free_heap !== null && status.free_heap !== undefined
            ? Math.round(status.free_heap / 1024) + " KiB"
            : "—";

    document.getElementById("system-uploads").textContent =
        status.successful_uploads ?? "—";

    document.getElementById("system-errors").textContent =
        status.failed_uploads ?? "—";

    document.getElementById("system-last-update").textContent =
        status.last_update
            ? formatDateTime(status.last_update)
            : "—";
}

function setSystemOffline() {
    document.getElementById("system-status").textContent =
        "○ OFFLINE";
}

function formatUptime(seconds) {
    if (seconds === null || seconds === undefined) {
        return "—";
    }

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return [
        days > 0 ? `${days}d` : null,
        `${String(hours).padStart(2, "0")}h`,
        `${String(minutes).padStart(2, "0")}m`
    ]
        .filter(Boolean)
        .join(" ");
}

function updateInstrumentLabels() {
    const rangeLabel =
        document.getElementById("time-base-value");

    const channelLabel =
        document.getElementById("channel-value");

    const description =
        document.getElementById("graph-description");

    if (rangeLabel) {
        rangeLabel.textContent = selectedRange;
    }

    const channelNames = {
        temperature: "TEMP",
        humidity: "HUMIDITY",
        pressure: "PRESSURE"
    };

    const currentChannel =
        channelNames[selectedView] ?? selectedView.toUpperCase();

    if (channelLabel) {
        channelLabel.textContent = currentChannel;
    }

    if (description) {
        description.textContent =
            `${currentChannel} / ${selectedRange}`;
    }
}

initializeRangeSelector();
initializeViewSelector();
loadMeasurements();
loadSystemStatus();

// Alle 60 Sekunden aktualisieren
setInterval(loadMeasurements, 60000);
setInterval(loadSystemStatus, 60000);
