const api_url = "https://maps2.bristol.gov.uk/server2/rest/services/ext/ll_transport/MapServer/5/query?where=1%3D1&outFields=NAME,NUMBER_LEVELS,OPERATOR,SPACES,OPERATING_TIMES,FACILITY_TYPE,CCTV,OCCUPANCY,TREND&outSR=4326&f=json";

// Initializing map centered to Bristol
const map = L.map('map').setView([51.4545, -2.5879], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  max_zoom: 18,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let carpark_data = [];
let markers = [];

// fetching car data from the API
async function getCarParksFromAPI() {
  try {
    const response = await fetch(api_url);
    const data = await response.json();
    carpark_data = data.features;
    build_table(carpark_data);
    plotCarParks_OnMap(carpark_data);
    document.getElementById('loading').style.display = "none";
  } catch (error) {
    document.getElementById('loading').innerText = "Error loading data!";
    console.error("Error fetching data:", error);
  }
}

// adding car park information to a table
function build_table(carparks) {
  const table_body = document.querySelector('#carpark-table tbody');
  table_body.innerHTML = "";

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
    table_body.appendChild(row);
  });
}

// Plotting markers and store them
function plotCarParks_OnMap(carparks) {
  // clearing previous markers
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

  // Adjust map view fit all markers
  if (markers.length > 0) {
    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds());
  }
}

// Filter car parks based on user input
document.getElementById('search').addEventListener('input', function(e) {
  const search_term = e.target.value.toLowerCase();

  // Filtering table rows
  const rows = document.querySelectorAll('#carpark-table tbody tr');
  rows.forEach(row => {
    if (row.dataset.name.includes(search_term)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });

 
  let filtered_markers = markers.filter(marker => marker.name.includes(search_term));
  markers.forEach(marker => map.removeLayer(marker));
  filtered_markers.forEach(marker => marker.addTo(map));

  // Zoom in when results are found
  if (filtered_markers.length > 0) {
    const group = L.featureGroup(filtered_markers);
    map.fitBounds(group.getBounds());
  }
});

window.onload = getCarParksFromAPI;
