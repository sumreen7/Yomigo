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
  const [seasonalActivities, setSeasonalActivities] = useState(null);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [durationRecommendation, setDurationRecommendation] = useState(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);

  const defaultActivityOptions = [
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

  // Fetch seasonal activities when travel month changes
  useEffect(() => {
    if (travelDates.travel_month && destinationData?.selectedDestination?.name) {
      getSeasonalActivities(travelDates.travel_month);
    }
  }, [travelDates.travel_month, destinationData?.selectedDestination?.name, travelStyle]);

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

  const getSeasonalActivities = async (month) => {
    if (!destinationData?.selectedDestination?.name || !month) return;
    
    setLoadingActivities(true);
    try {
      const params = new URLSearchParams();
      params.append('destination', destinationData.selectedDestination.name);
      params.append('travel_style', travelStyle);
      params.append('budget_range', destinationData.budget || 'mid-range');
      params.append('travel_month', month);
      params.append('duration', calculateDuration());
      
      const response = await axios.post(`${API}/activity-suggestions?${params.toString()}`);
      
      if (response.data.success) {
        setSeasonalActivities(response.data.activities);
        toast.success(`Found ${month} activities for ${destinationData.selectedDestination.name}!`);
      }
    } catch (error) {
      console.error("Failed to get seasonal activities:", error);
      toast.error("Failed to load seasonal activities");
    } finally {
      setLoadingActivities(false);
    }
  };

  const getDurationRecommendation = async () => {
    if (!destinationData?.selectedDestination?.name) return;
    
    setLoadingRecommendation(true);
    try {
      const params = new URLSearchParams();
      params.append('destination', destinationData.selectedDestination.name);
      params.append('destination_type', destinationData.destinationType || 'city');
      params.append('travel_style', travelStyle);
      params.append('activities', selectedActivities.join(', '));
      
      const response = await axios.get(`${API}/duration-recommendation?${params.toString()}`);
      
      if (response.data.success) {
        setDurationRecommendation(response.data.recommendation);
      }
    } catch (error) {
      console.error('Failed to get duration recommendation:', error);
    } finally {
      setLoadingRecommendation(false);
    }
  };

  // Get duration recommendation when destination loads or activities change
  useEffect(() => {
    if (destinationData?.selectedDestination) {
      getDurationRecommendation();
    }
  }, [destinationData, selectedActivities, travelStyle]);

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
                  <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                      Perfect! Your {calculateDuration()}-day trip in {travelDates.travel_month}
                    </p>
                    
                    {/* Duration Recommendation */}
                    {durationRecommendation && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-2">💡 AI Duration Recommendation</h4>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="text-center">
                            <div className="text-sm text-blue-600">Minimum</div>
                            <div className="font-bold text-blue-800">{durationRecommendation.recommended_days?.minimum} days</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-emerald-600">Ideal</div>
                            <div className="font-bold text-emerald-800">{durationRecommendation.recommended_days?.ideal} days</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-amber-600">Maximum</div>
                            <div className="font-bold text-amber-800">{durationRecommendation.recommended_days?.maximum} days</div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-blue-700">{durationRecommendation.reasoning}</p>
                        
                        {durationRecommendation.tips && durationRecommendation.tips.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-blue-800 mb-1">Tips:</p>
                            <ul className="text-xs text-blue-700 space-y-1">
                              {durationRecommendation.tips.map((tip, index) => (
                                <li key={index}>• {tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Duration Warning */}
                        {durationRecommendation.recommended_days && (
                          <div className="mt-3">
                            {calculateDuration() < durationRecommendation.recommended_days.minimum && (
                              <div className="text-xs text-amber-700 bg-amber-100 p-2 rounded">
                                ⚠️ Your trip might be too short to fully enjoy {destinationData.selectedDestination.name}
                              </div>
                            )}
                            {calculateDuration() > durationRecommendation.recommended_days.maximum && (
                              <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
                                ℹ️ You'll have plenty of time to deeply explore {destinationData.selectedDestination.name}
                              </div>
                            )}
                            {calculateDuration() >= durationRecommendation.recommended_days.minimum && 
                             calculateDuration() <= durationRecommendation.recommended_days.ideal && (
                              <div className="text-xs text-green-700 bg-green-100 p-2 rounded">
                                ✅ Perfect duration for experiencing {destinationData.selectedDestination.name}!
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {loadingRecommendation && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center gap-2 text-gray-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Getting AI duration recommendation...
                        </div>
                      </div>
                    )}
                  </div>
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
                
                {/* Seasonal Activities Section */}
                {seasonalActivities && travelDates.travel_month && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-emerald-700 mb-3 flex items-center gap-2">
                      🌟 Perfect for {travelDates.travel_month}
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
                              variant={selectedActivities.includes(activity.name) ? "default" : "outline"}
                              className={`cursor-pointer px-3 py-2 text-sm transition-all border-emerald-300 ${
                                selectedActivities.includes(activity.name)
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
                          {seasonalActivities.year_round_activities.slice(0, 6).map((activity, index) => (
                            <Badge
                              key={`yearround-${index}`}
                              variant={selectedActivities.includes(activity.name) ? "default" : "outline"}
                              className={`cursor-pointer px-3 py-2 text-sm transition-all ${
                                selectedActivities.includes(activity.name)
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
                        variant={selectedActivities.includes(activity) ? "default" : "outline"}
                        className={`cursor-pointer px-4 py-2 text-base transition-all ${
                          selectedActivities.includes(activity) 
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
                  {selectedActivities.length} activities selected
                  {seasonalActivities && (
                    <span className="text-emerald-600 ml-2">
                      • {seasonalActivities.seasonal_activities?.length || 0} seasonal options available
                    </span>
                  )}
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