import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Loader2, MapPin, Calendar, Sparkles, Users, Clock, DollarSign, Info, Star } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PlanDirectPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    destination: "",
    destination_type: "",
    budget_range: "",
    travel_style: "",
    travelers: "1", // Fixed default to solo traveler
    vibe: "",
    travel_dates: {
      start_date: "",
      end_date: "",
      travel_month: ""
    },
    selected_activities: [],
    special_requirements: "",
    accommodation_preference: "",
    transport_preference: ""
  });
  const [durationRecommendation, setDurationRecommendation] = useState(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [seasonalActivities, setSeasonalActivities] = useState(null);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [destinationHighlights, setDestinationHighlights] = useState(null);
  const [loadingHighlights, setLoadingHighlights] = useState(false);

  const defaultActivityOptions = [
    "Sightseeing", "Food Tours", "Adventure Sports", "Museums", "Nightlife", 
    "Shopping", "Beaches", "Hiking", "Photography", "Local Culture",
    "Art Galleries", "Historical Sites", "Nature Parks", "Boat Tours", "Walking Tours"
  ];

  const calculateDuration = () => {
    if (formData.travel_dates.start_date && formData.travel_dates.end_date) {
      const start = new Date(formData.travel_dates.start_date);
      const end = new Date(formData.travel_dates.end_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return Math.max(1, Math.min(30, diffDays));
    }
    return 7;
  };

  const toggleActivity = (activity) => {
    setFormData(prev => ({
      ...prev,
      selected_activities: prev.selected_activities.includes(activity)
        ? prev.selected_activities.filter(a => a !== activity)
        : [...prev.selected_activities, activity]
    }));
  };

  // Simplified functions without useCallback to avoid dependency issues
  const getSeasonalActivities = async (destination, month) => {
    if (!destination || !month || !formData.travel_style) return;
    
    setLoadingActivities(true);
    try {
      const params = new URLSearchParams();
      params.append('destination', destination);
      params.append('travel_style', formData.travel_style);
      params.append('budget_range', formData.budget_range || 'mid-range');
      params.append('travel_month', month);
      params.append('duration', calculateDuration());
      
      const response = await axios.post(`${API}/activity-suggestions?${params.toString()}`);
      
      if (response.data.success) {
        setSeasonalActivities(response.data.activities);
        toast.success(`Found ${month} activities for ${destination}!`);
      }
    } catch (error) {
      console.error("Failed to get seasonal activities:", error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const getDurationRecommendation = async (destination) => {
    if (!destination || destination.length < 3) return;
    
    setLoadingRecommendation(true);
    try {
      const params = new URLSearchParams();
      params.append('destination', destination);
      params.append('travel_style', formData.travel_style || 'relaxed');
      params.append('traveler_count', formData.travelers);
      
      const response = await axios.post(`${API}/duration-recommendation?${params.toString()}`);
      
      if (response.data.success) {
        setDurationRecommendation(response.data.recommendation);
      }
    } catch (error) {
      console.error("Failed to get duration recommendation:", error);
    } finally {
      setLoadingRecommendation(false);
    }
  };

  const getDestinationHighlights = async (destination) => {
    if (!destination || destination.length < 3) return;
    
    setLoadingHighlights(true);
    try {
      const vibePrompt = `I want to visit ${destination}`;
      const preferences = {
        destination_type: formData.destination_type || 'city',
        budget_range: formData.budget_range || 'mid-range',
        travel_style: formData.travel_style || 'relaxed'
      };
      
      const params = new URLSearchParams();
      params.append('vibe', vibePrompt);
      params.append('preferences', JSON.stringify(preferences));
      
      const response = await axios.post(`${API}/vibe-match?${params.toString()}`);
      
      if (response.data.matched_destinations && response.data.matched_destinations.length > 0) {
        const matchedDest = response.data.matched_destinations.find(d => 
          d.name.toLowerCase().includes(destination.toLowerCase())
        ) || response.data.matched_destinations[0];
        
        setDestinationHighlights(matchedDest);
      }
    } catch (error) {
      console.error("Failed to get destination highlights:", error);
    } finally {
      setLoadingHighlights(false);
    }
  };

  // Manual trigger functions for seasonal activities and recommendations
  const handleDestinationChange = (newDestination) => {
    setFormData(prev => ({ ...prev, destination: newDestination }));
    
    // Clear previous data
    setSeasonalActivities(null);
    setDurationRecommendation(null);
    setDestinationHighlights(null);
    
    // Trigger recommendations after a delay
    if (newDestination.length >= 3) {
      setTimeout(() => {
        getDurationRecommendation(newDestination);
        getDestinationHighlights(newDestination);
      }, 1000);
    }
  };

  const handleDateChange = (field, value) => {
    const updatedDates = { ...formData.travel_dates, [field]: value };
    
    if (field === 'start_date' && value) {
      const month = new Date(value).toLocaleDateString('en-US', { month: 'long' });
      updatedDates.travel_month = month;
    }
    
    setFormData(prev => ({ ...prev, travel_dates: updatedDates }));
    
    // Trigger seasonal activities if we have all required data
    if (formData.destination && updatedDates.travel_month && formData.travel_style) {
      setTimeout(() => {
        getSeasonalActivities(formData.destination, updatedDates.travel_month);
      }, 500);
    }
  };

  const generateItinerary = async () => {
    // Validation
    if (!formData.destination.trim()) {
      toast.error("Please enter a destination!");
      return;
    }

    if (!formData.budget_range || !formData.travel_style) {
      toast.error("Please fill in budget range and travel style!");
      return;
    }

    if (!formData.travel_dates.start_date || !formData.travel_dates.end_date) {
      toast.error("Please select your travel dates!");
      return;
    }

    setLoading(true);
    try {
      const duration = calculateDuration();
      
      const preferences = {
        destination_type: formData.destination_type,
        budget_range: formData.budget_range,
        travel_style: formData.travel_style,
        duration: duration,
        activities: formData.selected_activities,
        vibe: `${formData.vibe} - specifically for ${formData.destination}`,
        accommodation_preference: formData.accommodation_preference,
        transport_preference: formData.transport_preference,
        special_requirements: formData.special_requirements,
        travel_month: formData.travel_dates.travel_month,
        travelers: formData.travelers
      };

      console.log("Creating direct itinerary with preferences:", preferences);

      const response = await axios.post(`${API}/smart-itinerary`, preferences, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000
      });

      if (response.data && response.data.itinerary) {
        // Store the complete itinerary data
        localStorage.setItem('generatedItinerary', JSON.stringify({
          destination: { name: formData.destination },
          itinerary: response.data.itinerary,
          travelDates: formData.travel_dates,
          preferences: preferences,
          travelers: formData.travelers,
          planType: 'direct'
        }));

        toast.success(`🎉 Your ${formData.destination} itinerary is ready!`);
        navigate('/itinerary');
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Itinerary generation error:", error);
      
      let errorMessage = "Failed to create itinerary. Please try again.";
      if (error.response?.status === 500) {
        errorMessage = "Server error. Our AI is having trouble - please try again in a moment.";
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = "Request timed out. Please try again.";
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Calendar className="w-12 h-12 text-emerald-500" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Plan Your Trip Directly
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Already know where you want to go? Create a personalized itinerary for your chosen destination
          </p>
        </div>

        {/* Planning Form */}
        <Card className="max-w-6xl mx-auto shadow-2xl border-0">
          <CardHeader className="bg-gradient-to-r from-emerald-50 via-blue-50 to-teal-50 border-b border-emerald-100">
            <CardTitle className="text-3xl text-center bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
              Create Your Perfect Itinerary
            </CardTitle>
            <CardDescription className="text-center text-lg text-gray-600">
              Tell us about your dream trip and we'll craft a personalized itinerary with AI-powered recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-10">
              
              {/* Destination & Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Destination *
                  </label>
                  <Input
                    placeholder="e.g., Paris France, Tokyo Japan, New York City, Bali Indonesia..."
                    value={formData.destination}
                    onChange={(e) => handleDestinationChange(e.target.value)}
                    className="text-base"
                  />
                  
                  {/* Loading States */}
                  {(loadingRecommendation || loadingHighlights) && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center text-gray-600 text-sm">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Getting destination information...
                      </div>
                    </div>
                  )}

                  {/* Destination Information Panel */}
                  {(durationRecommendation || destinationHighlights) && !loadingRecommendation && !loadingHighlights && (
                    <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg border border-blue-200">
                      <div className="grid md:grid-cols-2 gap-4">
                        
                        {/* Duration Recommendation */}
                        {durationRecommendation && (
                          <div>
                            <h4 className="font-medium text-blue-800 text-sm mb-2">
                              <Clock className="w-4 h-4 inline mr-1" />
                              Recommended Duration
                            </h4>
                            <p className="text-blue-700 text-sm font-medium">
                              {durationRecommendation.ideal_days || durationRecommendation.recommended_days?.ideal || '7'} days ideal
                            </p>
                            <p className="text-blue-600 text-xs mt-1">{durationRecommendation.reasoning}</p>
                          </div>
                        )}

                        {/* Destination Highlights */}
                        {destinationHighlights && (
                          <div>
                            <h4 className="font-medium text-emerald-800 text-sm mb-2">
                              <Star className="w-4 h-4 inline mr-1" />
                              Must-See Highlights
                            </h4>
                            {destinationHighlights.highlights && destinationHighlights.highlights.length > 0 ? (
                              <div className="space-y-1">
                                {destinationHighlights.highlights.slice(0, 3).map((highlight, index) => (
                                  <p key={index} className="text-emerald-700 text-xs">• {highlight}</p>
                                ))}
                              </div>
                            ) : (
                              <p className="text-emerald-700 text-xs">Rich cultural experiences and attractions await!</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Best Time to Visit */}
                      {destinationHighlights?.best_months && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <h4 className="font-medium text-purple-800 text-sm mb-1">
                            🌟 Best Months to Visit
                          </h4>
                          <p className="text-purple-700 text-xs">
                            {destinationHighlights.best_months.join(', ')} 
                            {destinationHighlights.avg_temp_range && ` • ${destinationHighlights.avg_temp_range}`}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Destination Type (Optional)
                  </label>
                  <Select 
                    value={formData.destination_type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, destination_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Auto-detect from destination" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">🤖 Auto-detect from destination</SelectItem>
                      <SelectItem value="beach">🏖️ Beach & Coastal</SelectItem>
                      <SelectItem value="mountain">🏔️ Mountain & Hills</SelectItem>
                      <SelectItem value="city">🏙️ City & Urban</SelectItem>
                      <SelectItem value="cultural">🏛️ Cultural & Historical</SelectItem>
                      <SelectItem value="adventure">🏃‍♂️ Adventure & Outdoors</SelectItem>
                      <SelectItem value="nature">🌳 Nature & Wildlife</SelectItem>
                      <SelectItem value="island">🏝️ Island Paradise</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">We'll automatically detect the type from your destination</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Travelers
                  </label>
                  <Select 
                    value={formData.travelers} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, travelers: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Solo Traveler</SelectItem>
                      <SelectItem value="2">Couple (2 people)</SelectItem>
                      <SelectItem value="3-4">Small Group (3-4 people)</SelectItem>
                      <SelectItem value="5+">Large Group (5+ people)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Budget and Style */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Budget Range *
                  </label>
                  <Select 
                    value={formData.budget_range} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, budget_range: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select budget" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">💰 Budget ($50-100/day)</SelectItem>
                      <SelectItem value="mid-range">💳 Mid-range ($100-250/day)</SelectItem>
                      <SelectItem value="luxury">💎 Luxury ($250+/day)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">Per person, including accommodation, food, and activities</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Travel Style *
                  </label>
                  <Select 
                    value={formData.travel_style} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, travel_style: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relaxed">🏖️ Relaxed & Leisurely</SelectItem>
                      <SelectItem value="adventure">🏃‍♂️ Adventure & Active</SelectItem>
                      <SelectItem value="cultural">🏛️ Cultural & Educational</SelectItem>
                      <SelectItem value="romantic">💕 Romantic & Intimate</SelectItem>
                      <SelectItem value="party">🎉 Social & Nightlife</SelectItem>
                      <SelectItem value="business">💼 Business & Work</SelectItem>
                      <SelectItem value="family">👨‍👩‍👧‍👦 Family Friendly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Preferences */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Accommodation Preference
                  </label>
                  <Select 
                    value={formData.accommodation_preference} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, accommodation_preference: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select accommodation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hotel">🏨 Hotels</SelectItem>
                      <SelectItem value="resort">🏝️ Resorts</SelectItem>
                      <SelectItem value="boutique">💎 Boutique Hotels</SelectItem>
                      <SelectItem value="airbnb">🏠 Airbnb/Apartments</SelectItem>
                      <SelectItem value="hostel">🎒 Hostels</SelectItem>
                      <SelectItem value="luxury">✨ Luxury Properties</SelectItem>
                      <SelectItem value="mixed">🔄 Mix of Options</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Transportation Preference
                  </label>
                  <Select 
                    value={formData.transport_preference} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, transport_preference: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select transport preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">🚇 Public Transport</SelectItem>
                      <SelectItem value="walking">🚶‍♂️ Walking & Local Transport</SelectItem>
                      <SelectItem value="taxi">🚗 Taxis & Rideshare</SelectItem>
                      <SelectItem value="rental">🚙 Car Rental</SelectItem>
                      <SelectItem value="tours">🚌 Guided Tours</SelectItem>
                      <SelectItem value="mixed">🔄 Combination</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Travel Dates */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  <Calendar className="w-5 h-5 inline mr-2" />
                  Travel Dates *
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <Input
                      type="date"
                      value={formData.travel_dates.start_date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => handleDateChange('start_date', e.target.value)}
                      className="text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <Input
                      type="date"
                      value={formData.travel_dates.end_date}
                      min={formData.travel_dates.start_date || new Date().toISOString().split('T')[0]}
                      onChange={(e) => handleDateChange('end_date', e.target.value)}
                      className="text-center"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="bg-emerald-50 p-4 rounded-lg w-full text-center">
                      <div className="text-2xl font-bold text-emerald-700">
                        {calculateDuration()}
                      </div>
                      <div className="text-sm text-emerald-600">
                        {calculateDuration() === 1 ? 'Day' : 'Days'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Duration Recommendations and Warnings */}
                {formData.travel_dates.start_date && formData.travel_dates.end_date && formData.travel_dates.travel_month && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 text-center mb-3">
                      Perfect! Your {calculateDuration()}-day trip to {formData.destination || 'your destination'} in {formData.travel_dates.travel_month}
                    </p>
                    
                    {/* Duration Warnings based on AI recommendation */}
                    {durationRecommendation && (
                      <div className="mt-3">
                        {calculateDuration() < (durationRecommendation.recommended_days?.minimum || durationRecommendation.minimum_days || 3) && (
                          <div className="text-xs text-amber-700 bg-amber-100 p-3 rounded-lg">
                            ⚠️ Your trip might be too short to fully enjoy {formData.destination}. Consider extending to at least {durationRecommendation.recommended_days?.minimum || durationRecommendation.minimum_days} days.
                          </div>
                        )}
                        {calculateDuration() > (durationRecommendation.recommended_days?.maximum || durationRecommendation.maximum_days || 21) && (
                          <div className="text-xs text-blue-700 bg-blue-100 p-3 rounded-lg">
                            ℹ️ You'll have plenty of time to deeply explore {formData.destination} and surrounding areas!
                          </div>
                        )}
                        {calculateDuration() >= (durationRecommendation.recommended_days?.minimum || durationRecommendation.minimum_days || 3) && 
                         calculateDuration() <= (durationRecommendation.recommended_days?.ideal || durationRecommendation.ideal_days || 7) && (
                          <div className="text-xs text-green-700 bg-green-100 p-3 rounded-lg">
                            ✅ Perfect duration for experiencing the best of {formData.destination}!
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Travel Vibe & Requirements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Star className="w-4 h-4 inline mr-1" />
                    Travel Vibe & Goals (Optional)
                  </label>
                  <Textarea
                    placeholder="Describe what you're looking for... e.g., relaxing and peaceful, adventurous and exciting, cultural immersion, food-focused journey, photography opportunities..."
                    value={formData.vibe}
                    onChange={(e) => setFormData(prev => ({ ...prev, vibe: e.target.value }))}
                    className="min-h-20 text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Info className="w-4 h-4 inline mr-1" />
                    Special Requirements (Optional)
                  </label>
                  <Textarea
                    placeholder="Any special needs or preferences... e.g., vegetarian restaurants, accessibility requirements, family-friendly activities, budget constraints, must-see places..."
                    value={formData.special_requirements}
                    onChange={(e) => setFormData(prev => ({ ...prev, special_requirements: e.target.value }))}
                    className="min-h-20 text-base"
                  />
                </div>
              </div>

              {/* Activity Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 Activities & Interests</h3>
                <p className="text-sm text-gray-600 mb-4">Select activities you'd like to include in your itinerary (optional)</p>
                
                {/* Seasonal Activities Section */}
                {seasonalActivities && formData.travel_dates.travel_month && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-emerald-700 mb-3 flex items-center gap-2">
                      🌟 Perfect for {formData.travel_dates.travel_month} in {formData.destination}
                      {loadingActivities && <Loader2 className="w-4 h-4 animate-spin" />}
                    </h4>
                    
                    {/* Special Seasonal Activities */}
                    {seasonalActivities.seasonal_activities && seasonalActivities.seasonal_activities.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-emerald-600 mb-2 font-medium">🎭 Seasonal Specials</p>
                        <div className="flex flex-wrap gap-2">
                          {seasonalActivities.seasonal_activities.map((activity, index) => (
                            <Badge
                              key={`seasonal-${index}`}
                              variant={formData.selected_activities.includes(activity.name) ? "default" : "outline"}
                              className={`cursor-pointer px-3 py-2 text-sm transition-all border-emerald-300 ${
                                formData.selected_activities.includes(activity.name)
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                  : 'hover:bg-emerald-50 text-emerald-700'
                              }`}
                              onClick={() => toggleActivity(activity.name)}
                              title={`${activity.description} - ${activity.cost} (${activity.why_this_month})`}
                            >
                              ✨ {activity.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Year-round Activities */}
                    {seasonalActivities.year_round_activities && seasonalActivities.year_round_activities.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2 font-medium">🏛️ Year-Round Favorites</p>
                        <div className="flex flex-wrap gap-2">
                          {seasonalActivities.year_round_activities.slice(0, 8).map((activity, index) => (
                            <Badge
                              key={`yearround-${index}`}
                              variant={formData.selected_activities.includes(activity.name) ? "default" : "outline"}
                              className={`cursor-pointer px-3 py-2 text-sm transition-all ${
                                formData.selected_activities.includes(activity.name)
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                  : 'hover:bg-blue-50 hover:border-blue-300'
                              }`}
                              onClick={() => toggleActivity(activity.name)}
                              title={`${activity.description} - ${activity.cost}`}
                            >
                              {activity.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Default Activity Options */}
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-3">🎯 General Activities</h4>
                  <div className="flex flex-wrap gap-3">
                    {defaultActivityOptions.map(activity => (
                      <Badge
                        key={activity}
                        variant={formData.selected_activities.includes(activity) ? "default" : "outline"}
                        className={`cursor-pointer px-4 py-2 text-base transition-all ${
                          formData.selected_activities.includes(activity) 
                            ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                            : 'hover:bg-gray-50 hover:border-gray-300'
                        }`}
                        onClick={() => toggleActivity(activity)}
                      >
                        {activity}
                      </Badge>
                    ))}
                  </div>
                </div>

                <p className="text-sm text-gray-500 mt-3">
                  {formData.selected_activities.length} activities selected
                  {seasonalActivities && (
                    <span className="text-emerald-600 ml-2">
                      • {seasonalActivities.seasonal_activities?.length || 0} seasonal options available
                    </span>
                  )}
                </p>
              </div>

              {/* Generate Button */}
              <div className="text-center">
                <Button 
                  onClick={generateItinerary}
                  disabled={loading}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-12 py-4 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                      Creating Your Perfect Itinerary...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6 mr-2" />
                      Generate My {formData.destination || 'Destination'} Itinerary
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlanDirectPage;