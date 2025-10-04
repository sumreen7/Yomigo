import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Calendar, MapPin, DollarSign, Star, Clock, Users, ArrowLeft, Download, Share } from "lucide-react";
import { toast } from "sonner";

const ItineraryPage = () => {
  const navigate = useNavigate();
  const [itineraryData, setItineraryData] = useState(null);

  useEffect(() => {
    const storedItinerary = localStorage.getItem('generatedItinerary');
    if (storedItinerary) {
      const parsed = JSON.parse(storedItinerary);
      setItineraryData(parsed);
    } else {
      // If no itinerary, redirect to vibe match
      navigate('/vibe-match');
    }
  }, [navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const shareItinerary = () => {
    if (navigator.share) {
      navigator.share({
        title: `My ${itineraryData?.destination?.name} Itinerary`,
        text: `Check out my amazing trip to ${itineraryData?.destination?.name}!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Itinerary link copied to clipboard!");
    }
  };

  const downloadItinerary = () => {
    toast.info("Download feature coming soon!");
  };

  const startNewTrip = () => {
    localStorage.removeItem('generatedItinerary');
    localStorage.removeItem('vibeMatchData');
    navigate('/vibe-match');
  };

  if (!itineraryData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Itinerary Found</h2>
          <p className="text-gray-600 mb-6">Start by finding destinations that match your vibe</p>
          <Button onClick={() => navigate('/vibe-match')} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            Find My Vibe
          </Button>
        </div>
      </div>
    );
  }

  const { destination, itinerary, travelDates, travelers } = itineraryData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Calendar className="w-12 h-12 text-emerald-500" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              Your Perfect Itinerary
            </h1>
          </div>
          <div className="flex items-center justify-center gap-4 mb-6">
            <MapPin className="w-6 h-6 text-gray-600" />
            <span className="text-2xl font-semibold text-gray-800">{destination.name}</span>
          </div>
          
          {travelDates && (
            <div className="flex flex-wrap justify-center gap-6 text-lg text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{formatDate(travelDates.start_date)} → {formatDate(travelDates.end_date)}</span>
              </div>
              {travelers && (
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>{travelers === "1" ? "Solo Trip" : `${travelers} Travelers`}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Button variant="outline" onClick={() => navigate('/vibe-match')} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Find New Destination
          </Button>
          <Button variant="outline" onClick={shareItinerary} className="flex items-center gap-2">
            <Share className="w-4 h-4" />
            Share Itinerary
          </Button>
          <Button variant="outline" onClick={downloadItinerary} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Destination Overview */}
          <Card className="shadow-xl border-2 border-emerald-200">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50">
              <CardTitle className="text-2xl text-center text-emerald-800">
                🏖️ Destination Highlights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <p className="text-gray-700 text-lg mb-6 leading-relaxed text-center">
                {destination.description}
              </p>
              
              {destination.highlights && (
                <div className="flex flex-wrap justify-center gap-3">
                  {destination.highlights.map((highlight, index) => (
                    <Badge key={index} variant="outline" className="text-emerald-700 border-emerald-300 px-3 py-1">
                      {highlight}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Itinerary */}
          {itinerary.daily_itinerary && (
            <div>
              <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">📅 Your Daily Schedule</h2>
              <div className="grid gap-6">
                {Object.entries(itinerary.daily_itinerary).map(([day, dayActivities]) => (
                  <Card key={day} className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-emerald-50 border-b">
                      <CardTitle className="text-xl text-blue-800 capitalize flex items-center gap-3">
                        <Calendar className="w-6 h-6" />
                        {day.replace('_', ' ')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {typeof dayActivities === 'object' && dayActivities !== null ? (
                        <div className="space-y-6">
                          {Object.entries(dayActivities).map(([period, activity]) => (
                            <div key={period} className="flex gap-4">
                              <div className="flex-shrink-0 w-24">
                                <Badge variant={period === 'morning' ? 'default' : period === 'afternoon' ? 'secondary' : 'outline'} 
                                       className="capitalize w-full justify-center">
                                  {period}
                                </Badge>
                              </div>
                              <div className="flex-1">
                                {typeof activity === 'object' && activity !== null ? (
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-start justify-between mb-2">
                                      <h4 className="font-semibold text-gray-800 text-lg">{activity.activity || activity.name}</h4>
                                      <div className="flex gap-2">
                                        {activity.time && (
                                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {activity.time}
                                          </Badge>
                                        )}
                                        {activity.cost && (
                                          <Badge variant="outline" className="text-xs text-green-700 flex items-center gap-1">
                                            <DollarSign className="w-3 h-3" />
                                            {activity.cost}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    {activity.description && (
                                      <p className="text-gray-600">{activity.description}</p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-gray-700">{activity}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-700 text-lg">{dayActivities}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Budget Breakdown */}
          {itinerary.estimated_costs && (
            <Card className="shadow-xl">
              <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
                <CardTitle className="text-2xl text-center text-yellow-800 flex items-center justify-center gap-3">
                  <DollarSign className="w-8 h-8" />
                  Budget Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(itinerary.estimated_costs).map(([category, cost]) => (
                    <div key={category} className="bg-yellow-50 p-6 rounded-xl text-center">
                      <h4 className="font-semibold text-gray-800 text-lg mb-2 capitalize">
                        {category.replace('_', ' ')}
                      </h4>
                      <p className="text-2xl font-bold text-yellow-700">{cost}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Local Tips */}
          {itinerary.local_tips && itinerary.local_tips.length > 0 && (
            <Card className="shadow-xl">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50">
                <CardTitle className="text-2xl text-center text-amber-800 flex items-center justify-center gap-3">
                  <Star className="w-8 h-8" />
                  Local Tips & Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid gap-4">
                  {itinerary.local_tips.map((tip, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg">
                      <Star className="w-5 h-5 text-amber-500 mt-1 flex-shrink-0" />
                      <p className="text-gray-700 leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Packing Suggestions */}
          {itinerary.packing_suggestions && itinerary.packing_suggestions.length > 0 && (
            <Card className="shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="text-2xl text-center text-purple-800">
                  🎒 Packing Essentials
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="flex flex-wrap gap-3 justify-center">
                  {itinerary.packing_suggestions.map((item, index) => (
                    <Badge key={index} variant="outline" className="text-purple-700 border-purple-300 px-4 py-2 text-base">
                      {item}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Start New Trip CTA */}
          <Card className="shadow-xl border-2 border-dashed border-emerald-300">
            <CardContent className="p-12 text-center">
              <h3 className="text-3xl font-bold text-gray-800 mb-4">Ready for Your Next Adventure?</h3>
              <p className="text-xl text-gray-600 mb-8">Discover more destinations that match your vibe</p>
              <Button 
                onClick={startNewTrip}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-4 text-lg"
              >
                Plan Another Trip
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ItineraryPage;