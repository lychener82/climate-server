let selectedRegistrarRange = "1D";

let temperatureRegistrarChart;
let humidityRegistrarChart;
let pressureRegistrarChart;


async function loadRegistrarData() {
    try {
        const response = await fetch(
            `/api/measurements?range=${
                encodeURIComponent(selectedRegistrarRange)
            }`
        );

        if (!response.ok) {
            throw new Error(
                `Measurement API returned ${response.status}`
            );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Invalid measurement response");
        }

        updateRegistrarValues(data);
        updateRegistrarStatistics(data);
        updateRegistrarCharts(data);

    } catch (error) {
        console.error(
            "Failed to load registrar data:",
            error
        );
    }
}


async function loadRegistrarStatus() {
    try {
        const response = await fetch("/api/status");

        if (!response.ok) {
            setRegistrarOffline();
            return;
        }

        const status = await response.json();

        updateRegistrarStatus(status);

    } catch (error) {
        console.error(
            "Failed to load registrar status:",
            error
        );

        setRegistrarOffline();
    }
}


function updateRegistrarStatus(status) {
    const online = status.status === "online";

    const statusElement =
        document.getElementById("registrar-status");

    statusElement.textContent =
        online ? "● RECORDING" : "○ INTERRUPTED";

    statusElement.classList.toggle(
        "status-online",
        online
    );

    statusElement.classList.toggle(
        "status-offline",
        !online
    );

    document.getElementById(
        "registrar-device"
    ).textContent = status.device ?? "—";

    document.getElementById(
        "registrar-last-update"
    ).textContent = status.last_update
        ? formatRegistrarDateTime(status.last_update)
        : "—";
}


function setRegistrarOffline() {
    const statusElement =
        document.getElementById("registrar-status");

    statusElement.textContent = "○ INTERRUPTED";

    statusElement.classList.remove("status-online");
    statusElement.classList.add("status-offline");
}


function updateRegistrarValues(data) {
    if (data.length === 0) {
        setText("registrar-temperature", "—");
        setText("registrar-humidity", "—");
        setText("registrar-pressure", "—");
        return;
    }

    const latest = data[data.length - 1];

    setText(
        "registrar-temperature",
        formatNumber(latest.temperature, 2)
    );

    setText(
        "registrar-humidity",
        formatNumber(latest.humidity, 2)
    );

    setText(
        "registrar-pressure",
        formatNumber(latest.pressure, 2)
    );
}


function updateRegistrarStatistics(data) {
    updateStatisticGroup(
        "temperature",
        data.map(item => item.temperature),
        2
    );

    updateStatisticGroup(
        "humidity",
        data.map(item => item.humidity),
        2
    );

    updateStatisticGroup(
        "pressure",
        data.map(item => item.pressure),
        2
    );
}


function updateStatisticGroup(
    prefix,
    values,
    decimalPlaces
) {
    const validValues = values.filter(
        value => Number.isFinite(value)
    );

    if (validValues.length === 0) {
        setText(`${prefix}-min`, "MIN —");
        setText(`${prefix}-mean`, "MEAN —");
        setText(`${prefix}-max`, "MAX —");
        return;
    }

    const minimum = Math.min(...validValues);
    const maximum = Math.max(...validValues);

    const mean =
        validValues.reduce(
            (sum, value) => sum + value,
            0
        ) / validValues.length;

    setText(
        `${prefix}-min`,
        `MIN ${minimum.toFixed(decimalPlaces)}`
    );

    setText(
        `${prefix}-mean`,
        `MEAN ${mean.toFixed(decimalPlaces)}`
    );

    setText(
        `${prefix}-max`,
        `MAX ${maximum.toFixed(decimalPlaces)}`
    );
}


function updateRegistrarCharts(data) {
    const labels = data.map(item =>
        formatRegistrarAxisLabel(item.timestamp)
    );

    const fullTimestamps = data.map(item =>
        formatRegistrarDateTime(item.timestamp)
    );

    temperatureRegistrarChart =
        createOrUpdateRegistrarChart(
            temperatureRegistrarChart,
            "temperatureRegistrarChart",
            labels,
            data.map(item => item.temperature),
            fullTimestamps,
            "Temperature",
            "°C"
        );

    humidityRegistrarChart =
        createOrUpdateRegistrarChart(
            humidityRegistrarChart,
            "humidityRegistrarChart",
            labels,
            data.map(item => item.humidity),
            fullTimestamps,
            "Relative humidity",
            "% RH"
        );

    pressureRegistrarChart =
        createOrUpdateRegistrarChart(
            pressureRegistrarChart,
            "pressureRegistrarChart",
            labels,
            data.map(item => item.pressure),
            fullTimestamps,
            "Atmospheric pressure",
            "hPa"
        );
}


function createOrUpdateRegistrarChart(
    existingChart,
    canvasId,
    labels,
    values,
    fullTimestamps,
    label,
    unit
) {
    if (existingChart) {
        existingChart.data.labels = labels;
        existingChart.data.datasets[0].data = values;
        existingChart.data.datasets[0].fullTimestamps =
            fullTimestamps;

        existingChart.update("none");

        return existingChart;
    }

    const canvas = document.getElementById(canvasId);

    return new Chart(
        canvas,
        {
            type: "line",

            data: {
                labels,

                datasets: [{
                    label,
                    data: values,
                    fullTimestamps,
                    unit,

                    borderColor: "#191914",
                    backgroundColor: "transparent",

                    borderWidth: 1,
                    pointRadius: 0,
                    pointHoverRadius: 3,
                    pointHitRadius: 12,

                    tension: 0.05,
                    fill: false
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

                layout: {
                    padding: {
                        top: 5,
                        right: 5,
                        bottom: 0,
                        left: 0
                    }
                },

                plugins: {
                    legend: {
                        display: false
                    },

                    tooltip: {
                        displayColors: false,

                        backgroundColor: "#f5f3e9",
                        borderColor: "#191914",
                        borderWidth: 1,

                        titleColor: "#191914",
                        bodyColor: "#191914",

                        callbacks: {
                            title(items) {
                                const item = items[0];

                                return item.dataset
                                    .fullTimestamps[
                                        item.dataIndex
                                    ];
                            },

                            label(context) {
                                const value =
                                    context.parsed.y;

                                return (
                                    `${context.dataset.label}: ` +
                                    `${value.toFixed(2)} ` +
                                    context.dataset.unit
                                );
                            }
                        }
                    }
                },

                scales: {
                    x: {
                        grid: {
                            display: false
                        },

                        border: {
                            display: false
                        },

                        ticks: {
                            color: "#68665e",
                            maxTicksLimit: 10,
                            maxRotation: 0,
                            autoSkip: true,

                            font: {
                                family:
                                    "ui-monospace, monospace",
                                size: 9
                            }
                        }
                    },

                    y: {
                        grid: {
                            display: false
                        },

                        border: {
                            display: false
                        },

                        ticks: {
                            color: "#68665e",
                            maxTicksLimit: 5,

                            font: {
                                family:
                                    "ui-monospace, monospace",
                                size: 9
                            },

                            callback(value) {
                                return Number(value)
                                    .toFixed(1);
                            }
                        }
                    }
                }
            }
        }
    );
}


function initializeRegistrarRangeSelector() {
    const buttons = document.querySelectorAll(
        "#registrar-range-selector button[data-range]"
    );

    buttons.forEach(button => {
        button.addEventListener("click", async () => {
            const newRange = button.dataset.range;

            if (
                !newRange
                || newRange === selectedRegistrarRange
            ) {
                return;
            }

            selectedRegistrarRange = newRange;

            buttons.forEach(item => {
                const active =
                    item.dataset.range
                    === selectedRegistrarRange;

                item.classList.toggle(
                    "active",
                    active
                );

                item.setAttribute(
                    "aria-pressed",
                    String(active)
                );
            });

            updateRegistrarPeriodLabel();

            await loadRegistrarData();
        });
    });
}


function updateRegistrarPeriodLabel() {
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

    setText(
        "registrar-period",
        periodNames[selectedRegistrarRange]
            ?? selectedRegistrarRange
    );
}


function formatRegistrarAxisLabel(timestamp) {
    const date = new Date(timestamp);

    switch (selectedRegistrarRange) {
        case "1H":
        case "6H":
        case "1D":
            return date.toLocaleTimeString(
                "de-DE",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

        case "1W":
        case "1M":
            return date.toLocaleDateString(
                "de-DE",
                {
                    day: "2-digit",
                    month: "2-digit"
                }
            );

        default:
            return date.toLocaleDateString(
                "de-DE",
                {
                    month: "short",
                    year: "2-digit"
                }
            );
    }
}


function formatRegistrarDateTime(timestamp) {
    return new Date(timestamp).toLocaleString(
        "de-DE",
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZoneName: "short"
        }
    );
}


function formatNumber(value, decimalPlaces) {
    return Number.isFinite(value)
        ? value.toFixed(decimalPlaces)
        : "—";
}


function setText(elementId, text) {
    const element = document.getElementById(elementId);

    if (element) {
        element.textContent = text;
    }
}


initializeRegistrarRangeSelector();
updateRegistrarPeriodLabel();

loadRegistrarData();
loadRegistrarStatus();

setInterval(loadRegistrarData, 60000);
setInterval(loadRegistrarStatus, 60000);
