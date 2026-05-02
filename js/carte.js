  let PARCELLES = [];
  let activeStatus  = 'all';
  let activeDistrict = 'all';
  let activeType    = 'all';
  let markerMap     = {};
  let currentTile   = 'satellite';

  const TILES = {
    satellite: L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Tiles &copy; Esri', maxZoom: 19 }
    ),
    streets: L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }
    ),
    dark: L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      { attribution: '&copy; CartoDB', maxZoom: 19 }
    ),
  };

  const map = L.map('map', {
    center: [-4.2700, 15.2850],
    zoom: 13,
    zoomControl: true,
    layers: [TILES.satellite],
  });

  map.zoomControl.setPosition('topright');

  map.on('mousemove', e => {
    document.getElementById('map-coords').textContent =
      `Lat: ${e.latlng.lat.toFixed(4)}° | Lng: ${e.latlng.lng.toFixed(4)}°`;
  });

  const STATUS_LABELS = { confirmed: 'Confirmé', litige: 'Brouillon', pending: 'En Attente' };
  const STATUS_BADGE  = { confirmed: 'popup__badge--confirmed', litige: 'popup__badge--litige', pending: 'popup__badge--pending' };
  const DOT_CLASS     = { confirmed: 'dot-green', litige: 'dot-red', pending: 'dot-orange' };

  function buildPopup(p) {
    return `
      <div class="popup__id">#${p.id}</div>
      <div class="popup__row">
        <span class="popup__key">Statut</span>
        <span class="popup__badge ${STATUS_BADGE[p.status]}">${STATUS_LABELS[p.status]}</span>
      </div>
      <div class="popup__row">
        <span class="popup__key">Propriétaire</span>
        <span class="popup__val">${p.owner}</span>
      </div>
      <div class="popup__row">
        <span class="popup__key">District</span>
        <span class="popup__val">${p.district}</span>
      </div>
      <div class="popup__row">
        <span class="popup__key">Type</span>
        <span class="popup__val">${p.type}</span>
      </div>
      <div class="popup__row">
        <span class="popup__key">Superficie</span>
        <span class="popup__val">${p.area}</span>
      </div>
    `;
  }

  function addMarkers() {
    Object.values(markerMap).forEach(entry => map.removeLayer(entry.marker));
    markerMap = {};

    PARCELLES.forEach(p => {
      if (p.coordinates && p.coordinates.length >= 3) {
        let color = '#00e57a'; // confirmed / FINALIZED
        if (p.status === 'litige') color = '#3b82f6'; // DRAFT (Bleu)
        if (p.status === 'pending') color = '#f59e0b'; // COMMUNITY_VALIDATED (Orange)

        const elements = [];

        const outerBorder = L.polygon(p.coordinates, {
          color: '#ffffff', fillColor: 'transparent', fillOpacity: 0, weight: 5, opacity: 0.8, dashArray: '', lineCap: 'square', lineJoin: 'miter'
        });
        elements.push(outerBorder);

        const polygon = L.polygon(p.coordinates, {
          color: color, fillColor: color, fillOpacity: 0.25, weight: 3, opacity: 1, dashArray: '8, 4', lineCap: 'square', lineJoin: 'miter'
        });
        polygon.bindPopup(buildPopup(p), { maxWidth: 240, className: '' });
        elements.push(polygon);

        p.coordinates.forEach(coord => {
          const cornerMarker = L.circleMarker(coord, {
            radius: 5, color: '#ffffff', fillColor: color, fillOpacity: 1, weight: 2
          });
          elements.push(cornerMarker);
        });

        const center = polygon.getBounds().getCenter();
        const label = L.marker(center, {
          icon: L.divIcon({
            className: 'parcel-label',
            html: `<div style="background: rgba(0,0,0,0.85);color: ${color};padding: 4px 10px;border-radius: 6px;font-size: 11px;font-weight: 800;white-space: nowrap;border: 2px solid ${color};box-shadow: 0 2px 12px rgba(0,0,0,0.6);text-align: center;line-height: 1.4;font-family: 'Space Mono', monospace;"><div>${p.id}</div><div style="font-size:8px;color:#ccc;font-weight:400;">${p.area} · ${p.type}</div></div>`,
            iconSize: [0, 0],
            iconAnchor: [50, 20]
          })
        });
        label.bindPopup(buildPopup(p), { maxWidth: 240, className: '' });
        elements.push(label);

        polygon.on('mouseover', () => {
          polygon.setStyle({ fillOpacity: 0.5, weight: 4, dashArray: '' });
          outerBorder.setStyle({ weight: 6, color: color });
        });
        polygon.on('mouseout', () => {
          polygon.setStyle({ fillOpacity: 0.25, weight: 3, dashArray: '8, 4' });
          outerBorder.setStyle({ weight: 5, color: '#ffffff' });
        });

        const group = L.featureGroup(elements);
        markerMap[p.id] = { marker: group, polygon: polygon, data: p };
      }
    });
  }

  function renderList(parcelles) {
    const list = document.getElementById('parcelle-list');
    document.getElementById('parcelle-count').textContent = parcelles.length;
    list.innerHTML = parcelles.map(p => `
      <article class="parcelle-item" onclick="focusParcelle('${p.id}')" tabindex="0"
               onkeypress="if(event.key==='Enter')focusParcelle('${p.id}')"
               aria-label="Parcelle ${p.id}, ${STATUS_LABELS[p.status]}">
        <div class="parcelle-item__id">${p.id}</div>
        <div class="parcelle-item__meta">${p.district} — ${p.area}</div>
        <span class="parcelle-item__dot ${DOT_CLASS[p.status]}"></span>
      </article>
    `).join('');
  }

  function focusParcelle(id) {
    const entry = markerMap[id];
    if (!entry) return;
    map.flyTo([entry.data.lat, entry.data.lng], 16, { duration: 1 });
    entry.polygon.openPopup();
    document.querySelectorAll('.parcelle-item').forEach(el => el.classList.remove('active'));
    const el = [...document.querySelectorAll('.parcelle-item')]
      .find(el => el.querySelector('.parcelle-item__id').textContent === id);
    if (el) { el.classList.add('active'); el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  }

  function getFiltered() {
    return PARCELLES.filter(p => {
      if (activeStatus  !== 'all' && p.status   !== activeStatus)  return false;
      if (activeDistrict !== 'all' && p.district !== activeDistrict) return false;
      if (activeType    !== 'all' && p.type     !== activeType)    return false;
      return true;
    });
  }

  function applyFilters() {
    activeDistrict = document.getElementById('filter-district').value;
    activeType     = document.getElementById('filter-type').value;
    updateMap();
  }

  function filterStatus(status, btn) {
    activeStatus = status;
    document.querySelectorAll('.status-btn').forEach(b => {
      b.classList.remove('active', 'active-red', 'active-orange');
    });
    if (status === 'all')       btn.classList.add('active');
    else if (status === 'litige')  btn.classList.add('active-red');
    else if (status === 'pending') btn.classList.add('active-orange');
    else                           btn.classList.add('active');
    updateMap();
  }

  function updateMap() {
    const filtered = getFiltered();
    const filteredIds = new Set(filtered.map(p => p.id));

    Object.entries(markerMap).forEach(([id, entry]) => {
      if (filteredIds.has(id)) {
        if (!map.hasLayer(entry.marker)) map.addLayer(entry.marker);
      } else {
        map.removeLayer(entry.marker);
      }
    });

    renderList(filtered);
    
    // Fit bounds
    const layers = Object.values(markerMap)
      .filter(entry => filteredIds.has(entry.data.id))
      .map(entry => entry.marker);
    if (layers.length > 0) {
      const group = L.featureGroup(layers);
      map.fitBounds(group.getBounds(), { padding: [40, 40] });
    }
  }

  function switchTile(name, btn) {
    if (name === currentTile) return;
    map.removeLayer(TILES[currentTile]);
    map.addLayer(TILES[name]);
    currentTile = name;
    document.querySelectorAll('.tile-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  function openVerifyModal() {
    const modal = new bootstrap.Modal(document.getElementById('verifyModal'));
    modal.show();
  }

  function runVerify() {
    const q = document.getElementById('verify-input').value.trim().replace('#','').toUpperCase();
    const result = document.getElementById('verify-result');
    const match = PARCELLES.find(p => p.id.toUpperCase() === q || p.id.toUpperCase().includes(q));

    if (match) {
      result.style.display = 'block';
      result.innerHTML = `
        <div style="background:var(--fc-green-dim);border:1px solid rgba(0,229,122,.3);border-radius:8px;padding:12px;">
          <div style="font-family:var(--fc-mono);font-size:11px;color:var(--fc-green);margin-bottom:8px;">
            ✓ Titre trouvé et vérifié
          </div>
          <div style="font-size:12px;color:var(--fc-text);">
            <strong>#${match.id}</strong><br>
            Propriétaire : ${match.owner}<br>
            District : ${match.district} · ${match.type}<br>
            Superficie : ${match.area}
          </div>
        </div>`;
      setTimeout(() => {
        bootstrap.Modal.getInstance(document.getElementById('verifyModal')).hide();
        focusParcelle(match.id);
      }, 1400);
    } else {
      result.style.display = 'block';
      result.innerHTML = `
        <div style="background:var(--fc-red-dim);border:1px solid rgba(255,59,92,.3);border-radius:8px;padding:12px;font-size:12px;color:var(--fc-red);">
          ✗ Aucun titre correspondant trouvé dans le registre.
        </div>`;
    }
  }

  async function fetchMapData() {
    try {
      const res = await fetch('https://foncierchain-web1.onrender.com/api/v1/map/');
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      
      PARCELLES = data.map(r => ({
        id: r.parcelId,
        district: r.address || 'Brazzaville',
        type: r.usage || 'Résidentiel',
        status: r.status === 'FINALIZED' ? 'confirmed' : (r.status === 'COMMUNITY_VALIDATED' ? 'pending' : 'litige'),
        area: r.surface + ' m²',
        owner: r.currentOwner || 'Inconnu',
        coordinates: r.coordinates,
        lat: r.coordinates && r.coordinates.length > 0 ? r.coordinates[0][0] : 0,
        lng: r.coordinates && r.coordinates.length > 0 ? r.coordinates[0][1] : 0,
        hash: r.hash
      }));

      addMarkers();
      updateMap();
    } catch (e) {
      console.error("Erreur chargement carte", e);
    }
  }

  // Initialisation
  fetchMapData();