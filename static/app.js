function setStatus(message) {
    document.getElementById('status').textContent = message;
}

function formatTime(ms) {
    const d = new Date(ms);
    return d.toISOString().replace(".000Z", "Z");
}

function escapeHTML(str) {
    return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderRow(feature) {
    const Body = document.getElementById('resultbody');
    if (!feature || feature.length === 0) {
        Body.innerHTML = `<tr><td colspan='5' class='muted'> No Earthquakes Found </td></tr>`;
        return;
    }

    Body.innerHTML = feature.map((f) => {
        const properties = f.properties || {};
        const geometry = f.geometry || {};
        const coords = Array.isArray(geometry.coordinates) ? geometry.coordinates : [];
        const depthkm = coords.length >= 3 ? coords[2] : null;

        const time = properties.time ? formatTime(properties.time) : "";
        const mag = (properties.mag ?? "");
        const place = escapeHTML(properties.place ?? "");
        const url = properties.url ?? null;

        return `
            <tr>
                <td>${time}</td>
                <td>${mag}</td>
                <td>${place}</td>
                <td>${depthkm ?? ""}</td>
                <td>${url ? `<a href=${url} target="_blank" rel="noreferrer noopener"> USGS </a>` : ""}</td>
            </tr>
        `;
    }).join("");
}

function 