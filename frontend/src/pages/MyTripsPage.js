import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Calendar, MapPin, Trash2, Eye, Plus, Clock, Users, DollarSign } from "lucide-react";
import { toast } from "sonner";

const MyTripsPage = () => {
  const navigate = useNavigate();
  const { user, getSavedItineraries, deleteItinerary, isAuthenticated } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    loadTrips();
  }, [isAuthenticated, navigate]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const savedTrips = await getSavedItineraries();
      setTrips(savedTrips);
    } catch (error) {
      console.error('Failed to load trips:', error);
      toast.error("Failed to load your trips");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (tripId, tripTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${tripTitle}"?`)) {
      return;
    }

    setDeleting(prev => ({ ...prev, [tripId]: true }));
    
    try {
      await deleteItinerary(tripId);
      setTrips(prev => prev.filter(trip => trip.id !== tripId));
      toast.success("Trip deleted successfully");
    } catch (error) {
      console.error('Failed to delete trip:', error);
      toast.error("Failed to delete trip");
    } finally {
      setDeleting(prev => ({ ...prev, [tripId]: false }));
    }
  };

  const handleViewTrip = (trip) => {
    // Load the trip data into localStorage and navigate to itinerary page
    localStorage.setItem('generatedItinerary', JSON.stringify({
      destination: trip.destination,
      itinerary: trip.itinerary_data,
      travelDates: trip.travel_dates,
      preferences: trip.preferences,
      travelers: trip.preferences?.travelers || "2",
      savedTripId: trip.id,
      title: trip.title
    }));
    
    navigate('/itinerary');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Calendar className="w-12 h-12 text-emerald-500" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              My Trips
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your saved travel itineraries and past adventures
          </p>
        </div>

        {/* Welcome Message */}
        <div className="max-w-4xl mx-auto mb-8">
          <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-emerald-800">
                    Welcome back, {user?.name}! 👋
                  </h3>
                  <p className="text-emerald-600 mt-1">
                    You have {trips.length} saved {trips.length === 1 ? 'trip' : 'trips'}
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/vibe-match')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Plan New Trip
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trips Grid */}
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="bg-gray-200 h-32"></CardHeader>
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-24 h-24 mx-auto mb-6 text-gray-300" />
              <h3 className="text-2xl font-bold text-gray-800 mb-4">No Trips Yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Start planning your first adventure! Use our AI to discover destinations that match your vibe.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => navigate('/vibe-match')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Find Your Vibe
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/plan-direct')}
                >
                  Plan Directly
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip) => (
                <Card key={trip.id} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-emerald-600" />
                        <span className="text-lg font-bold text-emerald-800 truncate">
                          {trip.destination?.name || 'Unknown Destination'}
                        </span>
                      </div>
                    </CardTitle>
                    <p className="text-emerald-600 font-medium">{trip.title}</p>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Trip Details */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {formatDate(trip.travel_dates?.start_date)} - {formatDate(trip.travel_dates?.end_date)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>
                            {calculateDuration(trip.travel_dates?.start_date, trip.travel_dates?.end_date)} days
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{trip.preferences?.travelers || "2"} travelers</span>
                        </div>
                      </div>

                      {/* Travel Style */}
                      {trip.preferences?.travel_style && (
                        <div>
                          <Badge variant="outline" className="capitalize">
                            {trip.preferences.travel_style}
                          </Badge>
                        </div>
                      )}

                      {/* Budget */}
                      {trip.preferences?.budget_range && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          <span className="capitalize">{trip.preferences.budget_range}</span>
                        </div>
                      )}

                      {/* Created Date */}
                      <div className="text-xs text-gray-500 border-t pt-3">
                        Created: {formatDate(trip.created_at)}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button 
                          onClick={() => handleViewTrip(trip)}
                          className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Trip
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => handleDeleteTrip(trip.id, trip.title)}
                          disabled={deleting[trip.id]}
                          className="text-red-600 hover:text-red-700 hover:border-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {trips.length > 0 && (
          <div className="max-w-4xl mx-auto mt-12">
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold text-purple-800 mb-4">
                  Ready for Your Next Adventure? ✈️
                </h3>
                <p className="text-purple-600 mb-6">
                  Discover new destinations that match your travel vibe
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={() => navigate('/vibe-match')}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Find New Vibe
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/plan-direct')}
                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    Plan Direct Trip
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTripsPage;