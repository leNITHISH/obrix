import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../lib/supabaseClient';

const chennaiPosition = [13.0827, 80.2707];

// Frequency radius mapping
const freqRadius = {
  '2.4': 100,
  '5': 30,
  '6': 15
};

// Signal strength color mapping
const levelColor = {
  1: 'red',
  2: 'orange',
  3: 'yellow',
  4: 'green',
  5: 'blue'
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
function WiFiSpot({ spot, isClicked, onSpotClick }) {
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

  return (
    <MapContainer 
      center={chennaiPosition} 
      zoom={13} 
      style={{ height: '100vh', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Loop over the spots array and create WiFi spots */}
      {spots.map(spot => (
        <WiFiSpot
          key={spot.id}
          spot={spot}
          isClicked={clickedSpotId === spot.id}
          onSpotClick={setClickedSpotId}
        />
      ))}

      {/* This marker will appear temporarily where the user clicks */}
      {newSpotPosition && <Marker position={newSpotPosition}></Marker>}

      {/* Include the event handler component */}
      <MapEvents onMapClick={onMapClick} />
    </MapContainer>
  );
}

export default MapComponent;
