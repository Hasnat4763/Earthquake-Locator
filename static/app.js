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
            </tr>
        `;
    }).join("");
}

function setDefaultDates() {
    const end = new Date();
    const start = new Date(end - 7*24*3600*1000);
    const min_magnitude = 0.1;

    const endStr = end.toISOString().slice(0,10);
    const startStr = start.toISOString().slice(0,10);

    document.querySelector('input[name="start_time"]').value = startStr;
    document.querySelector('input[name="end_time"]').value = endStr;
    document.querySelector('input[name="min_magnitude"]').value = min_magnitude;
}

document.addEventListener("DOMContentLoaded", () => {
    setDefaultDates();

    const form = document.getElementById('searchForm');
    const location_form = document.getElementById('locationForm');
    const resetBtn = document.getElementById('resetBtn');
    const locbtn = document.getElementById('findlocbtn');

    resetBtn.addEventListener('click', ()=> {
        form.reset();
        setDefaultDates();
        setStatus("Idle");
        renderRow([]);
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const params = new URLSearchParams(fd);

        setStatus("Loading");

        try {
            const res = await fetch(`/api/earthquakes?${params.toString()}`);
            const data = await res.json();

            if(!res.ok) {
                setStatus(`Error: ${data.error || res.statusText}`);
                renderRow([]);
                return;
            }

            const features = data.features || [];
            setStatus(`Found ${features.length} earthquakes`);
            renderRow(features);

        }
        catch (err) {
            setStatus(`Error: ${err.message}`);
            renderRow([]);
        }
    })

    locbtn.addEventListener('click', async(e) => {
        e.preventDefault();
        const lfd = new FormData(location_form);
        const Location = lfd.get("location").trim();
        if (!Location) {
            setStatus("Place name is required.");
            return;
        }
        try {
            const res = await fetch(`/api/geocode?q=${encodeURIComponent(Location)}`);
            const data = await res.json();
            if (!res.ok) {
                setStatus(`Error: ${data.error || res.statusText}`);
                return;
            }
            const lat = data.latitude;
            const lon = data.longitude;
            document.querySelector('input[name="latitude"]').value = lat;
            document.querySelector('input[name="longitude"]').value = lon;
        }
        catch (err) {
            setStatus(`Error geocoding Location ${err.message}`);
        }
    })
})