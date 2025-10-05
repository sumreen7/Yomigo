import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState(localStorage.getItem('yomigo_session'));

  useEffect(() => {
    if (sessionToken) {
      verifySession();
    } else {
      setLoading(false);
    }
  }, []);

  const verifySession = async () => {
    try {
      const params = new URLSearchParams();
      params.append('session_token', sessionToken);
      
      const response = await axios.post(`${API}/auth/verify?${params.toString()}`);
      if (response.data.success) {
        setUser(response.data.user);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Session verification failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const params = new URLSearchParams();
      params.append('email', email);
      params.append('password', password);
      
      const response = await axios.post(`${API}/auth/login?${params.toString()}`);
      
      if (response.data.success) {
        setUser(response.data.user);
        setSessionToken(response.data.session_token);
        localStorage.setItem('yomigo_session', response.data.session_token);
        return { success: true };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const register = async (email, password, name) => {
    try {
      const params = new URLSearchParams();
      params.append('email', email);
      params.append('password', password);
      params.append('name', name);
      
      const response = await axios.post(`${API}/auth/register?${params.toString()}`);
      
      if (response.data.success) {
        setUser(response.data.user);
        setSessionToken(response.data.session_token);
        localStorage.setItem('yomigo_session', response.data.session_token);
        return { success: true };
      }
    } catch (error) {
      console.error('Registration failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    setSessionToken(null);
    localStorage.removeItem('yomigo_session');
    // Clear all trip-related data
    localStorage.removeItem('generatedItinerary');
    localStorage.removeItem('vibeMatchData');
  };

  const clearTripData = () => {
    // Clear all trip-related localStorage data for fresh start
    localStorage.removeItem('generatedItinerary');
    localStorage.removeItem('vibeMatchData');
  };

  const saveItinerary = async (title, destination, itineraryData, travelDates, preferences) => {
    if (!sessionToken) {
      throw new Error('Must be logged in to save itinerary');
    }

    try {
      const params = new URLSearchParams();
      params.append('session_token', sessionToken);
      params.append('title', title);
      params.append('destination', JSON.stringify(destination));
      params.append('itinerary_data', JSON.stringify(itineraryData));
      params.append('travel_dates', JSON.stringify(travelDates));
      params.append('preferences', JSON.stringify(preferences));
      
      const response = await axios.post(`${API}/itineraries/save?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Save itinerary failed:', error);
      throw error;
    }
  };

  const getSavedItineraries = async () => {
    if (!sessionToken) {
      throw new Error('Must be logged in to get saved itineraries');
    }

    try {
      const params = new URLSearchParams();
      params.append('session_token', sessionToken);
      
      const response = await axios.get(`${API}/itineraries/my?${params.toString()}`);
      return response.data.itineraries;
    } catch (error) {
      console.error('Get saved itineraries failed:', error);
      throw error;
    }
  };

  const deleteItinerary = async (itineraryId) => {
    if (!sessionToken) {
      throw new Error('Must be logged in to delete itinerary');
    }

    try {
      const params = new URLSearchParams();
      params.append('session_token', sessionToken);
      
      const response = await axios.delete(`${API}/itineraries/${itineraryId}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Delete itinerary failed:', error);
      throw error;
    }
  };

  const getUserPreferences = async () => {
    if (!sessionToken) {
      throw new Error('Must be logged in to get preferences');
    }

    try {
      const params = new URLSearchParams();
      params.append('session_token', sessionToken);
      
      const response = await axios.get(`${API}/user/preferences?${params.toString()}`);
      return response.data.preferences;
    } catch (error) {
      console.error('Get preferences failed:', error);
      throw error;
    }
  };

  const updateUserPreferences = async (preferences) => {
    if (!sessionToken) {
      throw new Error('Must be logged in to update preferences');
    }

    try {
      const params = new URLSearchParams();
      params.append('session_token', sessionToken);
      
      // Add preference fields to params
      if (preferences.preferred_currency) {
        params.append('preferred_currency', preferences.preferred_currency);
      }
      if (preferences.travel_style) {
        params.append('travel_style', preferences.travel_style);
      }
      if (preferences.budget_preference) {
        params.append('budget_preference', preferences.budget_preference);
      }
      
      const response = await axios.post(`${API}/user/preferences?${params.toString()}`);
      
      // Update local user state
      if (response.data.success) {
        setUser(prevUser => ({
          ...prevUser,
          preferences: {
            ...prevUser.preferences,
            ...preferences
          }
        }));
      }
      
      return response.data;
    } catch (error) {
      console.error('Update preferences failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    clearTripData,
    saveItinerary,
    getSavedItineraries,
    deleteItinerary,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;