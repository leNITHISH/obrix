// src/App.jsx
import React, { useState } from 'react'; // <-- Import useState
import MapComponent from './components/MapComponent';
import Auth from './components/Auth';
import AddSpotForm from './components/AddSpotForm'; // <-- Import the new form component
import { useAuth } from './context/AuthContext';
import { Button } from '@/components/ui/button';

function App() {
  const { session } = useAuth();
  
  // State to manage the form dialog's visibility
  const [isAddSpotOpen, setIsAddSpotOpen] = useState(false);
  // State to store the coordinates of the user's click on the map
  const [newSpotPosition, setNewSpotPosition] = useState(null);

  // This function gets called by MapComponent when the user clicks the map
  const handleMapClick = (latlng) => {
    if (session) { // Only allow selecting a spot if logged in
        setNewSpotPosition(latlng);
    }
  };

  // This function opens the form, but only if a location has been selected first
  const openAddSpotForm = () => {
    if (!newSpotPosition) {
      alert("Please click on the map first to select a location for the new WiFi spot.");
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

      {/* Conditionally render the "Add Spot" button only if a user is logged in */}
      {session && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000]">
          {/* Add the onClick handler to the button */}
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


