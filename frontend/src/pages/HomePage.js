import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Compass, Calendar, Shield } from "lucide-react";
import { Button } from "../components/ui/button";

const HomePage = () => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const heroImages = [
    "https://images.unsplash.com/photo-1718302661620-0404ab653acb",
    "https://images.unsplash.com/photo-1554366347-897a5113f6ab", 
    "https://images.unsplash.com/photo-1594661745200-810105bcf054",
    "https://images.unsplash.com/photo-1551279076-6887dee32c7e"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image Carousel */}
      <div className="absolute inset-0 z-0">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url(${image})` }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-transparent" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 text-center text-white px-8 max-w-5xl">
        <div className="mb-8">
          <Sparkles className="w-20 h-20 mx-auto mb-6 text-amber-400" />
        </div>
        
        <h1 className="text-7xl font-bold mb-8 bg-gradient-to-r from-white via-amber-100 to-amber-200 bg-clip-text text-transparent">
          WanderWise AI
        </h1>
        
        <p className="text-3xl mb-12 text-slate-200 font-light leading-relaxed">
          Discover your perfect journey with AI-powered travel intelligence
        </p>
        
        <div className="flex flex-wrap justify-center gap-8 text-xl text-slate-300 mb-12">
          <div className="flex items-center gap-3">
            <Compass className="w-6 h-6 text-amber-400" />
            <span>Vibe-Based Matching</span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-amber-400" />
            <span>Smart Itineraries</span>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-amber-400" />
            <span>Safety Intelligence</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Button 
            onClick={() => navigate('/vibe-match')}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Start Your Journey
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => navigate('/safety')}
            size="lg"
            className="bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/30 font-semibold px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Shield className="w-5 h-5 mr-2" />
            Safety First
          </Button>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <Heart className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Find Your Vibe</h3>
            <p className="text-slate-300">Describe your perfect trip and let AI match you with destinations that fit your mood</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <Calendar className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Smart Planning</h3>
            <p className="text-slate-300">Get personalized itineraries with activities, costs, and local insights tailored to you</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <Shield className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Safety First</h3>
            <p className="text-slate-300">AI-powered safety analysis and real-time insights to keep your adventures secure</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;