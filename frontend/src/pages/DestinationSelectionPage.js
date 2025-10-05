import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Loader2, MapPin, Calendar, Sparkles, ArrowLeft, Users } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DestinationSelectionPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [destinationData, setDestinationData] = useState(null);
  const [travelDates, setTravelDates] = useState({
    start_date: "",
    end_date: "",
    travel_month: ""
  });
  const [travelStyle, setTravelStyle] = useState("relaxed");
  const [travelers, setTravelers] = useState("2");
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [durationRecommendation, setDurationRecommendation] = useState(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);

  const activityOptions = [
    "Sightseeing", "Food Tours", "Adventure Sports", "Museums", "Nightlife", 
    "Shopping", "Beaches", "Hiking", "Photography", "Local Culture",
    "Art Galleries", "Historical Sites", "Nature Parks", "Boat Tours", "Walking Tours"
  ];

  useEffect(() => {
    // Load vibe match data
    const storedData = localStorage.getItem('vibeMatchData');
    if (storedData) {
      const parsed = JSON.parse(storedData);
      setDestinationData(parsed);
    } else {
      // If no data, redirect back to vibe match
      navigate('/vibe-match');
    }
  }, [navigate]);

  const calculateDuration = () => {
    if (travelDates.start_date && travelDates.end_date) {
      const start = new Date(travelDates.start_date);
      const end = new Date(travelDates.end_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return Math.max(1, Math.min(30, diffDays));
    }
    return 7;
  };

  const toggleActivity = (activity) => {
    setSelectedActivities(prev => 
      prev.includes(activity)
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };

  const generateItinerary = async () => {
    if (!travelDates.start_date || !travelDates.end_date) {
      toast.error("Please select your travel dates!");
      return;
    }

    if (calculateDuration() < 1) {
      toast.error("End date must be after start date!");
      return;
    }

    setLoading(true);
    try {
      const duration = calculateDuration();
      
      const preferences = {
        destination_type: destinationData.destinationType || "beach",
        budget_range: destinationData.budget || "mid-range",
        travel_style: travelStyle,
        duration: duration,
        activities: selectedActivities.length > 0 ? selectedActivities : ["sightseeing", "local culture", "food tours"],
        vibe: `${destinationData.vibeQuery} - specifically for ${destinationData.selectedDestination.name}, ${destinationData.selectedDestination.country}`
      };

      console.log("Creating itinerary with preferences:", preferences);

      const response = await axios.post(`${API}/smart-itinerary`, preferences, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000
      });

      if (response.data && response.data.itinerary) {
        // Store the complete itinerary data
        localStorage.setItem('generatedItinerary', JSON.stringify({
          destination: destinationData.selectedDestination,
          itinerary: response.data.itinerary,
          travelDates: travelDates,
          preferences: preferences,
          travelers: travelers
        }));

        toast.success(`🎉 Your ${destinationData.selectedDestination.name} itinerary is ready!`);
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

  if (!destinationData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
          <p>Loading destination data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Calendar className="w-12 h-12 text-emerald-500" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Plan Your Trip
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select your travel dates and preferences to create a personalized itinerary
          </p>
        </div>

        {/* Back Button */}
        <div className="max-w-4xl mx-auto mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/vibe-match')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Vibe Match
          </Button>
        </div>

        {/* Destination Overview */}
        <Card className="max-w-4xl mx-auto mb-8 shadow-xl border-2 border-emerald-200">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardTitle className="text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <MapPin className="w-8 h-8 text-emerald-600" />
                <span className="text-3xl">{destinationData.selectedDestination.name}</span>
              </div>
              <Badge className="text-lg px-4 py-1 bg-emerald-600">
                Perfect for: {destinationData.vibeQuery.slice(0, 50)}...
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <p className="text-gray-700 text-lg mb-4 leading-relaxed">
              {destinationData.selectedDestination.description}
            </p>
            
            <div className="bg-emerald-50 p-4 rounded-lg">
              <p className="text-emerald-800 font-semibold mb-2">Why This Matches Your Vibe:</p>
              <p className="text-emerald-700">{destinationData.selectedDestination.why_it_matches}</p>
            </div>
          </CardContent>
        </Card>

        {/* Travel Planning Form */}
        <Card className="max-w-4xl mx-auto shadow-xl">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50">
            <CardTitle className="text-2xl text-center">Travel Details & Preferences</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Travel Dates */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">📅 When are you traveling?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <Input
                      type="date"
                      value={travelDates.start_date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        const startDate = e.target.value;
                        const month = new Date(startDate).toLocaleDateString('en-US', { month: 'long' });
                        setTravelDates(prev => ({ 
                          ...prev, 
                          start_date: startDate,
                          travel_month: month
                        }));
                      }}
                      className="text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <Input
                      type="date"
                      value={travelDates.end_date}
                      min={travelDates.start_date || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setTravelDates(prev => ({ 
                        ...prev, 
                        end_date: e.target.value
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
                {travelDates.start_date && travelDates.end_date && (
                  <p className="text-sm text-gray-600 mt-3 text-center">
                    Perfect! Your {calculateDuration()}-day trip in {travelDates.travel_month}
                  </p>
                )}
              </div>

              {/* Travel Style */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 Travel Style</h3>
                <Select value={travelStyle} onValueChange={setTravelStyle}>
                  <SelectTrigger>
                    <SelectValue />
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

              {/* Number of Travelers */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">👥 Travelers</h3>
                <Select value={travelers} onValueChange={setTravelers}>
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

              {/* Activity Selection */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 Activities & Interests</h3>
                <p className="text-sm text-gray-600 mb-4">Select activities you'd like to include in your itinerary (optional)</p>
                <div className="flex flex-wrap gap-3">
                  {activityOptions.map(activity => (
                    <Badge
                      key={activity}
                      variant={selectedActivities.includes(activity) ? "default" : "outline"}
                      className={`cursor-pointer px-4 py-2 text-base transition-all ${
                        selectedActivities.includes(activity) 
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
                  {selectedActivities.length} activities selected
                </p>
              </div>

              {/* Generate Button */}
              <div className="md:col-span-2 mt-6">
                <Button 
                  onClick={generateItinerary}
                  disabled={loading || !travelDates.start_date || !travelDates.end_date}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-4 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                      Creating Your Perfect Itinerary...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6 mr-2" />
                      Generate My {destinationData.selectedDestination.name} Itinerary
                      {selectedActivities.length > 0 && ` (${selectedActivities.length} activities)`}
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

export default DestinationSelectionPage;