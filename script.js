// --- Custom Map Message Function ---
function showMapMessage(message, type = 'info', duration = 3000) {
    const existingMessage = document.querySelector('.map-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageContainer = document.createElement('div');
    messageContainer.className = `map-message ${type}`;
    messageContainer.textContent = message;
    
    document.body.appendChild(messageContainer);

    setTimeout(() => {
        messageContainer.classList.add('hidden');
        setTimeout(() => {
            messageContainer.remove();
        }, 500);
    }, duration);
}

// --- Map Initialization ---

// Define the base layers
var peta1 = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    attribution: '© Google Maps',
    maxZoom: 20,
});

var peta2 = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '© Google Maps'
});

var peta3 = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

var peta4 = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: 'Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://carto.com/attributions">CARTO</a>'
});

var peta5 = L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: 'Map data © <a href="https://www.google.com/maps">Google Maps</a>'
});

var peta6 = L.tileLayer.wms('https://petadasar.atrbpn.go.id/main/wms/{x}/{y}/{z}', {
    maxZoom: 20,
    layers: 'ATRBPN.Citra_Nasional',
    format: 'image/jpeg',
    version: '1.1.1',
    transparent: false,
    attribution: 'Peta Dasar ATRBPN'
});

// Define default view coordinates and zoom
const defaultCenter = [-1.6108583427442669, 103.6163445212305];
const defaultZoom = 13;

// Initialize the map
const map = L.map('map', {
    center: defaultCenter,
    zoom: defaultZoom,
    layers: [peta1],
    zoomControl: false // Menonaktifkan kontrol zoom bawaan
});

// Tambahkan kontrol zoom baru di posisi kiri bawah
L.control.zoom({
    position: 'bottomleft'
}).addTo(map);

// --- Marker and Coordinate Handling ---
var latInput = document.getElementById("Latitude");
var lngInput = document.getElementById("Longitude");
var marker = new L.marker(defaultCenter, { draggable: 'true' }).addTo(map);

marker.on('dragend', function (e) {
    var position = marker.getLatLng();
    latInput.value = position.lat;
    lngInput.value = position.lng;
});

map.on("click", function(e) {
    marker.setLatLng(e.latlng);
    latInput.value = e.latlng.lat;
    lngInput.value = e.latlng.lng;
});

// --- Geocoder Search Control (for general locations) ---
var geocoder = L.Control.geocoder({
    defaultMarkGeocode: false, // We use our own marker
    placeholder: 'Cari lokasi...',
    errorMessage: 'Lokasi tidak ditemukan.',
    geocoder: new L.Control.Geocoder.Nominatim({
        geocodingQueryParams: {
            countrycodes: 'id', // Prioritize results in Indonesia
            viewbox: '103.50,-1.75,103.75,-1.50', // Bounding box for Jambi City
            bounded: 1
        }
    })
})
.on('markgeocode', function(e) {
    var center = e.geocode.center;
    map.setView(center, 17);
    marker.setLatLng(center);
    latInput.value = center.lat;
    lngInput.value = center.lat;
})
.addTo(map);

// --- Layer Control ---
const baseLayers = {
    'Google Maps': peta1,
    'Google Satelite': peta2,
    'Open Street Map': peta3,
    'CARTO': peta4,
    'Google Hybrid': peta5,
    'ATRBPN': peta6,
};
L.control.layers(baseLayers).addTo(map);
map.attributionControl.setPrefix(false);

// --- GeoJSON Functionality ---
var geojsonUrl = "https://raw.githubusercontent.com/semooth26/webgis-kota-jambi/refs/heads/main/Admin_Kota_Jambi_fix.geojson";
var loadGeojsonBtn = document.getElementById("loadGeojsonBtn");
var hideGeojsonBtn = document.getElementById("hideGeojsonBtn");
var zoomToDefaultBtn = document.getElementById("zoomToDefaultBtn");
var geojsonLayer = null;

loadGeojsonBtn.addEventListener('click', function() {
    if (geojsonLayer) {
        map.removeLayer(geojsonLayer);
    }
    
    fetch(geojsonUrl)
        .then(response => {
            if (!response.ok) throw new Error('Gagal memuat file GeoJSON.');
            return response.json();
        })
        .then(data => {
            geojsonLayer = L.geoJSON(data, {
                style: feature => ({
                    fillColor: 'transparent', weight: 2, opacity: 1, color: '#3498db', dashArray: '3', fillOpacity: 0.7
                }),
                onEachFeature: (feature, layer) => {
                    layer.on({
                        mouseover: e => layer.setStyle({ weight: 5, color: '#666', dashArray: '' }),
                        mouseout: e => geojsonLayer.resetStyle(layer),
                        click: e => {
                            let content = "<b>Informasi Properti:</b><br>";
                            if (feature.properties) {
                                for (let key in feature.properties) {
                                    content += `<b>${key}</b>: ${feature.properties[key]}<br>`;
                                }
                            } else {
                                content = "Tidak ada properti.";
                            }
                            L.popup().setLatLng(e.latlng).setContent(content).openOn(map);
                        }
                    });
                }
            }).addTo(map);
            showMapMessage("Data berhasil dimuat! Klik pada area untuk melihat info.", 'info');
            hideGeojsonBtn.style.display = 'block';
        })
        .catch(error => {
            showMapMessage("Terjadi kesalahan: " + error.message, 'error');
            console.error('Error loading GeoJSON:', error);
        });
});

hideGeojsonBtn.addEventListener('click', function() {
    if (geojsonLayer) {
        map.removeLayer(geojsonLayer);
        geojsonLayer = null;
        hideGeojsonBtn.style.display = 'none';
    }
});

zoomToDefaultBtn.addEventListener('click', () => map.setView(defaultCenter, defaultZoom));

// --- GeoJSON Search Functionality ---
const geojsonSearchInput = document.getElementById('geojsonSearch');
const searchGeojsonBtn = document.getElementById('searchGeojsonBtn');
let lastHighlight = null; // Variable to store the last highlighted layer

searchGeojsonBtn.addEventListener('click', () => {
    if (!geojsonLayer) {
        showMapMessage('Mohon tampilkan data terlebih dahulu.', 'error');
        return;
    }

    const searchTerm = geojsonSearchInput.value.toLowerCase().trim();
    if (searchTerm === '') {
        showMapMessage('Mohon masukkan kata kunci pencarian.', 'error');
        return;
    }

    let found = false;
    // Reset the style of the last highlighted feature, if any
    if (lastHighlight) {
        geojsonLayer.resetStyle(lastHighlight);
        lastHighlight = null;
    }

    geojsonLayer.eachLayer(layer => {
        const properties = layer.feature.properties;
        // Check if any property value contains the search term
        for (const key in properties) {
            if (typeof properties[key] === 'string' && properties[key].toLowerCase().includes(searchTerm)) {
                found = true;
                // Zoom and center the map on the found feature
                map.fitBounds(layer.getBounds());
                
                // Highlight the found feature
                layer.setStyle({
                    weight: 5,
                    color: '#e74c3c',
                    dashArray: '',
                    fillOpacity: 0.9
                });
                lastHighlight = layer; // Store the reference to reset later

                // Create popup content
                let content = "<b>Informasi Properti:</b><br>";
                for (let prop in properties) {
                    content += `<b>${prop}</b>: ${properties[prop]}<br>`;
                }
                
                // Open a popup for the found feature
                layer.bindPopup(content).openPopup();

                showMapMessage(`Data "${searchTerm}" berhasil ditemukan!`, 'info');
                return; // Exit the loop after the first match
            }
        }
    });

    if (!found) {
        showMapMessage(`Data "${searchTerm}" tidak ditemukan.`, 'error');
    }
});

// --- NEW: Autohide Functionality ---
const togglePanelBtn = document.getElementById('togglePanelBtn');
const coordinatePanel = document.getElementById('coordinate-panel');

togglePanelBtn.addEventListener('click', () => {
    coordinatePanel.classList.toggle('hidden');
    togglePanelBtn.classList.toggle('hidden');
});
