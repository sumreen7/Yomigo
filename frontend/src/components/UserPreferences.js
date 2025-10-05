import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

const UserPreferences = ({ isOpen, onClose }) => {
  const { user, updateUserPreferences } = useAuth();
  const [preferences, setPreferences] = useState({
    preferred_currency: 'USD',
    travel_style: 'relaxed',
    budget_preference: 'mid-range'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.preferences) {
      setPreferences({
        preferred_currency: user.preferences.preferred_currency || 'USD',
        travel_style: user.preferences.travel_style || 'relaxed',
        budget_preference: user.preferences.budget_preference || 'mid-range'
      });
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateUserPreferences(preferences);
      toast.success('Preferences saved successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to save preferences');
      console.error('Save preferences error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Travel Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preferred Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Currency
            </label>
            <Select 
              value={preferences.preferred_currency} 
              onValueChange={(value) => setPreferences(prev => ({ ...prev, preferred_currency: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                <SelectItem value="CHF">CHF - Swiss Franc</SelectItem>
                <SelectItem value="CNY">CNY - Chinese Yuan</SelectItem>
                <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                <SelectItem value="THB">THB - Thai Baht</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Travel Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Travel Style
            </label>
            <Select 
              value={preferences.travel_style} 
              onValueChange={(value) => setPreferences(prev => ({ ...prev, travel_style: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relaxed">Relaxed</SelectItem>
                <SelectItem value="adventure">Adventure</SelectItem>
                <SelectItem value="cultural">Cultural</SelectItem>
                <SelectItem value="party">Party</SelectItem>
                <SelectItem value="romantic">Romantic</SelectItem>
                <SelectItem value="luxury">Luxury</SelectItem>
                <SelectItem value="budget">Budget Friendly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Budget Preference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget Preference
            </label>
            <Select 
              value={preferences.budget_preference} 
              onValueChange={(value) => setPreferences(prev => ({ ...prev, budget_preference: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="budget">Budget</SelectItem>
                <SelectItem value="mid-range">Mid-Range</SelectItem>
                <SelectItem value="luxury">Luxury</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="flex-1 flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserPreferences;