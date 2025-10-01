// src/components/AddSpotForm.jsx
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

// This component takes props to control its state and get data from the parent
export default function AddSpotForm({ isOpen, setIsOpen, position }) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [ssid, setSsid] = useState('');
  const [notes, setNotes] = useState('');
  const [strength, setStrength] = useState([3]); // Default strength is 3
  const [frequency, setFrequency] = useState(['2.4']); // Default frequency is 2.4

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!position || !session) {
      alert("No position selected or you are not logged in.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.from('wifi_spots').insert({
      lat: position.lat,
      lng: position.lng,
      ssid: ssid,
      strength: strength[0],
      freq: frequency[0],
      notes: notes,
      user_id: session.user.id, // Associate the spot with the logged-in user
    }).select();

    if (error) {
      alert(error.message);
    } else {
      alert('WiFi spot added successfully!');
      setIsOpen(false); // Close the dialog
      // In a real app, you'd refresh the map data here. For now, a page refresh will work.
      window.location.reload();
    }
    setLoading(false);
  };

  // Don't render anything if the dialog isn't supposed to be open
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add a New WiFi Spot</DialogTitle>
          <DialogDescription>
            Fill in the details for the new hotspot. The location is based on where you last clicked on the map.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ssid" className="text-right">SSID</Label>
              <Input id="ssid" value={ssid} onChange={(e) => setSsid(e.target.value.trim())} className="col-span-3" placeholder="e.g., CafeCoffeeDay_Free" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">Notes</Label>
              <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-3" placeholder="Optional: e.g., Fast, near window" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Strength</Label>
              {/* Slider will automatically inherit the --primary color for its track */}
              <div className="col-span-3 flex items-center gap-4">
                <Slider
                  id="strength"
                  min={1}
                  max={5}
                  step={1}
                  value={strength}
                  onValueChange={setStrength}
                />
                <span className="font-bold text-lg">{strength[0]}</span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Frequency</Label>
              {/* Slider will automatically inherit the --primary color for its track */}
              <div className="col-span-3 flex items-center gap-4">
                <Slider
                  id="frequency"
                  min={0}
                  max={2}
                  step={1}
                  value={frequency.map(f => f === '2.4' ? 0 : f === '5' ? 1 : 2)}
                  onValueChange={(value) => {
                    const freqMap = ['2.4', '5', '6'];
                    setFrequency([freqMap[value[0]]]);
                  }}
                />
                <span className="font-bold text-lg">{frequency[0]} GHz</span>
              </div>
            </div>
             {position && (
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Location</Label>
                  <p className="col-span-3 text-sm text-muted-foreground">
                      Lat: {position.lat.toFixed(4)}, Lng: {position.lng.toFixed(4)}
                  </p>
              </div>
            )}
          </div>
          <DialogFooter>
            {/* THEMED: Button uses default style, inheriting --primary color */}
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Spot'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}