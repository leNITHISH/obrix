# Obrix - WiFi Spot Mapper

A collaborative WiFi hotspot mapping application built with React, Vite, and Supabase. Users can discover, add, and share WiFi spots with signal strength ratings and location data.

## Features

- **Interactive Map**: Built with React Leaflet, centered on Chennai
- **User Authentication**: Secure login/signup powered by Supabase Auth
- **Add WiFi Spots**: Click on map to add new hotspots with SSID, strength, and notes
- **Signal Rating**: Rate WiFi strength from 1-5 stars
- **Collaborative**: Share and discover WiFi spots from other users

## Tech Stack

- **Frontend**: React 19 + Vite
- **UI Components**: Radix UI + Tailwind CSS + shadcn/ui
- **Maps**: React Leaflet
- **Backend**: Supabase (Auth + Database)
- **Styling**: Tailwind CSS with custom design system

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project

### Environment Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Set up your Supabase database with a `wifi_spots` table:
   ```sql
   CREATE TABLE wifi_spots (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     lat DECIMAL(10, 8) NOT NULL,
     lng DECIMAL(11, 8) NOT NULL,
     ssid TEXT NOT NULL,
     strength INTEGER CHECK (strength >= 1 AND strength <= 5),
     notes TEXT,
     user_id UUID REFERENCES auth.users(id),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

### Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

### Building for Production

```bash
npm run build
```

## Usage

1. **Sign up/Login**: Create an account or sign in to start contributing
2. **Explore**: View existing WiFi spots on the map
3. **Add Spots**: Click anywhere on the map to select a location, then click "Add New WiFi Spot"
4. **Rate Quality**: Use the slider to rate signal strength (1-5)
5. **Share Details**: Add SSID name and optional notes about the hotspot

