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
    document.querySelector('select[name="order_by"]').value = "time";
    document.querySelector('input[name="max_radius"]').value = 100;
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
        console.log("Form Data:", Object.fromEntries(fd.entries()));
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

    
    async function getLocation(e) {
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
            document.querySelector('input[name="latitude"]').value = lat.toFixed(4);
            document.querySelector('input[name="longitude"]').value = lon.toFixed(4);
        }
        catch (err) {
            setStatus(`Error geocoding Location ${err.message}`);
        }
    }
    locbtn.addEventListener('click', getLocationauto);

    location_form.addEventListener('submit', async(e) => {
        e.preventDefault();
        renderRow([]);
        await getLocation(e);
        const lfd = new FormData(location_form);
        const fd = new FormData(form);
        const MaxRadius = lfd.get("max_radius").trim();
        const starttime = fd.get("start_time");
        const endtime = fd.get("end_time");
        const min_magnitude = fd.get("min_magnitude");
        const orderby = fd.get("order_by");
        const params = new URLSearchParams({
            start_time: starttime,
            end_time: endtime,
            min_magnitude: min_magnitude,
            order_by: orderby,
            limit: 100,
            latitude: lfd.get("latitude") || "",
            longitude: lfd.get("longitude") || "",
            max_radius_km: MaxRadius || "",
        });
        setStatus("Loading");
        try {
            const res = await fetch(`/api/earthquakes/radius?${params.toString()}`);
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
})


function getLocationauto() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(success, error);
    }
    else {
        alert("Geolocation is not supported by this browser.");
    }

    async function success(position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        var city = position.city || "Current Location";
        const res = await fetch(`/api/reverse_geocode?lat=${lat}&lon=${lon}`)
        const data = await res.json();
        if (!res.ok) {
            setStatus(`Error: ${data.error || res.statusText}`);
        }
        city = data.address || city;
        document.querySelector('input[name="latitude"]').value = lat.toFixed(4);
        document.querySelector('input[name="longitude"]').value = lon.toFixed(4);
        document.querySelector('input[name="location"]').value = city;
    }
    function error(err) {
        alert(`Error getting location: ${err.message}`);
    }
}