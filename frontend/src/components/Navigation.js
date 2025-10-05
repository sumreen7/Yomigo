import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Sparkles, Heart, Calendar, Shield, Menu, X, User, LogOut, BookOpen } from "lucide-react";
import { Button } from "./ui/button";

const Navigation = () => {
  const location = useLocation();
  const { user, logout, isAuthenticated, clearTripData } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Don't show navigation on homepage
  if (location.pathname === '/') {
    return null;
  }

  const handleNewTrip = () => {
    clearTripData(); // Clear previous trip data
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const navItems = [
    { path: '/vibe-match', icon: Heart, label: 'Find Vibe', color: 'text-purple-600', onClick: handleNewTrip },
    { path: '/plan-direct', icon: Calendar, label: 'Plan Trip', color: 'text-emerald-600', onClick: handleNewTrip },
    ...(isAuthenticated ? [
      { path: '/my-trips', icon: BookOpen, label: 'My Trips', color: 'text-blue-600' },
      { path: '/itinerary', icon: Calendar, label: 'Current Trip', color: 'text-emerald-600' },
    ] : []),
    { path: '/safety', icon: Shield, label: 'Safety Intel', color: 'text-blue-600' },
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Sparkles className="w-8 h-8 text-amber-500" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Yomigo
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={item.onClick}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-gray-100 text-gray-900 font-semibold' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? item.color : 'text-gray-500'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            
            {/* Auth Controls */}
            <div className="border-l border-gray-300 pl-4 ml-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-gray-700">
                    <User className="w-5 h-5" />
                    <span className="font-medium">{user?.name}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center space-x-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </Button>
                </div>
              ) : (
                <Link to="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <User className="w-4 h-4" />
                    <span>Login</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-gray-100 text-gray-900 font-semibold' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    onClick={item.onClick || (() => setMobileMenuOpen(false))}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? item.color : 'text-gray-500'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              
              {/* Mobile Auth Controls */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center space-x-2 px-4 py-2 text-gray-700">
                      <User className="w-5 h-5" />
                      <span className="font-medium">{user?.name}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg w-full"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-4 py-3 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <User className="w-5 h-5" />
                    <span>Login</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;