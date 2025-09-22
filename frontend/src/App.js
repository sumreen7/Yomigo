import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Badge } from "./components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Loader2, MapPin, Clock, DollarSign, Heart, Star, Shield, Sparkles, Compass, Calendar } from "lucide-react";
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
            <span>Safety Insights</span>
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
                    <div className="bg-purple-50 p-3 rounded">
                      <p className="text-purple-800 font-medium">Perfect Match Because:</p>
                      <p className="text-purple-700">{destination.why_it_matches}</p>
                    </div>
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
  const [preferences, setPreferences] = useState({
    destination_type: "",
    budget_range: "",
    travel_style: "",
    duration: 7,
    activities: [],
    vibe: ""
  });
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState(null);

  const activityOptions = [
    "sightseeing", "food tours", "adventure sports", "museums", "nightlife", 
    "shopping", "beaches", "hiking", "photography", "local culture"
  ];

  const toggleActivity = (activity) => {
    setPreferences(prev => ({
      ...prev,
      activities: prev.activities.includes(activity)
        ? prev.activities.filter(a => a !== activity)
        : [...prev.activities, activity]
    }));
  };

  const createItinerary = async () => {
    if (!preferences.destination_type || !preferences.budget_range || !preferences.travel_style) {
      toast.error("Please fill in the required fields!");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/smart-itinerary`, preferences);
      setItinerary(response.data.itinerary);
      toast.success("Your personalized itinerary is ready!");
    } catch (error) {
      console.error("Itinerary creation error:", error);
      toast.error("Failed to create itinerary. Please try again.");
    } finally {
      setLoading(false);
    }
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (days)</label>
            <Input
              type="number"
              min="1"
              max="30"
              value={preferences.duration}
              onChange={(e) => setPreferences(prev => ({ ...prev, duration: parseInt(e.target.value) || 7 }))}
            />
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
                  onClick={() => toggleActivity(activity)}
                >
                  {activity}
                </Badge>
              ))}
            </div>
          </div>

          <div className="md:col-span-3">
            <Button 
              onClick={createItinerary} 
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Your Perfect Itinerary...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Create My Itinerary
                </>
              )}
            </Button>
          </div>
        </div>

        {itinerary && (
          <div className="mt-8 space-y-6">
            <h3 className="text-2xl font-bold text-center text-emerald-800">Your Personalized Itinerary</h3>
            
            {itinerary.destination_recommendations && (
              <div>
                <h4 className="text-xl font-semibold mb-4 text-gray-800">🏖️ Recommended Destinations</h4>
                <div className="grid gap-4">
                  {itinerary.destination_recommendations.map((dest, index) => (
                    <Card key={index} className="border-l-4 border-l-emerald-500">
                      <CardContent className="p-4">
                        <h5 className="font-bold text-lg text-emerald-800">{dest.name}</h5>
                        <p className="text-gray-700">{dest.description}</p>
                        {dest.why_recommended && (
                          <p className="text-emerald-700 mt-2 font-medium">✨ {dest.why_recommended}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {itinerary.daily_itinerary && (
              <div>
                <h4 className="text-xl font-semibold mb-4 text-gray-800">📅 Daily Itinerary</h4>
                <div className="grid gap-3">
                  {Object.entries(itinerary.daily_itinerary).map(([day, activities]) => (
                    <Card key={day} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <h5 className="font-bold text-blue-800 capitalize">{day.replace('_', ' ')}</h5>
                        <p className="text-gray-700">{activities}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {itinerary.estimated_costs && (
              <div>
                <h4 className="text-xl font-semibold mb-4 text-gray-800">💰 Estimated Costs</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(itinerary.estimated_costs).map(([category, cost]) => (
                    <Card key={category} className="border-l-4 border-l-yellow-500">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-yellow-600" />
                          <span className="font-semibold capitalize">{category}:</span>
                          <span className="text-yellow-700 font-bold">{cost}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ReviewAnalyzer = () => {
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

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
      setAnalysis(response.data.analysis);
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

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="text-3xl text-blue-800 flex items-center justify-center gap-2">
          <Shield className="w-8 h-8 text-indigo-500" />
          NLP Review Analyzer
        </CardTitle>
        <CardDescription className="text-lg text-blue-600">
          Get AI-powered insights on safety, cleanliness, and sentiment from travel reviews
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Travel Review to Analyze
          </label>
          <Textarea
            placeholder="Paste a travel review here... (e.g., hotel review, restaurant review, destination experience)"
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
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Review...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 mr-2" />
              Analyze Review
            </>
          )}
        </Button>

        {analysis && (
          <div className="mt-8 space-y-6">
            <h3 className="text-2xl font-bold text-center text-blue-800">Analysis Results</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4 text-center">
                  <h4 className="font-semibold text-gray-800 mb-2">Overall Sentiment</h4>
                  <Badge className={`text-lg px-4 py-2 ${getSentimentColor(analysis.overall_sentiment)}`}>
                    {analysis.overall_sentiment?.toUpperCase()}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-2">
                    Confidence: {Math.round(analysis.sentiment_confidence * 100)}%
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4 text-center">
                  <h4 className="font-semibold text-gray-800 mb-2">Safety Score</h4>
                  <div className={`text-3xl font-bold ${getScoreColor(analysis.safety_score)}`}>
                    {analysis.safety_score}/10
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${analysis.safety_score * 10}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4 text-center">
                  <h4 className="font-semibold text-gray-800 mb-2">Cleanliness Score</h4>
                  <div className={`text-3xl font-bold ${getScoreColor(analysis.cleanliness_score)}`}>
                    {analysis.cleanliness_score}/10
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${analysis.cleanliness_score * 10}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {analysis.key_insights && analysis.key_insights.length > 0 && (
              <Card className="border-l-4 border-l-amber-500">
                <CardHeader>
                  <CardTitle className="text-lg text-amber-800">🔍 Key Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.key_insights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Star className="w-4 h-4 text-amber-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-700">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {analysis.recommendation && (
              <Card className="border-l-4 border-l-indigo-500">
                <CardHeader>
                  <CardTitle className="text-lg text-indigo-800">💡 AI Recommendation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{analysis.recommendation}</p>
                </CardContent>
              </Card>
            )}

            {(analysis.safety_mentions || analysis.cleanliness_mentions) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.safety_mentions && (
                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader>
                      <CardTitle className="text-lg text-green-800">🛡️ Safety Mentions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {analysis.safety_mentions.map((mention, index) => (
                          <li key={index} className="text-sm text-gray-600">• {mention}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {analysis.cleanliness_mentions && (
                  <Card className="border-l-4 border-l-purple-500">
                    <CardHeader>
                      <CardTitle className="text-lg text-purple-800">🧹 Cleanliness Mentions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {analysis.cleanliness_mentions.map((mention, index) => (
                          <li key={index} className="text-sm text-gray-600">• {mention}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState("hero");

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
                <TabsTrigger value="analyzer" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-lg py-3">
                  🔍 Review Analyzer
                </TabsTrigger>
              </TabsList>

              <TabsContent value="vibe" className="space-y-8">
                <VibeDestinationMatcher />
              </TabsContent>

              <TabsContent value="itinerary" className="space-y-8">
                <SmartItineraryBuilder />
              </TabsContent>

              <TabsContent value="analyzer" className="space-y-8">
                <ReviewAnalyzer />
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