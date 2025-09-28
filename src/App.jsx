// src/App.jsx
import React, { useState } from 'react';
import MapComponent from './components/MapComponent';
import Auth from './components/Auth';
import AddSpotForm from './components/AddSpotForm';
import { useAuth } from './context/AuthContext';
import { Button } from '@/components/ui/button';

function App() {
  const { session } = useAuth();
  
  // State to manage the form dialog's visibility
  const [isAddSpotOpen, setIsAddSpotOpen] = useState(false);
  // State to store the coordinates of the user's click on the map
  const [newSpotPosition, setNewSpotPosition] = useState(null);
  // State to manage geolocation loading
  const [gettingLocation, setGettingLocation] = useState(false);

  // This function gets called by MapComponent when the user clicks the map
  const handleMapClick = (latlng) => {
    if (session) { // Only allow selecting a spot if logged in
        setNewSpotPosition(latlng);
    }
  };

  // Function to get user's current location using GPS
  const getCurrentLocation = () => {
    if (!session) {
      alert("Please log in first to add WiFi spots.");
      return;
    }

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    setGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setNewSpotPosition({ lat: latitude, lng: longitude });
        setGettingLocation(false);
        // Automatically open the form after getting location
        setIsAddSpotOpen(true);
      },
      (error) => {
        setGettingLocation(false);
        let errorMessage = "Unable to get your location. ";
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Location access was denied. Please enable location permissions and try again.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out. Please try again.";
            break;
          default:
            errorMessage += "An unknown error occurred.";
            break;
        }
        
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // This function opens the form, but only if a location has been selected first
  const openAddSpotForm = () => {
    if (!newSpotPosition) {
      alert("Please click on the map or use 'Get Current Location' first to select a location for the new WiFi spot.");
      return;
    }
    setIsAddSpotOpen(true);
  };

  return (
    <div className="relative h-screen w-screen">
       {/* Pass the handler function and position state down to the map */}
       <MapComponent 
         onMapClick={handleMapClick} 
         newSpotPosition={newSpotPosition} 
       />

      {/* Position the Auth component on top of the map */}
      <div className="absolute top-4 right-4 z-[1000] p-2 bg-black bg-opacity-50 rounded-lg">
        <Auth />
      </div>

      {/* Get Current Location button in bottom left corner */}
      {session && (
        <div className="absolute bottom-10 left-4 z-[1000]">
          <Button 
            onClick={getCurrentLocation} 
            disabled={gettingLocation}
            variant="outline"
            className="bg-white/90 text-black hover:bg-white"
          >
            {gettingLocation ? 'Getting Location...' : 'Get Current Location'}
          </Button>
        </div>
      )}

      {/* Conditionally render the "Add Spot" button only if a user is logged in */}
      {session && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000]">
          <Button size="lg" onClick={openAddSpotForm}>
            Add New WiFi Spot
          </Button>
        </div>
      )}

      {/* Conditionally render the form dialog and pass it the required state */}
      <AddSpotForm 
        isOpen={isAddSpotOpen} 
        setIsOpen={setIsAddSpotOpen}
        position={newSpotPosition}
      />
    </div>
  );
}

export default App;


