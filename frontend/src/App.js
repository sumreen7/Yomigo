import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Navigation from "./components/Navigation";
import HomePage from "./pages/HomePage";
import VibeMatchPage from "./pages/VibeMatchPage";
import DestinationSelectionPage from "./pages/DestinationSelectionPage";
import ItineraryPage from "./pages/ItineraryPage";
import SafetyPage from "./pages/SafetyPage";
import { Toaster } from "sonner";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Navigation />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/vibe-match" element={<VibeMatchPage />} />
          <Route path="/destinations" element={<DestinationSelectionPage />} />
          <Route path="/itinerary" element={<ItineraryPage />} />
          <Route path="/safety" element={<SafetyPage />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;