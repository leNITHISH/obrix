import React, { useState, useEffect } from 'react';
// 1. UPDATED IMPORTS: Replace ContextMenu with DropdownMenu
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu'; 
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../lib/supabaseClient';
import { GearIcon } from '@radix-ui/react-icons'; 


const chennaiPosition = [13.0827, 80.2707];

// Frequency radius mapping
const freqRadius = {
  '2.4': 100,
  '5': 30,
  '6': 15
};

// Default signal strength color mapping
const defaultLevelColor = {
  1: '#F2C447',
  2: '#F76280',
  3: '#FF1D68',
  4: '#B10065',
  5: '#740580'
};

// Basemap providers that require no API key
const BASEMAPS = {
  osm: {
    name: 'OSM Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  cartoLight: {
    name: 'CARTO Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; OpenStreetMap &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  cartoDark: {
    name: 'CARTO Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; OpenStreetMap &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  esriSat: {
    name: 'Esri Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  }
};

// A new component to handle map events
function MapEvents({ onMapClick }) {
  useMapEvents({
    click(e) {
      // This function is called from the parent (App.jsx)
      onMapClick(e.latlng);
    },
  });

  return null; // This component doesn't render anything itself
}

// Component to render individual WiFi spots with both circle and pin
function WiFiSpot({ spot, isClicked, onSpotClick, levelColor }) {
  const color = levelColor[spot.strength] || 'gray';
  const opacity = isClicked ? 0.8 : 0.3;
  const radius = freqRadius[spot.freq] || 50;
  
  // Create custom colored icon
  const customIcon = new L.DivIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
  
  // Always show both circle and pin marker
  return (
    <>
      {/* Circle showing coverage area */}
      <Circle
        center={[spot.lat, spot.lng]}
        radius={radius}
        pathOptions={{
          color: color,
          fillColor: color,
          fillOpacity: opacity,
          weight: 2,
          opacity: opacity
        }}
        eventHandlers={{
          click: () => onSpotClick(spot.id)
        }}
      />
      
      {/* Custom colored pin marker at the center */}
      <Marker 
        position={[spot.lat, spot.lng]}
        icon={customIcon}
        eventHandlers={{ click: () => onSpotClick(spot.id) }}
      >
        <Popup>
          <div>
            <b>SSID:</b> {spot.ssid} <br />
            <b>Strength:</b> {spot.strength}/5 <br />
            <b>Frequency:</b> {spot.freq} GHz <br />
            <b>Notes:</b> {spot.notes || 'No notes'}
          </div>
        </Popup>
      </Marker>
    </>
  );
}

function MapComponent({ onMapClick, newSpotPosition }) {
  const [spots, setSpots] = useState([]);
  const [clickedSpotId, setClickedSpotId] = useState(null);
  const [basemap, setBasemap] = useState('osm');
  const [basemapOverridden, setBasemapOverridden] = useState(false);
  const [useCustomColors, setUseCustomColors] = useState(false);
  const [levelColor, setLevelColor] = useState({ ...defaultLevelColor });
  // 2. STATE REMOVAL: Removed showMenu state
  const [basemapCollapseOpen, setBasemapCollapseOpen] = useState(true);
  const [colorsCollapseOpen, setColorsCollapseOpen] = useState(true);
  const BRAND_GREEN = '#63ff0f';
  const MENU_BG = '#3a3b39';
  const [isMobile, setIsMobile] = useState(false);

  // Color profiles
  const presetProfiles = [
    {
      id: 'vibrant',
      name: 'Vibrant',
      colors: {   5: '#0ce71f',
        4: '#0DE32A',
        3: '#17BB7C',
        2: '#1E8A96',
        1: '#214475' }
    },
    {
      id: 'soft',
      name: 'Soft',
      colors: { 1: '#F4D88A', 2: '#F6A6A6', 3: '#F59EAD', 4: '#C78AB3', 5: '#9C7AC1' }
    },
    {
      id: 'contrast',
      name: 'High Contrast',
      colors: { 1: '#00E6A8', 2: '#00B3FF', 3: '#FFB800', 4: '#FF4D4D', 5: '#8A2BE2' }
    },
    {
      id: 'mono',
      name: 'Monochrome',
      colors: { 1: '#9cd67d', 2: '#7ec35a', 3: '#60b137', 4: '#3f8f17', 5: '#2c6d0f' }
    }
  ];
  const [selectedProfileId, setSelectedProfileId] = useState('vibrant');
  const [customProfile, setCustomProfile] = useState({ ...defaultLevelColor });

  useEffect(() => {
    // This function fetches the data from Supabase
    async function getSpots() {
      const { data, error } = await supabase.from('wifi_spots').select('*');
      if (error) {
        console.error("Error fetching data: ", error);
      } else {
        setSpots(data); // Set the fetched data into our state
      }
    }

    getSpots();
  }, []); // The empty array means this effect runs once when the component mounts

  // Style Leaflet zoom controls
  useEffect(() => {
    const styleZoom = () => {
      document.querySelectorAll('.leaflet-control-zoom a').forEach((el) => {
        el.style.background = BRAND_GREEN;
        el.style.color = '#000';
        el.style.border = '1px solid #000';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.fontWeight = '700';
        el.style.fontSize = '18px';
        el.style.lineHeight = '1';
        el.style.padding = '0';
      });
    };
    styleZoom();
    const observer = new MutationObserver(styleZoom);
    const mapEl = document.querySelector('.leaflet-container');
    if (mapEl) observer.observe(mapEl, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  // Track mobile to adjust cogwheel vertical alignment with other buttons
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Initialize basemap from system theme if not overridden
  useEffect(() => {
    if (basemapOverridden) return;
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setBasemap(prefersDark ? 'cartoDark' : 'cartoLight');
    }
  }, [basemapOverridden]);

  // Apply profile to level colors
  useEffect(() => {
    if (selectedProfileId === 'custom') {
      setLevelColor({ ...customProfile });
    } else {
      const found = presetProfiles.find((p) => p.id === selectedProfileId);
      if (found) setLevelColor({ ...found.colors });
    }
  }, [selectedProfileId, customProfile]);

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <MapContainer 
        center={chennaiPosition} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution={BASEMAPS[basemap].attribution}
          url={BASEMAPS[basemap].url}
        />
      
        {/* Loop over the spots array and create WiFi spots */}
        {spots.map(spot => (
          <WiFiSpot
            key={spot.id}
            spot={spot}
            isClicked={clickedSpotId === spot.id}
            onSpotClick={setClickedSpotId}
            levelColor={levelColor}
          />
        ))}

        {/* This marker will appear temporarily where the user clicks */}
        {newSpotPosition && (
          <Marker 
            position={newSpotPosition}
            icon={new L.DivIcon({
              className: 'custom-marker',
              html: `<div style="
                background-color: ${BRAND_GREEN};
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              "></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })}
          />
        )}

        {/* Include the event handler component */}
        <MapEvents onMapClick={onMapClick} />
      </MapContainer>

      {/* 3. JSX Replacement: Use DropdownMenu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            style={{
              position: 'absolute',
              bottom: isMobile ? 64 : 40,
              right: 16,
              width: 44,
              height: 44,
              borderRadius: 22,
              background: '#000',
              color: '#000',
              border: '1px solid #000',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1100
            }}
            aria-label="Map settings"
          >
            {/* monochrome cog */}
            <GearIcon 
              width="24" 
              height="24" 
              style={{ color: '#fff' }} 
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="border-white/20" style={{ background: '#000000', color: BRAND_GREEN, minWidth: '200px',  zIndex: 1150 }}>
          <div style={{ padding: 6, fontWeight: 700 }}>Map Settings</div>
          <DropdownMenuSeparator className="bg-white/20" />
          <div style={{ padding: 6 }}>
            <Collapsible open={basemapCollapseOpen} onOpenChange={setBasemapCollapseOpen}>
              <CollapsibleTrigger style={{ width: '100%', textAlign: 'left' }}>Map Style {basemapCollapseOpen ? '▾' : '▸'}</CollapsibleTrigger>
              <CollapsibleContent>
                <div style={{ paddingLeft: 6, display: 'grid', gap: 6, marginTop: 6 }}>
                  {Object.entries(BASEMAPS).map(([key, val]) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <input
                        type="radio"
                        name="basemap"
                        checked={basemap === key}
                        onChange={() => { setBasemap(key); setBasemapOverridden(true); }}
                      />
                      <span>{val.name}</span>
                    </label>
                  ))}
                  {!basemapOverridden && (
                    <div style={{ fontSize: 12, opacity: 0.9 }}>
                      Using system default (<span style={{ fontStyle: 'italic' }}>auto</span>). Select to override.
                    </div>
                  )}
                  {basemapOverridden && (
                    <button
                      onClick={() => setBasemapOverridden(false)}
                      style={{
                        background: BRAND_GREEN,
                        color: '#000',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 10px',
                        cursor: 'pointer',
                        marginTop: 4,
                        justifySelf: 'start'
                      }}
                    >Use system default</button>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
          <DropdownMenuSeparator className="bg-white/20" />
          <div style={{ padding: 6 }}>
            <Collapsible open={colorsCollapseOpen} onOpenChange={setColorsCollapseOpen}>
              <CollapsibleTrigger style={{ width: '100%', textAlign: 'left' }}>Color Profile {colorsCollapseOpen ? '▾' : '▸'}</CollapsibleTrigger>
              <CollapsibleContent>
                <div style={{ paddingLeft: 6, display: 'grid', gap: 8, marginTop: 6 }}>
                  {[...presetProfiles, { id: 'custom', name: 'Custom', colors: customProfile }].map((profile) => (
                    <label key={profile.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <input
                        type="radio"
                        name="colorProfile"
                        checked={selectedProfileId === profile.id}
                        onChange={() => setSelectedProfileId(profile.id)}
                      />
                      <span style={{ flex: 1 }}>{profile.name}</span>
                      <span style={{ display: 'flex', gap: 4 }}>
                        {[1,2,3,4,5].map((lvl) => (
                          <span key={lvl} style={{ width: 12, height: 12, borderRadius: 2, background: profile.colors[lvl], display: 'inline-block' }} />
                        ))}
                      </span>
                    </label>
                  ))}
                  {selectedProfileId === 'custom' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', rowGap: 6, columnGap: 8, paddingTop: 4 }}>
                      {[1,2,3,4,5].map((level) => (
                        <React.Fragment key={level}>
                          <span style={{ fontSize: 12, lineHeight: '28px' }}>Strength {level}</span>
                          <input
                            type="color"
                            value={customProfile[level]}
                            onChange={(e) => setCustomProfile((prev) => ({ ...prev, [level]: e.target.value }))}
                            style={{ width: '100%', height: 28, padding: 0, border: '1px solid #2a2a28', borderRadius: 6, background: '#2a2a28' }}
                          />
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default MapComponent;