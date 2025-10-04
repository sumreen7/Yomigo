import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

// Add axios defaults for better error handling
axios.defaults.timeout = 30000; // 30 seconds
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Axios error:', error);
    return Promise.reject(error);
  }
);
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Badge } from "./components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Loader2, MapPin, Clock, DollarSign, Heart, Star, Shield, Sparkles, Compass, Calendar, Route, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TravelHero = () => {
  const heroImages = [
    "https://images.unsplash.com/photo-1718302661620-0404ab653acb",
    "https://images.unsplash.com/photo-1554366347-897a5113f6ab", 
    "https://images.unsplash.com/photo-1594661745200-810105bcf054",
    "https://images.unsplash.com/photo-1551279076-6887dee32c7e"
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  return (
    <div className="relative h-screen flex items-center justify-center overflow-hidden">
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
      <div className="relative z-10 text-center text-white px-8 max-w-4xl">
        <div className="mb-6">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-amber-400" />
        </div>
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-white via-amber-100 to-amber-200 bg-clip-text text-transparent">
          WanderWise AI
        </h1>
        <p className="text-2xl mb-8 text-slate-200 font-light">
          Discover your perfect journey with AI-powered travel intelligence
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-lg text-slate-300">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-400" />
            <span>Vibe-Based Matching</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <span>Smart Itineraries</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <span>Safety Intelligence</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const VibeDestinationMatcher = () => {
  const [vibeQuery, setVibeQuery] = useState("");
  const [destinationType, setDestinationType] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [generatingItinerary, setGeneratingItinerary] = useState({});

  const handleVibeMatch = async () => {
    if (!vibeQuery.trim()) {
      toast.error("Please describe your travel vibe!");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('vibe_query', vibeQuery);
      if (destinationType) params.append('destination_type', destinationType);
      if (budget) params.append('budget', budget);

      const response = await axios.post(`${API}/vibe-match?${params.toString()}`);
      setResults(response.data.results);
      toast.success("Found perfect destinations for your vibe!");
    } catch (error) {
      console.error("Vibe matching error:", error);
      toast.error("Failed to match destinations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateItineraryForDestination = async (destination, index) => {
    setGeneratingItinerary(prev => ({ ...prev, [index]: true }));
    
    try {
      const preferences = {
        destination_type: destinationType || "beach",
        budget_range: budget || "mid-range", 
        travel_style: "relaxed",
        duration: 5,
        activities: ["sightseeing", "local culture", "food tours"],
        vibe: `${vibeQuery} - specifically for ${destination.name}, ${destination.country}`
      };

      console.log("Generating itinerary for:", destination.name);
      console.log("Preferences:", preferences);

      const response = await axios.post(`${API}/smart-itinerary`, preferences, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log("Itinerary response:", response.data);
      
      // Store the result in local storage so it can be accessed from other components
      localStorage.setItem('generatedItinerary', JSON.stringify({
        destination: destination.name,
        itinerary: response.data.itinerary,
        preferences: preferences
      }));
      
      // Show success message
      toast.success(`🎉 Perfect itinerary created for ${destination.name}! Switching to Smart Itinerary tab...`);
      
      // Add a small delay then switch to itinerary tab
      setTimeout(() => {
        // Trigger tab change - we need to pass this function from parent
        if (window.switchToItineraryTab) {
          window.switchToItineraryTab();
        }
      }, 1500);
      
    } catch (error) {
      console.error("Itinerary generation error:", error);
      console.error("Error details:", error.response?.data);
      toast.error(`❌ Failed to create itinerary for ${destination.name}. Please try again.`);
    } finally {
      setGeneratingItinerary(prev => ({ ...prev, [index]: false }));
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center bg-gradient-to-r from-purple-50 to-pink-50">
        <CardTitle className="text-3xl text-purple-800 flex items-center justify-center gap-2">
          <Heart className="w-8 h-8 text-pink-500" />
          Vibe-Based Destination Matching
        </CardTitle>
        <CardDescription className="text-lg text-purple-600">
          Tell us your travel mood and we'll find destinations that match your vibe perfectly
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Describe Your Travel Vibe
            </label>
            <Textarea
              placeholder="e.g., I want somewhere peaceful with golden sunsets, good food, and friendly locals where I can disconnect from technology..."
              value={vibeQuery}
              onChange={(e) => setVibeQuery(e.target.value)}
              className="min-h-24 text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Destination Type</label>
            <Select value={destinationType} onValueChange={setDestinationType}>
              <SelectTrigger>
                <SelectValue placeholder="Any type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beach">Beach</SelectItem>
                <SelectItem value="mountain">Mountain</SelectItem>
                <SelectItem value="city">City</SelectItem>
                <SelectItem value="cultural">Cultural</SelectItem>
                <SelectItem value="adventure">Adventure</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Budget Range</label>
            <Select value={budget} onValueChange={setBudget}>
              <SelectTrigger>
                <SelectValue placeholder="Any budget" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="budget">Budget</SelectItem>
                <SelectItem value="mid-range">Mid-range</SelectItem>
                <SelectItem value="luxury">Luxury</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button 
              onClick={handleVibeMatch} 
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Finding Your Vibe...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Find My Destinations
                </>
              )}
            </Button>
          </div>
        </div>

        {results && (
          <div className="mt-8 space-y-6">
            <div className="text-center">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Vibe Match Score: {Math.round(results.vibe_score * 100)}%
              </Badge>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Why These Match Your Vibe:</h4>
              <p className="text-blue-700">{results.reasoning}</p>
            </div>

            <div className="grid gap-6">
              {results.matched_destinations?.map((destination, index) => (
                <Card key={index} className="border-l-4 border-l-purple-500">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-purple-600" />
                          {destination.name}
                        </h3>
                        <p className="text-gray-600">{destination.country}</p>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">{destination.description}</p>
                    <div className="bg-purple-50 p-3 rounded mb-4">
                      <p className="text-purple-800 font-medium">Perfect Match Because:</p>
                      <p className="text-purple-700">{destination.why_it_matches}</p>
                    </div>
                    
                    {/* Generate Itinerary Button */}
                    <Button
                      onClick={() => generateItineraryForDestination(destination, index)}
                      disabled={generatingItinerary[index]}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-2"
                    >
                      {generatingItinerary[index] ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating Itinerary...
                        </>
                      ) : (
                        <>
                          <Route className="w-4 h-4 mr-2" />
                          Generate Itinerary for {destination.name}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const SmartItineraryBuilder = () => {
  const [step, setStep] = useState(1); // 1: Preferences, 2: Destinations, 3: Activities, 4: Itinerary
  const [preferences, setPreferences] = useState({
    destination_type: "",
    budget_range: "",
    travel_style: "",
    activities: [],
    vibe: "",
    travel_dates: {
      start_date: "",
      end_date: "",
      travel_month: ""
    }
  });

  // Calculate duration from travel dates
  const calculateDuration = () => {
    if (preferences.travel_dates.start_date && preferences.travel_dates.end_date) {
      const start = new Date(preferences.travel_dates.start_date);
      const end = new Date(preferences.travel_dates.end_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
      return Math.max(1, Math.min(30, diffDays)); // Between 1-30 days
    }
    return 7; // Default duration
  };
  const [loading, setLoading] = useState(false);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [activitySuggestions, setActivitySuggestions] = useState(null);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [itinerary, setItinerary] = useState(null);

  // Check for generated itinerary from vibe matcher
  useEffect(() => {
    const storedItinerary = localStorage.getItem('generatedItinerary');
    if (storedItinerary) {
      const parsed = JSON.parse(storedItinerary);
      setItinerary(parsed.itinerary);
      localStorage.removeItem('generatedItinerary'); // Clear after loading
    }
  }, []);

  const activityOptions = [
    "sightseeing", "food tours", "adventure sports", "museums", "nightlife", 
    "shopping", "beaches", "hiking", "photography", "local culture"
  ];

  const togglePreferenceActivity = (activity) => {
    setPreferences(prev => ({
      ...prev,
      activities: prev.activities.includes(activity)
        ? prev.activities.filter(a => a !== activity)
        : [...prev.activities, activity]
    }));
  };

  const getDestinationSuggestions = async () => {
    if (!preferences.destination_type || !preferences.budget_range || !preferences.travel_style) {
      toast.error("Please fill in the required fields!");
      return;
    }
    
    if (!preferences.travel_dates.start_date || !preferences.travel_dates.end_date) {
      toast.error("Please select your travel dates!");
      return;
    }

    const duration = calculateDuration();
    if (duration > 30) {
      toast.error("Maximum trip duration is 30 days. Please adjust your dates.");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('destination_type', preferences.destination_type);
      params.append('budget_range', preferences.budget_range);
      params.append('travel_style', preferences.travel_style);
      params.append('vibe', preferences.vibe);
      if (preferences.travel_dates.travel_month) {
        params.append('travel_month', preferences.travel_dates.travel_month);
      }

      const response = await axios.post(`${API}/destination-suggestions?${params.toString()}`);
      
      if (response.data && response.data.destinations) {
        setDestinationSuggestions(response.data.destinations);
        setStep(2);
        toast.success("Found perfect destinations for you!");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Destination suggestions error:", error);
      toast.error("Failed to get destination suggestions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectDestination = async (destination) => {
    setSelectedDestination(destination);
    setLoading(true);
    
    try {
      const params = new URLSearchParams();
      params.append('destination', destination.name);
      params.append('travel_style', preferences.travel_style);
      params.append('budget_range', preferences.budget_range);
      params.append('travel_month', preferences.travel_dates.travel_month || 'any');
      params.append('duration', preferences.duration || '7');

      const response = await axios.post(`${API}/activity-suggestions?${params.toString()}`);
      
      if (response.data && response.data.activities) {
        setActivitySuggestions(response.data.activities);
        setStep(3);
        toast.success(`Got activity suggestions for ${destination.name}!`);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Activity suggestions error:", error);
      toast.error("Failed to get activity suggestions. Proceeding without activities.");
      setStep(4);
      createFinalItinerary();
    } finally {
      setLoading(false);
    }
  };

  const toggleActivity = (activity) => {
    setSelectedActivities(prev => 
      prev.find(a => a.name === activity.name)
        ? prev.filter(a => a.name !== activity.name)
        : [...prev, activity]
    );
  };

  const createFinalItinerary = async () => {
    if (!selectedDestination) {
      toast.error("Please select a destination first!");
      return;
    }

    setLoading(true);
    try {
      console.log("Creating final itinerary for:", selectedDestination.name);
      console.log("Selected activities:", selectedActivities);
      console.log("Preferences:", preferences);
      
      // Calculate duration from dates
      const duration = calculateDuration();
      
      const requestData = {
        destination_type: preferences.destination_type,
        budget_range: preferences.budget_range,
        travel_style: preferences.travel_style,
        duration: duration,
        activities: selectedActivities.map(a => a.name),
        vibe: preferences.vibe || "relaxing and enjoyable"
      };
      
      console.log("Sending request data:", requestData);
      
      const response = await axios.post(`${API}/smart-itinerary`, requestData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      console.log("Itinerary response:", response.data);
      
      if (response.data && response.data.itinerary) {
        setItinerary(response.data.itinerary);
        setStep(4);
        toast.success(`🎉 Your ${selectedDestination.name} itinerary is ready!`);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Final itinerary creation error:", error);
      console.error("Error response:", error.response?.data);
      
      let errorMessage = "Failed to create itinerary. Please try again.";
      if (error.response?.status === 500) {
        errorMessage = "Server error. Our AI is having trouble - please try again in a moment.";
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = "Request timed out. Please try again.";
      } else if (error.response?.data?.detail) {
        errorMessage = `Error: ${error.response.data.detail}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetBuilder = () => {
    setStep(1);
    setDestinationSuggestions([]);
    setSelectedDestination(null);
    setActivitySuggestions(null);
    setSelectedActivities([]);
    setItinerary(null);
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="text-center bg-gradient-to-r from-emerald-50 to-teal-50">
        <CardTitle className="text-3xl text-emerald-800 flex items-center justify-center gap-2">
          <Calendar className="w-8 h-8 text-teal-500" />
          Smart Itinerary Builder
        </CardTitle>
        <CardDescription className="text-lg text-emerald-600">
          Get AI-powered personalized travel itineraries tailored to your preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Destination Type *</label>
            <Select value={preferences.destination_type} onValueChange={(value) => 
              setPreferences(prev => ({ ...prev, destination_type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Choose destination type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beach">Beach</SelectItem>
                <SelectItem value="mountain">Mountain</SelectItem>
                <SelectItem value="city">City</SelectItem>
                <SelectItem value="cultural">Cultural</SelectItem>
                <SelectItem value="adventure">Adventure</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Budget Range *</label>
            <Select value={preferences.budget_range} onValueChange={(value) => 
              setPreferences(prev => ({ ...prev, budget_range: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select budget" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="budget">Budget ($50-100/day)</SelectItem>
                <SelectItem value="mid-range">Mid-range ($100-250/day)</SelectItem>
                <SelectItem value="luxury">Luxury ($250+/day)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Travel Style *</label>
            <Select value={preferences.travel_style} onValueChange={(value) => 
              setPreferences(prev => ({ ...prev, travel_style: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relaxed">Relaxed</SelectItem>
                <SelectItem value="adventure">Adventure</SelectItem>
                <SelectItem value="cultural">Cultural</SelectItem>
                <SelectItem value="party">Party</SelectItem>
                <SelectItem value="romantic">Romantic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Travel Dates *</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                <Input
                  type="date"
                  value={preferences.travel_dates.start_date}
                  min={new Date().toISOString().split('T')[0]} // Can't select past dates
                  onChange={(e) => {
                    const startDate = e.target.value;
                    const month = new Date(startDate).toLocaleDateString('en-US', { month: 'long' });
                    setPreferences(prev => ({ 
                      ...prev, 
                      travel_dates: { 
                        ...prev.travel_dates, 
                        start_date: startDate,
                        travel_month: month
                      }
                    }));
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">End Date</label>
                <Input
                  type="date"
                  value={preferences.travel_dates.end_date}
                  min={preferences.travel_dates.start_date || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPreferences(prev => ({ 
                    ...prev, 
                    travel_dates: { 
                      ...prev.travel_dates, 
                      end_date: e.target.value
                    }
                  }))}
                />
              </div>
              <div className="flex items-end">
                <div className="bg-emerald-50 p-3 rounded-lg w-full">
                  <div className="text-center">
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
            {preferences.travel_dates.start_date && preferences.travel_dates.end_date && (
              <p className="text-sm text-gray-600 mt-2">
                Trip duration: {calculateDuration()} days ({preferences.travel_dates.travel_month})
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Travel Vibe</label>
            <Input
              placeholder="e.g., peaceful and spiritual, adventurous and exciting..."
              value={preferences.vibe}
              onChange={(e) => setPreferences(prev => ({ ...prev, vibe: e.target.value }))}
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Activities</label>
            <div className="flex flex-wrap gap-2">
              {activityOptions.map(activity => (
                <Badge
                  key={activity}
                  variant={preferences.activities.includes(activity) ? "default" : "outline"}
                  className={`cursor-pointer px-3 py-1 ${
                    preferences.activities.includes(activity) 
                      ? 'bg-emerald-600 hover:bg-emerald-700' 
                      : 'hover:bg-emerald-50'
                  }`}
                  onClick={() => togglePreferenceActivity(activity)}
                >
                  {activity}
                </Badge>
              ))}
            </div>
          </div>

          {step === 1 && (
            <div className="md:col-span-3">
              <Button 
                onClick={getDestinationSuggestions} 
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Finding Perfect Destinations...
                  </>
                ) : (
                  <>
                    <MapPin className="w-5 h-5 mr-2" />
                    Find Destinations
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Step 2: Destination Selection */}
        {step === 2 && destinationSuggestions.length > 0 && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-emerald-800">Choose Your Destination</h3>
              <Button variant="outline" onClick={() => setStep(1)}>
                ← Back to Preferences
              </Button>
            </div>
            
            <div className="grid gap-4">
              {destinationSuggestions.map((destination, index) => (
                <Card key={index} className="border-l-4 border-l-emerald-500 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => selectDestination(destination)}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-xl font-bold text-emerald-800 flex items-center gap-2">
                          <MapPin className="w-5 h-5" />
                          {destination.name}
                        </h4>
                        {destination.avg_temp && (
                          <Badge variant="secondary" className="mt-1">
                            {destination.avg_temp} • {destination.best_months?.join(', ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">{destination.description}</p>
                    
                    {destination.highlights && (
                      <div className="mb-3">
                        <p className="font-semibold text-gray-800 mb-2">Highlights:</p>
                        <div className="flex flex-wrap gap-2">
                          {destination.highlights.map((highlight, i) => (
                            <Badge key={i} variant="outline" className="text-emerald-700">
                              {highlight}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {destination.why_now && (
                      <div className="bg-emerald-50 p-3 rounded">
                        <p className="text-emerald-800 font-medium">Perfect for {preferences.travel_dates.travel_month}:</p>
                        <p className="text-emerald-700">{destination.why_now}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Activity Selection */}
        {step === 3 && activitySuggestions && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-emerald-800">Choose Activities for {selectedDestination?.name}</h3>
              <Button variant="outline" onClick={() => setStep(2)}>
                ← Back to Destinations
              </Button>
            </div>

            {activitySuggestions.seasonal_activities && activitySuggestions.seasonal_activities.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  🌟 Special for {preferences.travel_dates.travel_month}
                </h4>
                <div className="grid gap-3">
                  {activitySuggestions.seasonal_activities.map((activity, index) => (
                    <Card 
                      key={`seasonal-${index}`} 
                      className={`cursor-pointer transition-all ${
                        selectedActivities.find(a => a.name === activity.name) 
                          ? 'border-emerald-500 bg-emerald-50' 
                          : 'border-gray-200 hover:border-emerald-300'
                      }`}
                      onClick={() => toggleActivity(activity)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="font-bold text-emerald-800">{activity.name}</h5>
                            <p className="text-gray-700 mb-2">{activity.description}</p>
                            <div className="flex gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                {activity.cost}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {activity.duration}
                              </span>
                            </div>
                            {activity.why_this_month && (
                              <p className="text-emerald-700 text-sm mt-2 font-medium">
                                ✨ {activity.why_this_month}
                              </p>
                            )}
                          </div>
                          {selectedActivities.find(a => a.name === activity.name) && (
                            <div className="ml-4 text-emerald-600">
                              <Star className="w-6 h-6 fill-current" />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activitySuggestions.year_round_activities && activitySuggestions.year_round_activities.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">🏛️ Year-Round Activities</h4>
                <div className="grid gap-3">
                  {activitySuggestions.year_round_activities.map((activity, index) => (
                    <Card 
                      key={`year-round-${index}`}
                      className={`cursor-pointer transition-all ${
                        selectedActivities.find(a => a.name === activity.name)
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-300'
                      }`}
                      onClick={() => toggleActivity(activity)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="font-bold text-gray-800">{activity.name}</h5>
                            <p className="text-gray-700 mb-2">{activity.description}</p>
                            <div className="flex gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                {activity.cost}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {activity.duration}
                              </span>
                            </div>
                          </div>
                          {selectedActivities.find(a => a.name === activity.name) && (
                            <div className="ml-4 text-emerald-600">
                              <Star className="w-6 h-6 fill-current" />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button 
                onClick={createFinalItinerary}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Itinerary...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Create Itinerary ({selectedActivities.length} activities selected)
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Final Itinerary */}
        {step === 4 && itinerary && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-emerald-800">
                Your {selectedDestination?.name} Itinerary
              </h3>
              <Button variant="outline" onClick={resetBuilder}>
                ✨ Create New Itinerary
              </Button>
            </div>

            {/* Destination Info */}
            {itinerary.destination_info && (
              <Card className="border-l-4 border-l-emerald-500">
                <CardContent className="p-6">
                  <h4 className="text-xl font-bold text-emerald-800 mb-2">{itinerary.destination_info.name}</h4>
                  <p className="text-gray-700 mb-3">{itinerary.destination_info.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {itinerary.destination_info.best_time_to_visit && (
                      <div>
                        <span className="font-semibold text-gray-800">Best Time:</span>
                        <p className="text-gray-600">{itinerary.destination_info.best_time_to_visit}</p>
                      </div>
                    )}
                    {itinerary.destination_info.local_currency && (
                      <div>
                        <span className="font-semibold text-gray-800">Currency:</span>
                        <p className="text-gray-600">{itinerary.destination_info.local_currency}</p>
                      </div>
                    )}
                    {itinerary.destination_info.language && (
                      <div>
                        <span className="font-semibold text-gray-800">Language:</span>
                        <p className="text-gray-600">{itinerary.destination_info.language}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Daily Itinerary */}
            {itinerary.daily_itinerary && (
              <div>
                <h4 className="text-xl font-semibold mb-4 text-gray-800">📅 Daily Schedule</h4>
                <div className="space-y-4">
                  {Object.entries(itinerary.daily_itinerary).map(([day, dayActivities]) => (
                    <Card key={day} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-6">
                        <h5 className="font-bold text-lg text-blue-800 mb-4 capitalize">
                          {day.replace('_', ' ')}
                        </h5>
                        {typeof dayActivities === 'object' && dayActivities !== null ? (
                          <div className="space-y-4">
                            {Object.entries(dayActivities).map(([period, activity]) => (
                              <div key={period} className="flex gap-4">
                                <div className="flex-shrink-0 w-20">
                                  <Badge variant="outline" className="capitalize">
                                    {period}
                                  </Badge>
                                </div>
                                <div className="flex-1">
                                  {typeof activity === 'object' && activity !== null ? (
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-gray-800">{activity.activity}</span>
                                        {activity.time && (
                                          <Badge variant="secondary" className="text-xs">
                                            {activity.time}
                                          </Badge>
                                        )}
                                        {activity.cost && (
                                          <Badge variant="secondary" className="text-xs text-green-700">
                                            {activity.cost}
                                          </Badge>
                                        )}
                                      </div>
                                      {activity.description && (
                                        <p className="text-gray-600 text-sm">{activity.description}</p>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-700">{activity}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-700">{dayActivities}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Estimated Costs */}
            {itinerary.estimated_costs && (
              <div>
                <h4 className="text-xl font-semibold mb-4 text-gray-800">💰 Budget Breakdown</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(itinerary.estimated_costs).map(([category, cost]) => (
                    <Card key={category} className="border-l-4 border-l-yellow-500">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-yellow-600" />
                          <span className="font-semibold capitalize">{category.replace('_', ' ')}:</span>
                          <span className="text-yellow-700 font-bold">{cost}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Local Tips */}
            {itinerary.local_tips && itinerary.local_tips.length > 0 && (
              <Card className="border-l-4 border-l-amber-500">
                <CardHeader>
                  <CardTitle className="text-lg text-amber-800">💡 Local Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {itinerary.local_tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Star className="w-4 h-4 text-amber-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-700">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Packing Suggestions */}
            {itinerary.packing_suggestions && itinerary.packing_suggestions.length > 0 && (
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="text-lg text-purple-800">🎒 Packing Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {itinerary.packing_suggestions.map((item, index) => (
                      <Badge key={index} variant="outline" className="text-purple-700">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const SafetyIntelligence = () => {
  const [selectedTool, setSelectedTool] = useState("destination");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  // Destination Safety Check
  const [destinationQuery, setDestinationQuery] = useState("");

  // Review Analysis
  const [reviewText, setReviewText] = useState("");

  const checkDestinationSafety = async () => {
    if (!destinationQuery.trim()) {
      toast.error("Please enter a destination!");
      return;
    }

    setLoading(true);
    try {
      // Use the review analyzer with a prompt about destination safety
      const safetyPrompt = `Please provide a comprehensive safety assessment for travelers visiting ${destinationQuery}. Include information about general safety, crime rates, areas to avoid, transportation safety, health considerations, and any current travel advisories.`;
      
      const params = new URLSearchParams();
      params.append('review_text', safetyPrompt);
      
      const response = await axios.post(`${API}/analyze-review?${params.toString()}`);
      setResults({
        type: 'destination',
        destination: destinationQuery,
        analysis: response.data.analysis
      });
      toast.success(`Safety assessment completed for ${destinationQuery}!`);
    } catch (error) {
      console.error("Safety check error:", error);
      toast.error("Failed to check destination safety. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const analyzeReview = async () => {
    if (!reviewText.trim() || reviewText.trim().length < 10) {
      toast.error("Please enter a review with at least 10 characters!");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('review_text', reviewText);
      
      const response = await axios.post(`${API}/analyze-review?${params.toString()}`);
      setResults({
        type: 'review',
        analysis: response.data.analysis
      });
      toast.success("Review analysis completed!");
    } catch (error) {
      console.error("Review analysis error:", error);
      toast.error("Failed to analyze review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score) => {
    if (score >= 8) return <CheckCircle className="w-6 h-6 text-green-600" />;
    if (score >= 6) return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
    return <XCircle className="w-6 h-6 text-red-600" />;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="text-3xl text-blue-800 flex items-center justify-center gap-2">
          <Shield className="w-8 h-8 text-indigo-500" />
          Safety Intelligence Hub
        </CardTitle>
        <CardDescription className="text-lg text-blue-600">
          Get AI-powered safety insights for destinations and analyze travel reviews
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        
        {/* Tool Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card 
            className={`cursor-pointer border-2 transition-all ${selectedTool === 'destination' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
            onClick={() => setSelectedTool('destination')}
          >
            <CardContent className="p-4 text-center">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold text-blue-800">Destination Safety Check</h3>
              <p className="text-sm text-blue-600">Get safety assessment for any destination</p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer border-2 transition-all ${selectedTool === 'review' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
            onClick={() => setSelectedTool('review')}
          >
            <CardContent className="p-4 text-center">
              <Star className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
              <h3 className="font-semibold text-indigo-800">Review Analyzer</h3>
              <p className="text-sm text-indigo-600">Analyze safety & cleanliness from reviews</p>
            </CardContent>
          </Card>
        </div>

        {/* Destination Safety Check Tool */}
        {selectedTool === 'destination' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Destination to Check
              </label>
              <Input
                placeholder="e.g., Bangkok Thailand, Paris France, New York City..."
                value={destinationQuery}
                onChange={(e) => setDestinationQuery(e.target.value)}
                className="text-base"
              />
            </div>

            <Button 
              onClick={checkDestinationSafety} 
              disabled={loading || !destinationQuery.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Safety...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Check Destination Safety
                </>
              )}
            </Button>
          </div>
        )}

        {/* Review Analysis Tool */}
        {selectedTool === 'review' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Travel Review to Analyze
              </label>
              <Textarea
                placeholder="Paste a travel review here... (hotel, restaurant, destination experience, etc.)"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="min-h-32 text-base"
              />
              <p className="text-sm text-gray-500 mt-1">
                {reviewText.length} characters (minimum 10 required)
              </p>
            </div>

            <Button 
              onClick={analyzeReview} 
              disabled={loading || reviewText.trim().length < 10}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Review...
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 mr-2" />
                  Analyze Review Safety
                </>
              )}
            </Button>
          </div>
        )}

        {/* Results Display */}
        {results && (
          <div className="mt-8 space-y-6">
            <h3 className="text-2xl font-bold text-center text-blue-800">
              {results.type === 'destination' ? `Safety Assessment: ${results.destination}` : 'Review Analysis Results'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4 text-center">
                  <h4 className="font-semibold text-gray-800 mb-2">Overall Sentiment</h4>
                  <Badge className={`text-lg px-4 py-2 ${getSentimentColor(results.analysis.overall_sentiment)}`}>
                    {results.analysis.overall_sentiment?.toUpperCase()}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-2">
                    Confidence: {Math.round(results.analysis.sentiment_confidence * 100)}%
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4 text-center">
                  <h4 className="font-semibold text-gray-800 mb-2">Safety Score</h4>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {getScoreIcon(results.analysis.safety_score)}
                    <div className={`text-3xl font-bold ${getScoreColor(results.analysis.safety_score)}`}>
                      {results.analysis.safety_score}/10
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${results.analysis.safety_score * 10}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4 text-center">
                  <h4 className="font-semibold text-gray-800 mb-2">Cleanliness Score</h4>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {getScoreIcon(results.analysis.cleanliness_score)}
                    <div className={`text-3xl font-bold ${getScoreColor(results.analysis.cleanliness_score)}`}>
                      {results.analysis.cleanliness_score}/10
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${results.analysis.cleanliness_score * 10}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {results.analysis.key_insights && results.analysis.key_insights.length > 0 && (
              <Card className="border-l-4 border-l-amber-500">
                <CardHeader>
                  <CardTitle className="text-lg text-amber-800">🔍 Key Safety Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {results.analysis.key_insights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Shield className="w-4 h-4 text-amber-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-700">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {results.analysis.recommendation && (
              <Card className="border-l-4 border-l-indigo-500">
                <CardHeader>
                  <CardTitle className="text-lg text-indigo-800">💡 AI Recommendation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{results.analysis.recommendation}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState("hero");

  // Make tab switching available globally for itinerary generation
  useEffect(() => {
    window.switchToItineraryTab = () => {
      setActiveTab("itinerary");
    };
    
    return () => {
      delete window.switchToItineraryTab;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {activeTab === "hero" && <TravelHero />}
      
      {activeTab !== "hero" && (
        <div className="py-8">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                WanderWise AI Travel Platform
              </h1>
              <p className="text-xl text-gray-600">
                Discover, Plan, and Analyze your perfect travel experiences with AI
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8 bg-white shadow-lg rounded-xl p-2">
                <TabsTrigger value="hero" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg py-3">
                  🏠 Home
                </TabsTrigger>
                <TabsTrigger value="vibe" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg py-3">
                  💫 Vibe Match
                </TabsTrigger>
                <TabsTrigger value="itinerary" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-lg py-3">
                  📅 Smart Itinerary
                </TabsTrigger>
                <TabsTrigger value="safety" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-lg py-3">
                  🛡️ Safety Intelligence
                </TabsTrigger>
              </TabsList>

              <TabsContent value="vibe" className="space-y-8">
                <VibeDestinationMatcher />
              </TabsContent>

              <TabsContent value="itinerary" className="space-y-8">
                <SmartItineraryBuilder />
              </TabsContent>

              <TabsContent value="safety" className="space-y-8">
                <SafetyIntelligence />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}

      {/* Navigation for Hero */}
      {activeTab === "hero" && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-white/20 backdrop-blur-md rounded-full px-6 py-3 border border-white/30">
            <div className="flex gap-4">
              <Button 
                onClick={() => setActiveTab("vibe")}
                className="bg-purple-600/80 hover:bg-purple-700 text-white backdrop-blur-sm rounded-full px-6"
              >
                Start Exploring
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;