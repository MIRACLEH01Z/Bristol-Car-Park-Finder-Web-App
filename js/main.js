const apiURL = "https://maps2.bristol.gov.uk/server2/rest/services/ext/ll_transport/MapServer/5/query?where=1%3D1&outFields=NAME,NUMBER_LEVELS,OPERATOR,SPACES,OPERATING_TIMES,FACILITY_TYPE,CCTV,OCCUPANCY,TREND&outSR=4326&f=json";

const map = L.map('map').setView([51.4545, -2.5879], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let carparkData = [];
let markers = [];

async function fetchData() {
  try {
    const response = await fetch(apiURL);
    const data = await response.json();
    carparkData = data.features;
    buildTable(carparkData);
    plotMap(carparkData);
    document.getElementById('loading').style.display = "none";
  } catch (error) {
    document.getElementById('loading').innerText = "Error loading data!";
    console.error("Error fetching data:", error);
  }
}

// Build table
function buildTable(carparks) {
  const tableBody = document.querySelector('#carpark-table tbody');
  tableBody.innerHTML = "";

  carparks.forEach(item => {
    const attributes = item.attributes;
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${attributes.NAME || 'N/A'}</td>
      <td>${attributes.NUMBER_LEVELS || 'N/A'}</td>
      <td>${attributes.OPERATOR || 'N/A'}</td>
      <td>${attributes.SPACES || 'N/A'}</td>
      <td>${attributes.OPERATING_TIMES || 'N/A'}</td>
      <td>${attributes.FACILITY_TYPE || 'N/A'}</td>
      <td>${attributes.CCTV || 'N/A'}</td>
      <td>${attributes.OCCUPANCY || 'N/A'}</td>
      <td>${attributes.TREND || 'N/A'}</td>
    `;
    row.dataset.name = attributes.NAME.toLowerCase(); // Store name in data attribute
    tableBody.appendChild(row);
  });
}

// Plotting markers and store them
function plotMap(carparks) {
  markers.forEach(marker => map.removeLayer(marker));
  markers = [];

  carparks.forEach(item => {
    if (item.geometry) {
      const lat = item.geometry.y;
      const lng = item.geometry.x;
      const name = item.attributes.NAME || 'No Name';

      const marker = L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`<b>${name}</b><br>${item.attributes.OPERATOR || ''}`);
      marker.name = name.toLowerCase();
      markers.push(marker);
    }
  });

  // Fitting map to all markers initially
  if (markers.length > 0) {
    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds());
  }
}

// Search Functionality
document.getElementById('search').addEventListener('input', function(e) {
  const searchTerm = e.target.value.toLowerCase();

  // Filtering table rows
  const rows = document.querySelectorAll('#carpark-table tbody tr');
  rows.forEach(row => {
    if (row.dataset.name.includes(searchTerm)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });

 
  let filteredMarkers = markers.filter(marker => marker.name.includes(searchTerm));
  markers.forEach(marker => map.removeLayer(marker));
  filteredMarkers.forEach(marker => marker.addTo(map));

  // Zoom in if results found
  if (filteredMarkers.length > 0) {
    const group = L.featureGroup(filteredMarkers);
    map.fitBounds(group.getBounds());
  }
});

window.onload = fetchData;
