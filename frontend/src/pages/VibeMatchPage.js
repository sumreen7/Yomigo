import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Loader2, MapPin, Heart, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VibeMatchPage = () => {
  const navigate = useNavigate();
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

  const selectDestination = (destination) => {
    // Store the vibe match data and navigate to destination selection page
    localStorage.setItem('vibeMatchData', JSON.stringify({
      vibeQuery,
      destinationType,
      budget,
      selectedDestination: destination,
      allResults: results
    }));
    
    navigate('/destinations');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Heart className="w-12 h-12 text-pink-500" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Find Your Perfect Vibe
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tell us your travel mood and we'll find destinations that match your vibe perfectly
          </p>
        </div>

        {/* Vibe Match Form */}
        <Card className="max-w-4xl mx-auto mb-12 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="text-2xl text-center">Describe Your Dream Trip</CardTitle>
            <CardDescription className="text-center text-lg">
              The more specific you are, the better we can match your perfect destination
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  What's your travel vibe? ✨
                </label>
                <Textarea
                  placeholder="e.g., I want somewhere peaceful with golden sunsets, amazing local food, and friendly people where I can disconnect from technology and reconnect with nature..."
                  value={vibeQuery}
                  onChange={(e) => setVibeQuery(e.target.value)}
                  className="min-h-32 text-base"
                />
                <p className="text-sm text-gray-500 mt-2">
                  {vibeQuery.length}/500 characters
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Destination Type (Optional)
                  </label>
                  <Select value={destinationType} onValueChange={setDestinationType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any type works for me" />
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

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Budget Range (Optional)
                  </label>
                  <Select value={budget} onValueChange={setBudget}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any budget is fine" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">💰 Budget ($50-100/day)</SelectItem>
                      <SelectItem value="mid-range">💳 Mid-range ($100-250/day)</SelectItem>
                      <SelectItem value="luxury">💎 Luxury ($250+/day)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleVibeMatch} 
                disabled={loading || !vibeQuery.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Finding Your Perfect Match...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Find My Destinations
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Match Score */}
            <div className="text-center">
              <Badge className="text-xl px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                ✨ Vibe Match Score: {Math.round(results.vibe_score * 100)}%
              </Badge>
              
              <div className="bg-blue-50 p-6 rounded-xl mt-6">
                <h3 className="font-semibold text-blue-800 text-lg mb-3">Why These Match Your Vibe:</h3>
                <p className="text-blue-700 text-lg">{results.reasoning}</p>
              </div>
            </div>

            {/* Destination Cards */}
            <div className="grid gap-8">
              <h3 className="text-3xl font-bold text-center text-gray-800 mb-4">
                Perfect Destinations for You
              </h3>
              
              {results.matched_destinations?.map((destination, index) => (
                <Card 
                  key={index} 
                  className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border-2 border-transparent hover:border-purple-200"
                  onClick={() => selectDestination(destination)}
                >
                  <CardContent className="p-8">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <MapPin className="w-6 h-6 text-purple-600" />
                          <h4 className="text-2xl font-bold text-gray-800">
                            {destination.name}
                          </h4>
                          <Badge variant="secondary" className="text-sm">
                            {destination.country}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-700 text-lg mb-4 leading-relaxed">
                          {destination.description}
                        </p>

                        {/* New Enhanced Information */}
                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                          {/* Recommended Days */}
                          {destination.recommended_days && (
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <p className="text-blue-800 font-semibold text-sm mb-1">Recommended Stay</p>
                              <p className="text-blue-700 text-sm">
                                {destination.recommended_days.ideal} days ideal
                              </p>
                              <p className="text-blue-600 text-xs">
                                ({destination.recommended_days.min}-{destination.recommended_days.max} days)
                              </p>
                            </div>
                          )}

                          {/* Best Months */}
                          {destination.best_months && (
                            <div className="bg-green-50 p-3 rounded-lg">
                              <p className="text-green-800 font-semibold text-sm mb-1">Best Time to Visit</p>
                              <p className="text-green-700 text-sm">
                                {destination.best_months.slice(0, 3).join(', ')}
                              </p>
                              {destination.avg_temp_range && (
                                <p className="text-green-600 text-xs">
                                  {destination.avg_temp_range}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Highlights */}
                          {destination.highlights && (
                            <div className="bg-amber-50 p-3 rounded-lg">
                              <p className="text-amber-800 font-semibold text-sm mb-1">Top Highlights</p>
                              <p className="text-amber-700 text-sm">
                                {destination.highlights.slice(0, 2).join(', ')}
                              </p>
                              {destination.highlights.length > 2 && (
                                <p className="text-amber-600 text-xs">
                                  +{destination.highlights.length - 2} more
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <p className="text-purple-800 font-semibold mb-2">Perfect Match Because:</p>
                          <p className="text-purple-700">{destination.why_it_matches}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center gap-4">
                        <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-8 py-3 group-hover:scale-105 transition-transform">
                          <ArrowRight className="w-5 h-5 mr-2" />
                          Choose This Destination
                        </Button>
                        
                        <p className="text-sm text-gray-500 text-center">
                          Select dates & get personalized itinerary
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VibeMatchPage;