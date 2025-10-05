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
    travelers: "2",
    vibe: "",
    travel_dates: {
      start_date: "",
      end_date: "",
      travel_month: ""
    },
    selected_activities: []
  });
  const [durationRecommendation, setDurationRecommendation] = useState(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);

  const activityOptions = [
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

  const generateItinerary = async () => {
    // Validation
    if (!formData.destination.trim()) {
      toast.error("Please enter a destination!");
      return;
    }

    if (!formData.destination_type || !formData.budget_range || !formData.travel_style) {
      toast.error("Please fill in all required fields!");
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
        vibe: `${formData.vibe} - specifically for ${formData.destination}`
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
        <Card className="max-w-6xl mx-auto shadow-xl">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardTitle className="text-3xl text-center">Create Your Perfect Itinerary</CardTitle>
            <CardDescription className="text-center text-lg">
              Fill in your travel details and preferences to get an AI-generated itinerary
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-8">
              
              {/* Destination & Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Destination *
                  </label>
                  <Input
                    placeholder="e.g., Paris France, Tokyo Japan, New York City..."
                    value={formData.destination}
                    onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                    className="text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Destination Type *
                  </label>
                  <Select 
                    value={formData.destination_type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, destination_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose destination type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beach">🏖️ Beach & Coastal</SelectItem>
                      <SelectItem value="mountain">🏔️ Mountain & Hills</SelectItem>
                      <SelectItem value="city">🏙️ City & Urban</SelectItem>
                      <SelectItem value="cultural">🏛️ Cultural & Historical</SelectItem>
                      <SelectItem value="adventure">🏃‍♂️ Adventure & Outdoors</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Budget and Style */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
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

              {/* Travel Dates */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">📅 Travel Dates *</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <Input
                      type="date"
                      value={formData.travel_dates.start_date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        const startDate = e.target.value;
                        const month = new Date(startDate).toLocaleDateString('en-US', { month: 'long' });
                        setFormData(prev => ({ 
                          ...prev, 
                          travel_dates: { 
                            ...prev.travel_dates, 
                            start_date: startDate,
                            travel_month: month
                          }
                        }));
                      }}
                      className="text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <Input
                      type="date"
                      value={formData.travel_dates.end_date}
                      min={formData.travel_dates.start_date || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        travel_dates: { 
                          ...prev.travel_dates, 
                          end_date: e.target.value
                        }
                      }))}
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
              </div>

              {/* Travel Vibe */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Travel Vibe (Optional)
                </label>
                <Textarea
                  placeholder="Describe what you're looking for... e.g., relaxing and peaceful, adventurous and exciting, cultural immersion..."
                  value={formData.vibe}
                  onChange={(e) => setFormData(prev => ({ ...prev, vibe: e.target.value }))}
                  className="min-h-20 text-base"
                />
              </div>

              {/* Activity Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 Activities You're Interested In</h3>
                <p className="text-sm text-gray-600 mb-4">Select activities you'd like to include in your itinerary (optional)</p>
                <div className="flex flex-wrap gap-3">
                  {activityOptions.map(activity => (
                    <Badge
                      key={activity}
                      variant={formData.selected_activities.includes(activity) ? "default" : "outline"}
                      className={`cursor-pointer px-4 py-2 text-base transition-all ${
                        formData.selected_activities.includes(activity) 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                          : 'hover:bg-emerald-50 hover:border-emerald-300'
                      }`}
                      onClick={() => toggleActivity(activity)}
                    >
                      {activity}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {formData.selected_activities.length} activities selected
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