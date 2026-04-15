import './style.css'
import L from 'leaflet'
import 'leaflet-routing-machine'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import { 
  createIcons, 
  ShieldAlert, 
  Map, 
  Activity, 
  Navigation, 
  Settings, 
  User as UserIcon, 
  Crosshair, 
  Layers, 
  Bell, 
  Bed, 
  MapPin, 
  CheckCircle,
  Clock
} from 'lucide'

// Registro de íconos
const icons = { 
  ShieldAlert, 
  Map, 
  Activity, 
  Navigation, 
  Settings, 
  User: UserIcon, 
  Crosshair, 
  Layers, 
  Bell, 
  Bed, 
  MapPin, 
  CheckCircle,
  Clock
};

const hospitals = [
  {
    id: 'ney-arias',
    name: 'Hosp. Dr. Ney Arias Lora',
    coords: [18.5472, -69.8841],
    beds: { total: 100, available: 12 },
    type: 'Trauma',
    address: 'Av. Charles de Gaulle, Villa Mella'
  },
  {
    id: 'dario-contreras',
    name: 'Hosp. Darío Contreras',
    coords: [18.4855, -69.8631],
    beds: { total: 150, available: 4 },
    type: 'Trauma',
    address: 'Av. Las Américas, SDE'
  },
  {
    id: 'juan-bosch',
    name: 'Hosp. Ciudad Juan Bosch',
    coords: [18.4847, -69.7500],
    beds: { total: 80, available: 45 },
    type: 'General',
    address: 'Av. Camino Real, SDE'
  }
];

const ambulanceLocation = [18.4750, -69.9150];
let map;
let markers = {};
let activeHospital = null;
let routingControl = null;
let sheetState = 'collapsed';

function initMap() {
  map = L.map('map', {
    zoomControl: false,
    attributionControl: false
  }).setView(ambulanceLocation, 12);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(map);

  const ambulanceIcon = L.divIcon({
    html: `<div style="background: var(--primary); width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px var(--primary);"></div>`,
    className: 'custom-div-icon',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  L.marker(ambulanceLocation, { icon: ambulanceIcon }).addTo(map);

  hospitals.forEach(h => {
    const marker = L.marker(h.coords).addTo(map);
    marker.on('click', () => selectHospital(h));
    markers[h.id] = marker;
  });
}

function calculateDistance(coords1, coords2) {
  const R = 6371;
  const dLat = (coords2[0] - coords1[0]) * Math.PI / 180;
  const dLon = (coords2[1] - coords1[1]) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(coords1[0] * Math.PI / 180) * Math.cos(coords2[0] * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function renderHospitalList() {
  const listContainer = document.getElementById('hospital-list');
  listContainer.innerHTML = '';

  const sortedHospitals = [...hospitals].sort((a, b) => {
    return calculateDistance(ambulanceLocation, a.coords) - calculateDistance(ambulanceLocation, b.coords);
  });

  sortedHospitals.forEach((h, index) => {
    const dist = calculateDistance(ambulanceLocation, h.coords).toFixed(1);
    const bedPercent = (h.beds.available / h.beds.total) * 100;
    const statusClass = bedPercent > 30 ? 'success' : (bedPercent > 10 ? 'warning' : 'danger');
    const isClosest = index === 0;

    const card = document.createElement('div');
    card.className = `hospital-card ${activeHospital?.id === h.id ? 'active' : ''}`;
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
        <h3 style="margin-bottom: 0;">${h.name}</h3>
        ${isClosest ? '<span class="badge-closest">MÁS CERCANO</span>' : ''}
      </div>
      <div class="hospital-meta">
        <span><i data-lucide="map-pin" style="width: 12px; height: 12px; vertical-align: middle;"></i> ${dist} km</span>
        <span>${h.address}</span>
      </div>
      <div id="eta-${h.id}" class="eta-container" style="display: ${activeHospital?.id === h.id ? 'flex' : 'none'};">
        <i data-lucide="clock" style="width: 14px; height: 14px;"></i>
        <span class="eta-value">Calculando ruta...</span>
      </div>
      <div class="bed-badge ${statusClass}" style="margin-top: 10px;">
        ${h.beds.available} CAMAS LIBRES
      </div>
    `;

    card.onclick = (e) => {
      e.stopPropagation();
      selectHospital(h);
    };
    listContainer.appendChild(card);
  });

  createIcons({ icons });
}

function selectHospital(hospital) {
  if (activeHospital?.id === hospital.id) return;
  
  activeHospital = hospital;
  renderHospitalList();
  
  // 1. Limpiar ruta anterior si existe
  if (routingControl) {
    map.removeControl(routingControl);
  }

  // 2. Trazar nueva ruta
  routingControl = L.Routing.control({
    waypoints: [
      L.latLng(ambulanceLocation[0], ambulanceLocation[1]),
      L.latLng(hospital.coords[0], hospital.coords[1])
    ],
    router: L.Routing.osrmv1({
      serviceUrl: `https://router.project-osrm.org/route/v1`
    }),
    lineOptions: {
      styles: [
        { color: '#ffffff', opacity: 0.8, weight: 6 },
        { color: '#ff2e63', opacity: 1, weight: 4 }
      ],
      extendToWaypoints: true,
      missingRouteTolerance: 10
    },
    createMarker: () => null, // No crear marcadores adicionales del plugin
    addWaypoints: false,
    routeWhileDragging: false,
    fitSelectedRoutes: true,
    showAlternatives: false
  }).addTo(map);

  // 3. Actualizar ETA cuando se encuentre la ruta
  routingControl.on('routesfound', function(e) {
    const routes = e.routes;
    const summary = routes[0].summary;
    const timeMinutes = Math.round(summary.totalTime / 60);
    
    // Actualizar el ETA en la UI
    const etaElement = document.querySelector(`#eta-${hospital.id} .eta-value`);
    if (etaElement) {
      etaElement.innerText = `Llegada estimada: ${timeMinutes} min`;
    }
  });

  // Expandir Bottom Sheet
  const sheet = document.getElementById('bottom-sheet');
  sheet.classList.remove('collapsed');
  sheetState = 'expanded';

  // Mostrar botón
  const notifyBtn = document.getElementById('notify-btn');
  notifyBtn.style.display = 'block';
  
  createIcons({ icons });
}

function initUI() {
  const welcome = document.getElementById('welcome-screen');
  const startBtn = document.getElementById('btn-start');
  const sheet = document.getElementById('bottom-sheet');
  const handle = document.getElementById('sheet-handle');
  const locateBtn = document.getElementById('locate-btn');
  const navItems = document.querySelectorAll('.nav-item');

  startBtn.onclick = () => {
    welcome.style.opacity = '0';
    setTimeout(() => welcome.style.display = 'none', 500);
  };

  handle.onclick = () => {
    sheet.classList.toggle('collapsed');
    sheetState = sheet.classList.contains('collapsed') ? 'collapsed' : 'expanded';
  };

  locateBtn.onclick = () => {
    map.flyTo(ambulanceLocation, 14);
  };

  navItems.forEach(item => {
    item.onclick = () => {
      navItems.forEach(i => i.classList.remove('active'));
      document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
      item.classList.add('active');
      const tab = item.getAttribute('data-tab');
      
      const viewMap = {
        'map': 'view-map',
        'activity': 'view-activity',
        'navigation': 'view-navigation',
        'settings': 'view-settings'
      };
      
      const viewId = viewMap[tab];
      if (viewId) {
        document.getElementById(viewId).classList.add('active');
        if (viewId === 'view-map' && map) {
          setTimeout(() => map.invalidateSize(), 100);
        }
      }
    };
  });

  const notifyBtn = document.getElementById('notify-btn');
  notifyBtn.onclick = () => {
    // Colapsar hoja para ver la ruta despejada
    sheet.classList.add('collapsed');
    sheetState = 'collapsed';

    notifyBtn.innerHTML = `<i data-lucide="check-circle" style="width: 20px; height: 20px; vertical-align: middle; margin-right: 8px;"></i> NOTIFICADO`;
    notifyBtn.style.background = 'var(--success)';
    createIcons({ icons });
    
    setTimeout(() => {
      notifyBtn.innerHTML = `<i data-lucide="bell" style="width: 20px; height: 20px; vertical-align: middle; margin-right: 8px;"></i> NOTIFICAR INGRESO`;
      notifyBtn.style.background = 'var(--primary)';
      createIcons({ icons });
    }, 3000);
  };
}

document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initUI();
  renderHospitalList();
});
