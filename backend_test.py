import requests
import sys
import json
from datetime import datetime

class WanderWiseAPITester:
    def __init__(self, base_url="https://yomigo-travel.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=45)
            elif method == 'POST':
                if params:
                    # For POST with query parameters
                    response = requests.post(url, json=data, headers=headers, params=params, timeout=45)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=45)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if 'success' in response_data:
                        print(f"   Success: {response_data['success']}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout (45s)")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )

    def test_vibe_match(self):
        """Test vibe-based destination matching"""
        test_vibe = "I want somewhere peaceful with golden sunsets and great food"
        
        # Test with query parameters (as used in frontend)
        params = {
            'vibe_query': test_vibe,
            'destination_type': 'beach',
            'budget': 'mid-range'
        }
        
        success, response = self.run_test(
            "Vibe-Based Destination Matching",
            "POST",
            "vibe-match",
            200,
            params=params
        )
        
        if success and response:
            print(f"   Vibe Query: {response.get('vibe_query', 'N/A')}")
            results = response.get('results', {})
            if results:
                print(f"   Vibe Score: {results.get('vibe_score', 'N/A')}")
                destinations = results.get('matched_destinations', [])
                print(f"   Destinations Found: {len(destinations)}")
                if destinations:
                    print(f"   First Destination: {destinations[0].get('name', 'N/A')}")
        
        return success

    def test_smart_itinerary(self):
        """Test smart itinerary creation"""
        preferences = {
            "destination_type": "beach",
            "budget_range": "mid-range",
            "travel_style": "relaxed",
            "duration": 5,
            "activities": ["sightseeing", "food tours", "beaches"],
            "vibe": "peaceful and relaxing"
        }
        
        success, response = self.run_test(
            "Smart Itinerary Creation",
            "POST",
            "smart-itinerary",
            200,
            data=preferences
        )
        
        if success and response:
            itinerary = response.get('itinerary', {})
            if itinerary:
                print(f"   Destinations: {len(itinerary.get('destination_recommendations', []))}")
                print(f"   Daily Itinerary: {len(itinerary.get('daily_itinerary', {}))}")
                print(f"   Has Costs: {'estimated_costs' in itinerary}")
        
        return success

    def test_review_analysis(self):
        """Test travel review analysis"""
        review_text = "The hotel was amazing! Super clean rooms, felt very safe walking around at night, and the staff was incredibly friendly. The location was perfect and the food was delicious."
        
        # Test with query parameters (as used in frontend)
        params = {
            'review_text': review_text
        }
        
        success, response = self.run_test(
            "Travel Review Analysis",
            "POST",
            "analyze-review",
            200,
            params=params
        )
        
        if success and response:
            analysis = response.get('analysis', {})
            if analysis:
                print(f"   Sentiment: {analysis.get('overall_sentiment', 'N/A')}")
                print(f"   Safety Score: {analysis.get('safety_score', 'N/A')}/10")
                print(f"   Cleanliness Score: {analysis.get('cleanliness_score', 'N/A')}/10")
                print(f"   Confidence: {analysis.get('sentiment_confidence', 'N/A')}")
        
        return success

    def test_review_analysis_short_text(self):
        """Test review analysis with short text (should fail)"""
        short_review = "Good"
        
        params = {
            'review_text': short_review
        }
        
        success, response = self.run_test(
            "Review Analysis - Short Text (Should Fail)",
            "POST",
            "analyze-review",
            400,  # Expecting 400 for short text
            params=params
        )
        
        return success

    def test_travel_insights(self):
        """Test travel insights endpoint"""
        return self.run_test(
            "Travel Insights",
            "GET",
            "travel-insights",
            200
        )

    def test_destination_suggestions(self):
        """Test destination suggestions endpoint"""
        params = {
            'destination_type': 'mountain',
            'budget_range': 'mid-range',
            'travel_style': 'adventure',
            'vibe': 'cultural temples and street food in Asia',
            'travel_month': 'March'
        }
        
        success, response = self.run_test(
            "Destination Suggestions",
            "POST",
            "destination-suggestions",
            200,
            params=params
        )
        
        if success and response:
            destinations = response.get('destinations', [])
            print(f"   Destinations Found: {len(destinations)}")
            if destinations:
                print(f"   First Destination: {destinations[0].get('name', 'N/A')}")
        
        return success

    def test_activity_suggestions(self):
        """Test activity suggestions endpoint"""
        params = {
            'destination': 'Bangkok Thailand',
            'travel_style': 'adventure',
            'budget_range': 'mid-range',
            'travel_month': 'March',
            'duration': 5
        }
        
        success, response = self.run_test(
            "Activity Suggestions",
            "POST",
            "activity-suggestions",
            200,
            params=params
        )
        
        if success and response:
            activities = response.get('activities', {})
            seasonal = activities.get('seasonal_activities', [])
            year_round = activities.get('year_round_activities', [])
            print(f"   Seasonal Activities: {len(seasonal)}")
            print(f"   Year-round Activities: {len(year_round)}")
        
        return success

    def test_currency_conversion(self):
        """Test currency conversion endpoint"""
        params = {
            'amount': 100,
            'from_currency': 'USD',
            'to_currency': 'THB'
        }
        
        success, response = self.run_test(
            "Currency Conversion",
            "GET",
            "convert-currency",
            200,
            params=params
        )
        
        if success and response:
            print(f"   Original: {response.get('original_amount', 'N/A')} {response.get('from_currency', 'N/A')}")
            print(f"   Converted: {response.get('converted_amount', 'N/A')} {response.get('to_currency', 'N/A')}")
            print(f"   Exchange Rate: {response.get('exchange_rate', 'N/A')}")
        
        return success

    def test_destination_currency(self):
        """Test destination currency lookup"""
        params = {
            'destination': 'Bangkok Thailand'
        }
        
        success, response = self.run_test(
            "Destination Currency Lookup",
            "GET",
            "destination-currency",
            200,
            params=params
        )
        
        if success and response:
            print(f"   Destination: {response.get('destination', 'N/A')}")
            print(f"   Currency: {response.get('currency', 'N/A')}")
        
        return success

    def test_user_registration_with_preferences(self):
        """Test user registration includes default preferences"""
        # Generate unique email for testing
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        test_email = f"test_{timestamp}@example.com"
        
        params = {
            'email': test_email,
            'password': 'testpass123',
            'name': 'Test User'
        }
        
        success, response = self.run_test(
            "User Registration with Preferences",
            "POST",
            "auth/register",
            200,
            params=params
        )
        
        if success and response:
            user = response.get('user', {})
            preferences = user.get('preferences', {})
            session_token = response.get('session_token')
            
            print(f"   User ID: {user.get('id', 'N/A')}")
            print(f"   Email: {user.get('email', 'N/A')}")
            print(f"   Has Session Token: {bool(session_token)}")
            print(f"   Default Currency: {preferences.get('preferred_currency', 'N/A')}")
            print(f"   Default Travel Style: {preferences.get('travel_style', 'N/A')}")
            print(f"   Default Budget: {preferences.get('budget_preference', 'N/A')}")
            
            # Store session token for further tests
            self.test_session_token = session_token
            self.test_user_email = test_email
            
            # Verify default preferences are set
            expected_defaults = {
                'preferred_currency': 'USD',
                'travel_style': 'relaxed',
                'budget_preference': 'mid-range'
            }
            
            for key, expected_value in expected_defaults.items():
                if preferences.get(key) != expected_value:
                    print(f"   ⚠️  Default {key} is {preferences.get(key)}, expected {expected_value}")
                    return False
            
            print("   ✅ All default preferences are correct")
        
        return success

    def test_user_login_with_preferences(self):
        """Test user login returns preferences"""
        if not hasattr(self, 'test_user_email'):
            print("   ⚠️  Skipping - No test user available from registration")
            return True
        
        params = {
            'email': self.test_user_email,
            'password': 'testpass123'
        }
        
        success, response = self.run_test(
            "User Login with Preferences",
            "POST",
            "auth/login",
            200,
            params=params
        )
        
        if success and response:
            user = response.get('user', {})
            preferences = user.get('preferences', {})
            session_token = response.get('session_token')
            
            print(f"   User ID: {user.get('id', 'N/A')}")
            print(f"   Has Session Token: {bool(session_token)}")
            print(f"   Currency: {preferences.get('preferred_currency', 'N/A')}")
            print(f"   Travel Style: {preferences.get('travel_style', 'N/A')}")
            print(f"   Budget: {preferences.get('budget_preference', 'N/A')}")
            
            # Update session token for further tests
            self.test_session_token = session_token
        
        return success

    def test_get_user_preferences(self):
        """Test GET /api/user/preferences endpoint"""
        if not hasattr(self, 'test_session_token'):
            print("   ⚠️  Skipping - No session token available")
            return True
        
        params = {
            'session_token': self.test_session_token
        }
        
        success, response = self.run_test(
            "Get User Preferences",
            "GET",
            "user/preferences",
            200,
            params=params
        )
        
        if success and response:
            preferences = response.get('preferences', {})
            print(f"   Currency: {preferences.get('preferred_currency', 'N/A')}")
            print(f"   Travel Style: {preferences.get('travel_style', 'N/A')}")
            print(f"   Budget: {preferences.get('budget_preference', 'N/A')}")
        
        return success

    def test_update_user_preferences(self):
        """Test POST /api/user/preferences endpoint"""
        if not hasattr(self, 'test_session_token'):
            print("   ⚠️  Skipping - No session token available")
            return True
        
        params = {
            'session_token': self.test_session_token,
            'preferred_currency': 'EUR',
            'travel_style': 'adventure',
            'budget_preference': 'luxury'
        }
        
        success, response = self.run_test(
            "Update User Preferences",
            "POST",
            "user/preferences",
            200,
            params=params
        )
        
        if success and response:
            print(f"   Update Success: {response.get('success', 'N/A')}")
            print(f"   Message: {response.get('message', 'N/A')}")
        
        return success

    def test_verify_preferences_persistence(self):
        """Test that updated preferences persist"""
        if not hasattr(self, 'test_session_token'):
            print("   ⚠️  Skipping - No session token available")
            return True
        
        params = {
            'session_token': self.test_session_token
        }
        
        success, response = self.run_test(
            "Verify Preferences Persistence",
            "GET",
            "user/preferences",
            200,
            params=params
        )
        
        if success and response:
            preferences = response.get('preferences', {})
            print(f"   Currency: {preferences.get('preferred_currency', 'N/A')}")
            print(f"   Travel Style: {preferences.get('travel_style', 'N/A')}")
            print(f"   Budget: {preferences.get('budget_preference', 'N/A')}")
            
            # Verify updated values
            expected_updates = {
                'preferred_currency': 'EUR',
                'travel_style': 'adventure',
                'budget_preference': 'luxury'
            }
            
            for key, expected_value in expected_updates.items():
                if preferences.get(key) != expected_value:
                    print(f"   ❌ {key} is {preferences.get(key)}, expected {expected_value}")
                    return False
            
            print("   ✅ All preferences updated correctly")
        
        return success

    def test_enhanced_vibe_match(self):
        """Test enhanced vibe-match with new fields"""
        test_vibe = "I want somewhere with ancient temples and amazing street food"
        
        params = {
            'vibe_query': test_vibe,
            'destination_type': 'cultural',
            'budget': 'mid-range'
        }
        
        success, response = self.run_test(
            "Enhanced Vibe Match with New Fields",
            "POST",
            "vibe-match",
            200,
            params=params
        )
        
        if success and response:
            results = response.get('results', {})
            destinations = results.get('matched_destinations', [])
            
            print(f"   Destinations Found: {len(destinations)}")
            
            if destinations:
                first_dest = destinations[0]
                print(f"   First Destination: {first_dest.get('name', 'N/A')}")
                
                # Check for enhanced fields
                enhanced_fields = [
                    'recommended_days',
                    'best_months', 
                    'avg_temp_range',
                    'highlights'
                ]
                
                missing_fields = []
                for field in enhanced_fields:
                    if field not in first_dest:
                        missing_fields.append(field)
                    else:
                        print(f"   ✅ Has {field}: {first_dest[field]}")
                
                if missing_fields:
                    print(f"   ❌ Missing enhanced fields: {missing_fields}")
                    return False
                
                # Verify recommended_days structure
                rec_days = first_dest.get('recommended_days', {})
                if isinstance(rec_days, dict) and 'min' in rec_days and 'ideal' in rec_days and 'max' in rec_days:
                    print(f"   ✅ Recommended days structure correct: {rec_days}")
                else:
                    print(f"   ❌ Recommended days structure incorrect: {rec_days}")
                    return False
                
                # Verify best_months is array
                best_months = first_dest.get('best_months', [])
                if isinstance(best_months, list) and len(best_months) > 0:
                    print(f"   ✅ Best months is array: {best_months}")
                else:
                    print(f"   ❌ Best months should be array: {best_months}")
                    return False
                
                print("   ✅ All enhanced fields present and correctly structured")
        
        return success

    def test_enhanced_destination_suggestions(self):
        """Test enhanced destination-suggestions with new fields"""
        params = {
            'destination_type': 'beach',
            'budget_range': 'mid-range',
            'travel_style': 'relaxed',
            'vibe': 'tropical paradise with great food',
            'travel_month': 'April'
        }
        
        success, response = self.run_test(
            "Enhanced Destination Suggestions",
            "POST",
            "destination-suggestions",
            200,
            params=params
        )
        
        if success and response:
            destinations = response.get('destinations', [])
            print(f"   Destinations Found: {len(destinations)}")
            
            if destinations:
                first_dest = destinations[0]
                print(f"   First Destination: {first_dest.get('name', 'N/A')}")
                
                # Check for enhanced fields
                enhanced_fields = [
                    'recommended_days',
                    'best_months',
                    'avg_temp_range', 
                    'highlights',
                    'why_now',
                    'budget_notes'
                ]
                
                missing_fields = []
                for field in enhanced_fields:
                    if field not in first_dest:
                        missing_fields.append(field)
                    else:
                        print(f"   ✅ Has {field}: {first_dest[field]}")
                
                if missing_fields:
                    print(f"   ❌ Missing enhanced fields: {missing_fields}")
                    return False
                
                print("   ✅ All enhanced fields present")
        
        return success

    def test_itinerary_save_with_json_strings(self):
        """Test itinerary save endpoint with JSON string parameters"""
        if not hasattr(self, 'test_session_token'):
            print("   ⚠️  Skipping - No session token available")
            return True
        
        # Test data as JSON strings (as expected by the fixed endpoint)
        destination_json = json.dumps({
            "name": "Bali, Indonesia",
            "country": "Indonesia",
            "description": "Tropical paradise with spiritual vibes"
        })
        
        itinerary_data_json = json.dumps({
            "daily_itinerary": {
                "day_1": {
                    "morning": {"activity": "Temple visit", "time": "9:00 AM", "cost": "$20"},
                    "afternoon": {"activity": "Beach relaxation", "time": "2:00 PM", "cost": "$0"},
                    "evening": {"activity": "Local dinner", "time": "7:00 PM", "cost": "$25"}
                }
            },
            "estimated_costs": {
                "accommodation": "$150/night",
                "meals": "$60/day",
                "activities": "$80/day"
            }
        })
        
        travel_dates_json = json.dumps({
            "start_date": "2024-03-15",
            "end_date": "2024-03-20",
            "duration": 5
        })
        
        preferences_json = json.dumps({
            "budget_range": "mid-range",
            "travel_style": "relaxed",
            "preferred_currency": "USD"
        })
        
        params = {
            'session_token': self.test_session_token,
            'title': 'My Amazing Bali Trip',
            'destination': destination_json,
            'itinerary_data': itinerary_data_json,
            'travel_dates': travel_dates_json,
            'preferences': preferences_json
        }
        
        success, response = self.run_test(
            "Itinerary Save with JSON Strings",
            "POST",
            "itineraries/save",
            200,
            params=params
        )
        
        if success and response:
            print(f"   Success: {response.get('success', 'N/A')}")
            print(f"   Itinerary ID: {response.get('itinerary_id', 'N/A')}")
            print(f"   Message: {response.get('message', 'N/A')}")
            
            # Store itinerary ID for potential cleanup
            self.test_itinerary_id = response.get('itinerary_id')
        
        return success

    def test_seasonal_activity_suggestions(self):
        """Test seasonal activity suggestions endpoint with proper structure"""
        params = {
            'destination': 'Tokyo, Japan',
            'travel_style': 'cultural',
            'budget_range': 'mid-range',
            'travel_month': 'April',
            'duration': 7
        }
        
        success, response = self.run_test(
            "Seasonal Activity Suggestions",
            "POST",
            "activity-suggestions",
            200,
            params=params
        )
        
        if success and response:
            activities = response.get('activities', {})
            seasonal = activities.get('seasonal_activities', [])
            year_round = activities.get('year_round_activities', [])
            
            print(f"   Seasonal Activities: {len(seasonal)}")
            print(f"   Year-round Activities: {len(year_round)}")
            
            # Verify structure of seasonal activities
            if seasonal:
                first_seasonal = seasonal[0]
                required_fields = ['name', 'description', 'cost', 'duration', 'why_this_month']
                missing_fields = []
                
                for field in required_fields:
                    if field not in first_seasonal:
                        missing_fields.append(field)
                    else:
                        print(f"   ✅ Seasonal activity has {field}: {first_seasonal[field]}")
                
                if missing_fields:
                    print(f"   ❌ Missing seasonal activity fields: {missing_fields}")
                    return False
            
            # Verify structure of year-round activities
            if year_round:
                first_year_round = year_round[0]
                required_fields = ['name', 'description', 'cost', 'duration']
                missing_fields = []
                
                for field in required_fields:
                    if field not in first_year_round:
                        missing_fields.append(field)
                    else:
                        print(f"   ✅ Year-round activity has {field}: {first_year_round[field]}")
                
                if missing_fields:
                    print(f"   ❌ Missing year-round activity fields: {missing_fields}")
                    return False
            
            print("   ✅ Activity suggestions have proper structure")
        
        return success

    def test_destination_reviews_auto_fetch(self):
        """Test auto-fetch destination reviews endpoint"""
        params = {
            'destination': 'Tokyo, Japan',
            'review_type': 'all'
        }
        
        success, response = self.run_test(
            "Auto-fetch Destination Reviews",
            "GET",
            "destination-reviews",
            200,
            params=params
        )
        
        if success and response:
            print(f"   Destination: {response.get('destination', 'N/A')}")
            print(f"   Review Count: {response.get('review_count', 'N/A')}")
            
            # Check aggregated scores
            aggregated_scores = response.get('aggregated_scores', {})
            if aggregated_scores:
                print(f"   Average Safety: {aggregated_scores.get('average_safety', 'N/A')}/10")
                print(f"   Average Cleanliness: {aggregated_scores.get('average_cleanliness', 'N/A')}/10")
                print(f"   Dominant Sentiment: {aggregated_scores.get('dominant_sentiment', 'N/A')}")
                
                # Verify required fields
                required_fields = ['average_safety', 'average_cleanliness', 'sentiment_distribution', 'dominant_sentiment']
                missing_fields = []
                
                for field in required_fields:
                    if field not in aggregated_scores:
                        missing_fields.append(field)
                
                if missing_fields:
                    print(f"   ❌ Missing aggregated score fields: {missing_fields}")
                    return False
            
            # Check detailed analyses
            detailed_analyses = response.get('detailed_analyses', [])
            print(f"   Detailed Analyses: {len(detailed_analyses)}")
            
            # Check summary
            summary = response.get('summary', '')
            print(f"   Has Summary: {bool(summary)}")
            
            if not summary:
                print("   ❌ Missing summary field")
                return False
            
            print("   ✅ Destination reviews have proper structure")
        
        return success

def main():
    print("🚀 Starting WanderWise AI Travel Platform API Tests")
    print("=" * 60)
    
    tester = WanderWiseAPITester()
    
    # Run all tests - prioritizing new features as requested
    tests = [
        tester.test_root_endpoint,
        # User Preferences System Tests (Primary Focus)
        tester.test_user_registration_with_preferences,
        tester.test_user_login_with_preferences,
        tester.test_get_user_preferences,
        tester.test_update_user_preferences,
        tester.test_verify_preferences_persistence,
        # Enhanced Destination Suggestions Tests (Primary Focus)
        tester.test_enhanced_vibe_match,
        tester.test_enhanced_destination_suggestions,
        # Existing API Tests
        tester.test_vibe_match,
        tester.test_smart_itinerary,
        tester.test_review_analysis,
        tester.test_review_analysis_short_text,
        tester.test_travel_insights,
        tester.test_destination_suggestions,
        tester.test_activity_suggestions,
        tester.test_currency_conversion,
        tester.test_destination_currency
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
            tester.tests_run += 1
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed! Backend API is working correctly.")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed. Check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())