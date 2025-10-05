import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Loader2, MapPin, Star, Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SafetyPage = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  // Destination Safety Check
  const [destinationQuery, setDestinationQuery] = useState("");

  useEffect(() => {
    // Check if there's a pre-filled destination from itinerary
    const storedDestination = localStorage.getItem('safety_destination_query');
    if (storedDestination) {
      setDestinationQuery(storedDestination);
      // Clear the stored value
      localStorage.removeItem('safety_destination_query');
      // Auto-run the safety check
      setTimeout(() => {
        checkDestinationSafety(storedDestination);
      }, 100);
    }
  }, []);

  const checkDestinationSafety = async (destination = null) => {
    const queryDestination = destination || destinationQuery.trim();
    
    // Ensure it's a string and not an object
    const destinationString = typeof queryDestination === 'string' ? queryDestination : String(queryDestination);
    
    if (!destinationString || destinationString === '[object Object]') {
      toast.error("Please enter a valid destination!");
      return;
    }

    setLoading(true);
    try {
      // Use the new destination reviews endpoint that fetches reviews automatically
      const params = new URLSearchParams();
      params.append('destination', destinationString);
      params.append('review_type', 'all');
      
      const response = await axios.get(`${API}/destination-reviews?${params.toString()}`);
      
      if (response.data.success) {
        setResults({
          type: 'destination',
          destination: destinationString,
          reviewData: response.data
        });
        toast.success(`Found ${response.data.review_count} reviews for ${destinationString}!`);
      } else {
        toast.error("No reviews found for this destination");
      }
    } catch (error) {
      console.error("Safety check error:", error);
      toast.error("Failed to fetch destination reviews. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function removed - now using automatic review fetching

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'negative': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Shield className="w-12 h-12 text-blue-500" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Safety Intelligence Hub
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get AI-powered safety insights for destinations and analyze travel reviews
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-6">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">Destination Safety</h3>
              <p className="text-gray-600">Comprehensive safety reports for any destination worldwide</p>
            </Card>
            <Card className="text-center p-6">
              <Star className="w-16 h-16 mx-auto mb-4 text-indigo-600" />
              <h3 className="text-xl font-semibold mb-2">Review Analysis</h3>
              <p className="text-gray-600">AI-powered analysis of travel reviews for safety insights</p>
            </Card>
            <Card className="text-center p-6">
              <Shield className="w-16 h-16 mx-auto mb-4 text-green-600" />
              <h3 className="text-xl font-semibold mb-2">Smart Insights</h3>
              <p className="text-gray-600">Get cleanliness scores, sentiment analysis, and recommendations</p>
            </Card>
          </div>
        </div>

        {/* Simplified - Only Destination Safety Check */}
        <div className="max-w-2xl mx-auto mb-8">
          <Card className="border-2 border-blue-500 bg-blue-50 shadow-lg">
            <CardContent className="p-8 text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold text-blue-800 mb-2">Destination Safety & Reviews</h3>
              <p className="text-blue-600 mb-4">Get safety scores, hygiene ratings, and review analysis for any destination</p>
              <Badge className="bg-blue-600 text-white">
                Automated Review Analysis
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Destination Safety Interface */}
        <Card className="max-w-4xl mx-auto mb-8 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-2xl text-center">
              🌍 Destination Safety & Review Analysis
            </CardTitle>
            <CardDescription className="text-center text-lg">
              Enter any destination to get comprehensive safety insights and automated review analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Destination to Analyze 🌍
                </label>
                <Input
                  placeholder="e.g., Tokyo, Japan or Bangkok, Thailand or Paris, France"
                  value={destinationQuery}
                  onChange={(e) => setDestinationQuery(e.target.value)}
                  className="text-lg py-3"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Enter any destination for automated review analysis, safety scores, and hygiene ratings
                </p>
              </div>

              <Button 
                onClick={checkDestinationSafety} 
                disabled={loading || !destinationQuery.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-4 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Fetching Reviews & Analyzing...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    Get Safety & Review Analysis
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Display */}
        {results && results.reviewData && (
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Safety & Review Report: {results.destination}
              </h2>
              <p className="text-gray-600 mb-4">
                Based on analysis of {results.reviewData.review_count} reviews • {results.reviewData.source}
              </p>
            </div>
            
            {/* Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-lg">
                <CardContent className="p-6 text-center">
                  <h4 className="font-semibold text-gray-800 mb-4">Overall Sentiment</h4>
                  <Badge className={`text-xl px-6 py-3 border-2 ${getSentimentColor(results.reviewData.aggregated_scores.dominant_sentiment)}`}>
                    {results.reviewData.aggregated_scores.dominant_sentiment?.toUpperCase()}
                  </Badge>
                  <div className="mt-3 text-sm text-gray-600">
                    {Object.entries(results.reviewData.aggregated_scores.sentiment_distribution || {}).map(([sentiment, count]) => (
                      <div key={sentiment} className="flex justify-between">
                        <span className="capitalize">{sentiment}:</span>
                        <span>{count} reviews</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardContent className="p-6 text-center">
                  <h4 className="font-semibold text-gray-800 mb-4">Safety Score</h4>
                  <div className="flex items-center justify-center gap-3 mb-3">
                    {getScoreIcon(results.reviewData.aggregated_scores.average_safety)}
                    <div className={`text-4xl font-bold ${getScoreColor(results.reviewData.aggregated_scores.average_safety)}`}>
                      {results.reviewData.aggregated_scores.average_safety}/10
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-1000" 
                      style={{ width: `${results.reviewData.aggregated_scores.average_safety * 10}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardContent className="p-6 text-center">
                  <h4 className="font-semibold text-gray-800 mb-4">Cleanliness Score</h4>
                  <div className="flex items-center justify-center gap-3 mb-3">
                    {getScoreIcon(results.reviewData.aggregated_scores.average_cleanliness)}
                    <div className={`text-4xl font-bold ${getScoreColor(results.reviewData.aggregated_scores.average_cleanliness)}`}>
                      {results.reviewData.aggregated_scores.average_cleanliness}/10
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-purple-400 to-purple-600 h-3 rounded-full transition-all duration-1000" 
                      style={{ width: `${results.reviewData.aggregated_scores.average_cleanliness * 10}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Summary */}
            {results.reviewData.summary && (
              <Card className="shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="text-xl text-blue-800 flex items-center gap-3">
                    <Star className="w-6 h-6" />
                    AI Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-gray-700 text-lg leading-relaxed">{results.reviewData.summary}</p>
                </CardContent>
              </Card>
            )}

            {/* Sample Reviews */}
            {results.reviewData.detailed_analyses && results.reviewData.detailed_analyses.length > 0 && (
              <Card className="shadow-xl">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50">
                  <CardTitle className="text-xl text-amber-800 flex items-center gap-3">
                    <Shield className="w-6 h-6" />
                    Sample Review Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {results.reviewData.detailed_analyses.slice(0, 3).map((reviewAnalysis, index) => (
                      <div key={index} className="border-l-4 border-blue-400 pl-4 py-3 bg-blue-50 rounded-r-lg">
                        <p className="text-gray-800 mb-3 italic">"{reviewAnalysis.review}"</p>
                        <div className="flex flex-wrap gap-3">
                          <Badge className={getSentimentColor(reviewAnalysis.analysis.overall_sentiment)}>
                            {reviewAnalysis.analysis.overall_sentiment}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            Safety: {reviewAnalysis.analysis.safety_score}/10
                          </span>
                          <span className="text-sm text-gray-600">
                            Cleanliness: {reviewAnalysis.analysis.cleanliness_score}/10
                          </span>
                        </div>
                        {reviewAnalysis.analysis.key_insights && reviewAnalysis.analysis.key_insights.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              Key insights: {reviewAnalysis.analysis.key_insights.slice(0, 2).join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SafetyPage;