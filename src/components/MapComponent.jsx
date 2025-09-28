import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { supabase } from '../lib/supabaseClient';

const chennaiPosition = [13.0827, 80.2707];

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

function MapComponent({ onMapClick, newSpotPosition }) {
  const [spots, setSpots] = useState([]);

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
      
      {/* Loop over the spots array and create a Marker for each one */}
      {spots.map(spot => (
        <Marker key={spot.id} position={[spot.lat, spot.lng]}>
          <Popup>
            <b>SSID:</b> {spot.ssid} <br />
            <b>Strength:</b> {spot.strength}/5 <br />
            <b>Notes:</b> {spot.notes}
          </Popup>
        </Marker>
      ))}

      {/* This marker will appear temporarily where the user clicks */}
      {newSpotPosition && <Marker position={newSpotPosition}></Marker>}

      {/* Include the event handler component */}
      <MapEvents onMapClick={onMapClick} />
    </MapContainer>
  );
}

export default MapComponent;
