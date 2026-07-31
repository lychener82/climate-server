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

    // letzter Messwert
    const latest = data[data.length - 1];

    document.getElementById("temperature").textContent =
        latest.temperature.toFixed(1) + " °C";

    document.getElementById("humidity").textContent =
        latest.humidity.toFixed(1) + " %";

    document.getElementById("pressure").textContent =
        latest.pressure.toFixed(1) + " hPa";

    document.getElementById("rssi").textContent =
        latest.rssi + " dBm";
}

loadMeasurements();
