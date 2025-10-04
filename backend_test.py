import requests
import sys
import json
from datetime import datetime

class WanderWiseAPITester:
    def __init__(self, base_url="https://wanderwise-ai-1.preview.emergentagent.com"):
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

def main():
    print("🚀 Starting WanderWise AI Travel Platform API Tests")
    print("=" * 60)
    
    tester = WanderWiseAPITester()
    
    # Run all tests
    tests = [
        tester.test_root_endpoint,
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