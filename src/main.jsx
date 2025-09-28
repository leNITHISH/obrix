// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import 'leaflet/dist/leaflet.css'
import './index.css'
import { AuthProvider } from './context/AuthContext' // <-- Make sure this is imported

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider> {/* <-- This wrapper is essential */}
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
