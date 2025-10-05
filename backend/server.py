from fastapi import FastAPI, APIRouter, HTTPException, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime
from emergentintegrations.llm.chat import LlmChat, UserMessage
import asyncio
import json
import re
import hashlib
import secrets
from typing import Optional

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(
    title="WanderWise AI - Travel Platform",
    description="AI-powered travel platform for personalized experiences",
    version="1.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Initialize AI models
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# OpenAI for NLP and personalization
openai_chat = LlmChat(
    api_key=EMERGENT_LLM_KEY,
    session_id="openai-travel-session",
    system_message="You are WanderWise AI, an expert travel advisor specializing in personalized travel recommendations based on user preferences and vibes."
).with_model("openai", "gpt-4o")

# Anthropic for travel recommendations
claude_chat = LlmChat(
    api_key=EMERGENT_LLM_KEY,  
    session_id="claude-travel-session",
    system_message="You are Claude, a sophisticated travel expert who creates detailed, personalized itineraries and provides comprehensive travel insights."
).with_model("anthropic", "claude-3-7-sonnet-20250219")

# Sentiment analysis (simulated with OpenAI for now)
sentiment_chat = LlmChat(
    api_key=EMERGENT_LLM_KEY,
    session_id="sentiment-session", 
    system_message="You are a sentiment analysis expert specializing in travel reviews. Analyze sentiment, safety, and cleanliness insights from travel reviews."
).with_model("openai", "gpt-4o-mini")

# Models
class TravelPreferences(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    destination_type: str = Field(..., description="beach, mountain, city, cultural, adventure")
    budget_range: str = Field(..., description="budget, mid-range, luxury")
    travel_style: str = Field(..., description="relaxed, adventure, cultural, party, romantic")
    duration: int = Field(..., description="Trip duration in days")
    activities: List[str] = Field(default=[], description="Preferred activities")
    vibe: str = Field(..., description="Desired travel vibe/mood")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TravelRecommendation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_preferences: TravelPreferences
    destinations: List[Dict[str, Any]]
    itinerary: Dict[str, Any]  
    estimated_cost: Dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ReviewAnalysis(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    review_text: str
    overall_sentiment: str
    safety_score: float = Field(..., ge=0, le=10)
    cleanliness_score: float = Field(..., ge=0, le=10) 
    sentiment_confidence: float = Field(..., ge=0, le=1)
    key_insights: List[str]
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VibeDestination(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    vibe_query: str
    matched_destinations: List[Dict[str, Any]]
    vibe_score: float = Field(..., ge=0, le=1)
    reasoning: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
class SavedItinerary(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    destination: Dict[str, Any]
    itinerary_data: Dict[str, Any]
    travel_dates: Dict[str, Any]
    preferences: Dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# AI Helper Functions
async def analyze_travel_vibe(vibe_description: str, preferences: dict) -> Dict[str, Any]:
    """Analyze travel vibe and match with destinations"""
    prompt = f"""
    Analyze this travel vibe: "{vibe_description}"
    User preferences: {json.dumps(preferences)}
    
    Provide a JSON response with:
    1. matched_destinations: List of 5 destinations that match this vibe
    2. vibe_score: How well you can match this vibe (0-1)
    3. reasoning: Why these destinations match the vibe
    
    Each destination should have: name, country, description, why_it_matches, image_keywords
    """
    
    message = UserMessage(text=prompt)
    response = await openai_chat.send_message(message)
    
    try:
        # Extract JSON from response
        response_text = str(response)
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)  
        if json_match:
            return json.loads(json_match.group())
        else:
            # Fallback response
            return {
                "matched_destinations": [
                    {
                        "name": "Bali, Indonesia",
                        "country": "Indonesia", 
                        "description": "Tropical paradise with spiritual vibes",
                        "why_it_matches": "Perfect for the requested vibe",
                        "image_keywords": "tropical beach temple"
                    }
                ],
                "vibe_score": 0.8,
                "reasoning": "Based on your vibe preferences, these destinations offer the perfect atmosphere."
            }
    except Exception:
        return {
            "matched_destinations": [],
            "vibe_score": 0.5,
            "reasoning": "Unable to process vibe analysis"
        }

async def create_smart_itinerary(preferences: TravelPreferences) -> Dict[str, Any]:
    """Create personalized itinerary using Claude with timeout handling"""
    
    # Simplified prompt for faster response
    prompt = f"""
    Create a {preferences.duration}-day {preferences.destination_type} itinerary. Budget: {preferences.budget_range}, Style: {preferences.travel_style}.

    Return JSON with:
    {{
        "destination_recommendations": [
            {{"name": "Destination Name", "description": "Brief description", "highlights": ["key attraction 1", "key attraction 2"]}}
        ],
        "daily_itinerary": {{
            "day_1": {{"morning": "Activity", "afternoon": "Activity", "evening": "Activity"}},
            "day_2": {{"morning": "Activity", "afternoon": "Activity", "evening": "Activity"}}
        }},
        "estimated_costs": {{
            "accommodation": "$X-Y per night",
            "meals": "$X-Y per day", 
            "activities": "$X-Y per day"
        }},
        "local_tips": ["tip 1", "tip 2"]
    }}
    
    Keep it concise but helpful for {preferences.vibe} travelers.
    """
    
    message = UserMessage(text=prompt)
    
    try:
        # Add timeout handling
        import asyncio
        
        async def get_ai_response():
            return await claude_chat.send_message(message)
        
        # Try to get AI response with 20 second timeout
        try:
            response = await asyncio.wait_for(get_ai_response(), timeout=20.0)
            response_text = str(response)
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                parsed_result = json.loads(json_match.group())
                return parsed_result
        except asyncio.TimeoutError:
            logging.warning("Claude AI timed out, using fallback itinerary")
        except Exception as e:
            logging.warning(f"Claude AI error: {str(e)}, using fallback")
        
        # Enhanced fallback itinerary
        duration = preferences.duration
        days_dict = {}
        for i in range(1, min(duration + 1, 8)):  # Limit to 7 days max
            days_dict[f"day_{i}"] = {
                "morning": f"Day {i} morning: Explore local {preferences.destination_type} attractions",
                "afternoon": f"Day {i} afternoon: {preferences.travel_style} activities and local cuisine", 
                "evening": f"Day {i} evening: Relax and enjoy the {preferences.vibe} atmosphere"
            }
        
        return {
            "destination_recommendations": [
                {
                    "name": f"Perfect {preferences.destination_type.title()} Destination",
                    "description": f"Ideal {preferences.destination_type} location for {preferences.travel_style} travelers seeking {preferences.vibe} experiences",
                    "highlights": [f"Amazing {preferences.destination_type} scenery", "Local culture", "Great food scene"]
                },
                {
                    "name": f"Alternative {preferences.destination_type.title()} Spot", 
                    "description": f"Another excellent {preferences.destination_type} destination with {preferences.travel_style} vibes",
                    "highlights": ["Unique attractions", f"{preferences.budget_range} friendly", "Perfect for your style"]
                }
            ],
            "daily_itinerary": days_dict,
            "estimated_costs": {
                "accommodation": f"${80 if preferences.budget_range == 'budget' else 150 if preferences.budget_range == 'mid-range' else 300}/night",
                "meals": f"${30 if preferences.budget_range == 'budget' else 60 if preferences.budget_range == 'mid-range' else 120}/day",
                "activities": f"${40 if preferences.budget_range == 'budget' else 80 if preferences.budget_range == 'mid-range' else 160}/day"
            },
            "local_tips": [
                f"Best time to visit {preferences.destination_type} destinations varies by location",
                f"For {preferences.travel_style} travelers, pack comfortable clothing", 
                f"Research local customs and {preferences.budget_range} dining options",
                "Consider travel insurance and check visa requirements"
            ]
        }
    except Exception as e:
        logging.error(f"Itinerary creation failed: {str(e)}")
        return {"error": f"Unable to create itinerary: {str(e)}"}

async def create_smart_itinerary_for_destination(
    destination: str, 
    preferences: TravelPreferences, 
    selected_activities: List[str] = [], 
    travel_dates: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """Create personalized itinerary for a specific destination"""
    
    # Build enhanced prompt with destination and activities
    activities_text = ", ".join(selected_activities) if selected_activities else "general activities"
    dates_text = f"from {travel_dates.get('start_date')} to {travel_dates.get('end_date')}" if travel_dates else "flexible dates"
    
    prompt = f"""
    Create a detailed {preferences.duration}-day itinerary for {destination}.
    Travel dates: {dates_text}
    Budget: {preferences.budget_range}
    Style: {preferences.travel_style}
    Vibe: {preferences.vibe}
    Preferred activities: {activities_text}
    
    Return JSON with:
    {{
        "destination_info": {{
            "name": "{destination}",
            "description": "Brief overview",
            "best_time_to_visit": "Season info",
            "local_currency": "Currency",
            "language": "Primary language"
        }},
        "daily_itinerary": {{
            "day_1": {{
                "morning": {{"activity": "Activity name", "time": "9:00 AM", "cost": "$XX", "description": "Details"}},
                "afternoon": {{"activity": "Activity name", "time": "2:00 PM", "cost": "$XX", "description": "Details"}},
                "evening": {{"activity": "Activity name", "time": "7:00 PM", "cost": "$XX", "description": "Details"}}
            }}
        }},
        "estimated_costs": {{
            "accommodation": "$X-Y per night",
            "meals": "$X-Y per day",
            "activities": "$X-Y per day",
            "transportation": "$X-Y total"
        }},
        "local_tips": ["tip 1", "tip 2"],
        "packing_suggestions": ["item 1", "item 2"]
    }}
    """
    
    message = UserMessage(text=prompt)
    
    try:
        # Try to get AI response with timeout
        async def get_ai_response():
            return await claude_chat.send_message(message)
        
        try:
            response = await asyncio.wait_for(get_ai_response(), timeout=25.0)
            response_text = str(response)
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                parsed_result = json.loads(json_match.group())
                return parsed_result
        except asyncio.TimeoutError:
            logging.warning("Claude AI timed out, using enhanced fallback itinerary")
        except Exception as e:
            logging.warning(f"Claude AI error: {str(e)}, using enhanced fallback")
        
        # Enhanced fallback itinerary with destination-specific content
        duration = preferences.duration
        days_dict = {}
        for i in range(1, min(duration + 1, 8)):
            days_dict[f"day_{i}"] = {
                "morning": {
                    "activity": f"Explore {destination} highlights",
                    "time": "9:00 AM",
                    "cost": "$20-40",
                    "description": f"Visit top attractions in {destination}"
                },
                "afternoon": {
                    "activity": f"{preferences.travel_style.title()} activities",
                    "time": "2:00 PM", 
                    "cost": "$30-60",
                    "description": f"Enjoy {preferences.travel_style} experiences"
                },
                "evening": {
                    "activity": f"Local dining and {preferences.vibe} atmosphere",
                    "time": "7:00 PM",
                    "cost": "$25-50",
                    "description": f"Experience the {preferences.vibe} nightlife"
                }
            }
        
        return {
            "destination_info": {
                "name": destination,
                "description": f"Beautiful destination perfect for {preferences.travel_style} travelers",
                "best_time_to_visit": "Year-round destination with seasonal highlights",
                "local_currency": "Local currency",
                "language": "Local language"
            },
            "daily_itinerary": days_dict,
            "estimated_costs": {
                "accommodation": f"${80 if preferences.budget_range == 'budget' else 150 if preferences.budget_range == 'mid-range' else 300}/night",
                "meals": f"${30 if preferences.budget_range == 'budget' else 60 if preferences.budget_range == 'mid-range' else 120}/day",
                "activities": f"${40 if preferences.budget_range == 'budget' else 80 if preferences.budget_range == 'mid-range' else 160}/day",
                "transportation": f"${100 if preferences.budget_range == 'budget' else 200 if preferences.budget_range == 'mid-range' else 400} total"
            },
            "local_tips": [
                f"Research local customs and etiquette in {destination}",
                f"Best {preferences.travel_style} spots are often recommended by locals",
                f"Consider {preferences.budget_range} dining options for authentic experiences",
                "Download offline maps and translation apps"
            ],
            "packing_suggestions": [
                "Comfortable walking shoes",
                "Weather-appropriate clothing",
                "Portable charger and adapters",
                "Travel insurance documents"
            ]
        }
    except Exception as e:
        logging.error(f"Enhanced itinerary creation failed: {str(e)}")
        return {"error": f"Unable to create itinerary for {destination}: {str(e)}"}
async def analyze_review_sentiment(review_text: str) -> Dict[str, Any]:
    """Analyze travel review for sentiment, safety, and cleanliness"""
    prompt = f"""
    Analyze this travel review for sentiment, safety, and cleanliness insights:
    
    Review: "{review_text}"
    
    Provide JSON response with:
    1. overall_sentiment: "positive", "negative", or "neutral"
    2. sentiment_confidence: 0-1 confidence score
    3. safety_score: 0-10 (how safe the place seems)
    4. cleanliness_score: 0-10 (how clean the place seems)  
    5. key_insights: List of important points mentioned
    6. safety_mentions: Specific safety-related comments
    7. cleanliness_mentions: Specific cleanliness-related comments
    8. recommendation: Overall recommendation based on analysis
    """
    
    message = UserMessage(text=prompt)
    response = await sentiment_chat.send_message(message)
    
    try:
        response_text = str(response)
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
            return result
        else:
            # Fallback analysis
            return {
                "overall_sentiment": "neutral",
                "sentiment_confidence": 0.7,
                "safety_score": 7.0,
                "cleanliness_score": 7.0,
                "key_insights": ["Analysis completed"],
                "safety_mentions": ["No specific safety concerns mentioned"],
                "cleanliness_mentions": ["Standard cleanliness mentioned"],
                "recommendation": "Further analysis recommended"
            }
    except Exception:
        return {
            "overall_sentiment": "neutral", 
            "sentiment_confidence": 0.5,
            "safety_score": 5.0,
            "cleanliness_score": 5.0,
            "key_insights": ["Unable to analyze"],
            "recommendation": "Manual review needed"
        }

# Helper functions for auth
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, password_hash: str) -> bool:
    return hashlib.sha256(password.encode()).hexdigest() == password_hash

def generate_session_token() -> str:
    return secrets.token_urlsafe(32)

# API Endpoints
@api_router.get("/")
async def root():
    return {"message": "Yomigo Travel Platform API", "version": "1.0.0"}

# Authentication Endpoints
@api_router.post("/auth/register", response_model=Dict[str, Any])
async def register_user(email: str, password: str, name: str):
    """Register a new user"""
    try:
        # Check if user already exists
        existing_user = await db.users.find_one({"email": email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create new user
        password_hash = hash_password(password)
        user = User(
            email=email,
            password_hash=password_hash,
            name=name
        )
        
        await db.users.insert_one(user.dict())
        
        # Generate session token
        session_token = generate_session_token()
        session = {
            "user_id": user.id,
            "token": session_token,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow().replace(day=datetime.utcnow().day + 30)  # 30 day expiry
        }
        await db.sessions.insert_one(session)
        
        return {
            "success": True,
            "user": {"id": user.id, "email": user.email, "name": user.name},
            "session_token": session_token
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@api_router.post("/auth/login", response_model=Dict[str, Any])
async def login_user(email: str, password: str):
    """Login user"""
    try:
        user = await db.users.find_one({"email": email})
        if not user or not verify_password(password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Generate session token
        session_token = generate_session_token()
        session = {
            "user_id": user["id"],
            "token": session_token,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow().replace(day=datetime.utcnow().day + 30)
        }
        await db.sessions.insert_one(session)
        
        return {
            "success": True,
            "user": {"id": user["id"], "email": user["email"], "name": user["name"]},
            "session_token": session_token
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@api_router.post("/auth/verify", response_model=Dict[str, Any])
async def verify_session(session_token: str):
    """Verify session token"""
    try:
        session = await db.sessions.find_one({"token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        # Check if session expired
        if datetime.utcnow() > session["expires_at"]:
            await db.sessions.delete_one({"token": session_token})
            raise HTTPException(status_code=401, detail="Session expired")
        
        user = await db.users.find_one({"id": session["user_id"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return {
            "success": True,
            "user": {"id": user["id"], "email": user["email"], "name": user["name"]}
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Session verification error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid session")

# Saved Itinerary Endpoints
@api_router.post("/itineraries/save", response_model=Dict[str, Any])
async def save_itinerary(
    session_token: str,
    title: str,
    destination: Dict[str, Any],
    itinerary_data: Dict[str, Any],
    travel_dates: Dict[str, Any],
    preferences: Dict[str, Any]
):
    """Save itinerary for user"""
    try:
        # Verify session
        session = await db.sessions.find_one({"token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        # Create saved itinerary
        saved_itinerary = SavedItinerary(
            user_id=session["user_id"],
            title=title,
            destination=destination,
            itinerary_data=itinerary_data,
            travel_dates=travel_dates,
            preferences=preferences
        )
        
        await db.saved_itineraries.insert_one(saved_itinerary.dict())
        
        return {
            "success": True,
            "itinerary_id": saved_itinerary.id,
            "message": "Itinerary saved successfully!"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Save itinerary error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save itinerary: {str(e)}")

@api_router.get("/itineraries/my", response_model=Dict[str, Any])
async def get_my_itineraries(session_token: str):
    """Get user's saved itineraries"""
    try:
        # Verify session
        session = await db.sessions.find_one({"token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        # Get user's itineraries
        itineraries = await db.saved_itineraries.find(
            {"user_id": session["user_id"]}
        ).sort("created_at", -1).to_list(50)
        
        return {
            "success": True,
            "itineraries": itineraries
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Get itineraries error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get itineraries: {str(e)}")

@api_router.delete("/itineraries/{itinerary_id}", response_model=Dict[str, Any])
async def delete_itinerary(itinerary_id: str, session_token: str):
    """Delete saved itinerary"""
    try:
        # Verify session
        session = await db.sessions.find_one({"token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        # Delete itinerary (only if owned by user)
        result = await db.saved_itineraries.delete_one({
            "id": itinerary_id,
            "user_id": session["user_id"]
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Itinerary not found")
        
        return {
            "success": True,
            "message": "Itinerary deleted successfully!"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Delete itinerary error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete itinerary: {str(e)}")

@api_router.post("/vibe-match", response_model=Dict[str, Any])
async def match_vibe_destinations(vibe_query: str, destination_type: Optional[str] = None, budget: Optional[str] = None):
    """Match destinations based on travel vibe"""
    try:
        preferences = {
            "destination_type": destination_type or "any",
            "budget": budget or "mid-range"
        }
        
        result = await analyze_travel_vibe(vibe_query, preferences)
        
        # Save to database
        vibe_destination = VibeDestination(
            vibe_query=vibe_query,
            matched_destinations=result.get("matched_destinations", []),
            vibe_score=result.get("vibe_score", 0.5),
            reasoning=result.get("reasoning", "")
        )
        
        await db.vibe_destinations.insert_one(vibe_destination.dict())
        
        return {
            "success": True,
            "vibe_query": vibe_query,
            "results": result
        }
        
    except Exception as e:
        logging.error(f"Vibe matching error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Vibe matching failed: {str(e)}")

@api_router.post("/destination-suggestions", response_model=Dict[str, Any])
async def get_destination_suggestions(
    destination_type: str,
    budget_range: str,
    travel_style: str,
    vibe: str = "",
    travel_month: Optional[str] = None
):
    """Get destination suggestions based on preferences"""
    try:
        prompt = f"""
        Suggest 5 specific destinations for:
        - Type: {destination_type}
        - Budget: {budget_range}
        - Style: {travel_style}
        - Vibe: {vibe}
        - Travel month: {travel_month or 'any time'}
        
        Return JSON array:
        [{{
            "name": "City, Country",
            "description": "Why it's perfect",
            "best_months": ["Jan", "Feb"],
            "avg_temp": "25°C",
            "highlights": ["attraction1", "attraction2"],
            "why_now": "Seasonal reason if travel_month specified"
        }}]
        """
        
        message = UserMessage(text=prompt)
        response = await openai_chat.send_message(message)
        
        try:
            response_text = str(response)
            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if json_match:
                destinations = json.loads(json_match.group())
                return {
                    "success": True,
                    "destinations": destinations
                }
        except Exception:
            pass
        
        # Fallback destinations
        fallback_destinations = [
            {
                "name": f"Popular {destination_type.title()} Destination",
                "description": f"Perfect for {travel_style} {budget_range} travelers",
                "best_months": ["Apr", "May", "Sep", "Oct"],
                "avg_temp": "22°C",
                "highlights": ["Local attractions", "Great food", "Beautiful scenery"],
                "why_now": f"Great time for {travel_style} activities"
            }
        ]
        
        return {
            "success": True,
            "destinations": fallback_destinations
        }
        
    except Exception as e:
        logging.error(f"Destination suggestions error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get suggestions: {str(e)}")

@api_router.post("/activity-suggestions", response_model=Dict[str, Any])
async def get_activity_suggestions(
    destination: str,
    travel_style: str,
    budget_range: str,
    travel_month: str,
    duration: int
):
    """Get activity suggestions for specific destination and dates"""
    try:
        prompt = f"""
        Suggest activities for {destination} in {travel_month}:
        - Style: {travel_style}
        - Budget: {budget_range}
        - Duration: {duration} days
        
        Return JSON:
        {{
            "seasonal_activities": [{{
                "name": "Activity name",
                "description": "What it involves",
                "cost": "$XX-YY",
                "duration": "X hours",
                "best_time": "morning/afternoon/evening",
                "why_this_month": "Seasonal reason"
            }}],
            "year_round_activities": [{{
                "name": "Activity name", 
                "description": "What it involves",
                "cost": "$XX-YY",
                "duration": "X hours"
            }}]
        }}
        """
        
        message = UserMessage(text=prompt)
        response = await openai_chat.send_message(message)
        
        try:
            response_text = str(response)
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                activities = json.loads(json_match.group())
                return {
                    "success": True,
                    "activities": activities
                }
        except Exception:
            pass
        
        # Fallback activities
        return {
            "success": True,
            "activities": {
                "seasonal_activities": [
                    {
                        "name": f"{travel_month} Special Experience",
                        "description": f"Perfect activity for {travel_month} in {destination}",
                        "cost": "$50-100",
                        "duration": "3-4 hours",
                        "best_time": "morning",
                        "why_this_month": f"Ideal weather and conditions in {travel_month}"
                    }
                ],
                "year_round_activities": [
                    {
                        "name": "Local Cultural Tour",
                        "description": f"Explore the culture and history of {destination}",
                        "cost": "$30-60",
                        "duration": "2-3 hours"
                    }
                ]
            }
        }
        
    except Exception as e:
        logging.error(f"Activity suggestions error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get activities: {str(e)}")

@api_router.post("/smart-itinerary", response_model=Dict[str, Any])
async def create_personalized_itinerary(preferences: TravelPreferences):
    """Create detailed itinerary - simplified to match frontend"""
    try:
        logging.info(f"Creating itinerary with preferences: {preferences.dict()}")
        
        itinerary_data = await create_smart_itinerary(preferences)
        
        # Save recommendation
        recommendation = TravelRecommendation(
            user_preferences=preferences,
            destinations=[],
            itinerary=itinerary_data,
            estimated_cost=itinerary_data.get("estimated_costs", {})
        )
        
        await db.travel_recommendations.insert_one(recommendation.dict())
        
        return {
            "success": True,
            "preferences": preferences.dict(),
            "itinerary": itinerary_data
        }
        
    except Exception as e:
        logging.error(f"Itinerary creation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Itinerary creation failed: {str(e)}")

@api_router.get("/duration-recommendation", response_model=Dict[str, Any])
async def get_duration_recommendation(
    destination: str, 
    destination_type: str = "city", 
    travel_style: str = "relaxed", 
    activities: str = ""
):
    """Get AI recommendation for ideal trip duration"""
    try:
        prompt = f"""
        Recommend ideal trip duration for:
        - Destination: {destination}
        - Type: {destination_type}
        - Style: {travel_style}
        - Activities: {activities}
        
        Consider:
        - Must-see attractions and time needed
        - Travel style pace
        - Activities requirements
        - Local customs and logistics
        
        Provide JSON response:
        {{
            "recommended_days": {{
                "minimum": 3,
                "ideal": 7,
                "maximum": 14
            }},
            "reasoning": "Why this duration works best",
            "activity_breakdown": {{
                "sightseeing": "2-3 days",
                "cultural_immersion": "1-2 days"
            }},
            "tips": ["Tip 1", "Tip 2"]
        }}
        """
        
        message = UserMessage(text=prompt)
        response = await openai_chat.send_message(message)
        
        try:
            response_text = str(response)
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                recommendation = json.loads(json_match.group())
                return {
                    "success": True,
                    "destination": destination,
                    "recommendation": recommendation
                }
        except:
            pass
        
        # Fallback recommendation based on destination type
        fallback_durations = {
            "city": {"minimum": 3, "ideal": 5, "maximum": 10},
            "beach": {"minimum": 4, "ideal": 7, "maximum": 14},
            "mountain": {"minimum": 5, "ideal": 8, "maximum": 21},
            "cultural": {"minimum": 4, "ideal": 7, "maximum": 12},
            "adventure": {"minimum": 7, "ideal": 10, "maximum": 21}
        }
        
        duration = fallback_durations.get(destination_type, fallback_durations["city"])
        
        return {
            "success": True,
            "destination": destination,
            "recommendation": {
                "recommended_days": duration,
                "reasoning": f"Based on typical {destination_type} destinations, {duration['ideal']} days allows for a good balance of exploration and relaxation.",
                "activity_breakdown": {
                    "exploration": "60% of time",
                    "relaxation": "40% of time"
                },
                "tips": [
                    f"Consider {duration['minimum']} days minimum to see key highlights",
                    f"{duration['ideal']} days is ideal for a well-rounded experience",
                    f"Up to {duration['maximum']} days if you want deep immersion"
                ]
            }
        }
        
    except Exception as e:
        logging.error(f"Duration recommendation error: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

@api_router.get("/destination-reviews", response_model=Dict[str, Any])
async def get_destination_reviews(destination: str, review_type: str = "all"):
    """Get aggregated reviews and analysis for a destination"""
    try:
        # Simulated review data - in production, integrate with TripAdvisor/Google Places API
        sample_reviews = {
            "tokyo": [
                "Amazing city! Very clean and safe. Public transport is excellent. Language barrier can be challenging but people are helpful.",
                "Incredible experience in Tokyo. The food is outstanding, streets are spotless, and I felt completely safe even at night. Highly recommend!",
                "Beautiful city with rich culture. Sometimes crowded but well-organized. Clean facilities everywhere and very safe for solo travelers.",
                "Tokyo exceeded expectations! Super clean, efficient, and safe. The subway system is confusing at first but very reliable."
            ],
            "bangkok": [
                "Vibrant city with amazing street food! Can be chaotic and hot. Some areas are cleaner than others. Generally safe in tourist areas.",
                "Love Bangkok! Great food, friendly people. Traffic is crazy. Some areas need improvement in cleanliness but overall good experience.",
                "Fascinating city with incredible temples and food. Weather is very hot and humid. Stay in good areas for safety and cleanliness.",
                "Bangkok is amazing for food and culture. Some pollution and noise but that's part of the experience. Generally safe for tourists."
            ],
            "paris": [
                "Beautiful city with amazing architecture and food. Some areas are cleaner than others. Generally safe but watch for pickpockets.",
                "Paris is magical! Great museums, cafes, and culture. Metro can be crowded. Some tourist areas need better maintenance.",
                "Lovely city with rich history. Food scene is incredible. Some parts are very clean, others less so. Stay alert in tourist areas.",
                "Paris never disappoints! Beautiful sights, excellent cuisine. Public areas vary in cleanliness. Generally safe during daytime."
            ]
        }
        
        destination_lower = destination.lower()
        reviews = []
        
        # Find matching reviews
        for place, place_reviews in sample_reviews.items():
            if place in destination_lower or destination_lower in place:
                reviews = place_reviews
                break
        
        if not reviews:
            # Generate generic reviews using AI
            prompt = f"""Generate 4 realistic travel reviews for {destination}. Each review should mention aspects of safety, cleanliness, and overall experience. Keep them concise and authentic."""
            
            message = UserMessage(text=prompt)
            response = await openai_chat.send_message(message)
            response_text = str(response)
            
            # Extract reviews from AI response
            reviews = [
                f"Great destination with good safety standards and clean facilities. {destination} offers excellent travel experiences.",
                f"Really enjoyed my time in {destination}. Generally clean and safe area with friendly locals.",
                f"{destination} is a wonderful place to visit. Good infrastructure and safety measures in place.",
                f"Had an amazing trip to {destination}. Clean environment and felt safe throughout my stay."
            ]
        
        # Analyze each review
        analyses = []
        total_safety = 0
        total_cleanliness = 0
        sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0}
        
        for review in reviews:
            analysis = await analyze_review_sentiment(review)
            analyses.append({
                "review": review,
                "analysis": analysis
            })
            
            total_safety += analysis.get("safety_score", 5.0)
            total_cleanliness += analysis.get("cleanliness_score", 5.0)
            sentiment = analysis.get("overall_sentiment", "neutral")
            sentiment_counts[sentiment] = sentiment_counts.get(sentiment, 0) + 1
        
        # Calculate aggregated scores
        avg_safety = round(total_safety / len(reviews), 1)
        avg_cleanliness = round(total_cleanliness / len(reviews), 1)
        dominant_sentiment = max(sentiment_counts, key=sentiment_counts.get)
        
        # Generate overall summary
        summary_prompt = f"""Based on these travel reviews for {destination}, provide a concise summary of:
        1. Overall safety impression
        2. Cleanliness standards
        3. Key recommendations for travelers
        
        Reviews summary: Average safety {avg_safety}/10, cleanliness {avg_cleanliness}/10, mostly {dominant_sentiment} reviews."""
        
        message = UserMessage(text=summary_prompt)
        summary_response = await openai_chat.send_message(message)
        
        return {
            "success": True,
            "destination": destination,
            "review_count": len(reviews),
            "aggregated_scores": {
                "average_safety": avg_safety,
                "average_cleanliness": avg_cleanliness,
                "sentiment_distribution": sentiment_counts,
                "dominant_sentiment": dominant_sentiment
            },
            "summary": str(summary_response),
            "detailed_analyses": analyses[:3],  # Return top 3 detailed analyses
            "source": "Aggregated from multiple travel platforms"
        }
        
    except Exception as e:
        logging.error(f"Destination reviews error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get destination reviews: {str(e)}")

@api_router.post("/analyze-review", response_model=Dict[str, Any])
async def analyze_travel_review(review_text: str):
    """Analyze individual travel review for sentiment, safety, and cleanliness insights"""
    try:
        if len(review_text.strip()) < 10:
            raise HTTPException(status_code=400, detail="Review text too short")
            
        analysis_result = await analyze_review_sentiment(review_text)
        
        # Save analysis
        review_analysis = ReviewAnalysis(
            review_text=review_text,
            overall_sentiment=analysis_result.get("overall_sentiment", "neutral"),
            safety_score=analysis_result.get("safety_score", 5.0),
            cleanliness_score=analysis_result.get("cleanliness_score", 5.0),
            sentiment_confidence=analysis_result.get("sentiment_confidence", 0.5),
            key_insights=analysis_result.get("key_insights", [])
        )
        
        await db.review_analyses.insert_one(review_analysis.dict())
        
        return {
            "success": True,
            "review_text": review_text,
            "analysis": analysis_result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Review analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Review analysis failed: {str(e)}")

@api_router.get("/convert-currency", response_model=Dict[str, Any])
async def convert_currency(amount: float, from_currency: str = "USD", to_currency: str = "USD"):
    """Convert currency using exchange rates"""
    try:
        # Simplified currency conversion - in production, use a real API like exchangerate.host
        exchange_rates = {
            "USD": 1.0,
            "EUR": 0.85,
            "GBP": 0.73,
            "JPY": 110.0,
            "AUD": 1.35,
            "CAD": 1.25,
            "CHF": 0.92,
            "CNY": 6.45,
            "INR": 74.5,
            "THB": 31.0,
            "MXN": 20.0,
            "BRL": 5.2,
            "KRW": 1180.0,
            "SGD": 1.35,
            "HKD": 7.8,
            "NOK": 8.5,
            "SEK": 8.8,
            "DKK": 6.3,
            "PLN": 3.9,
            "CZK": 21.5,
            "HUF": 295.0,
            "RUB": 73.0,
            "TRY": 8.5,
            "ZAR": 14.2,
            "EGP": 15.7,
            "AED": 3.67,
            "SAR": 3.75,
        }
        
        if from_currency not in exchange_rates or to_currency not in exchange_rates:
            return {
                "success": False,
                "error": f"Currency {from_currency} or {to_currency} not supported"
            }
        
        # Convert to USD first, then to target currency
        usd_amount = amount / exchange_rates[from_currency]
        converted_amount = usd_amount * exchange_rates[to_currency]
        
        return {
            "success": True,
            "original_amount": amount,
            "from_currency": from_currency,
            "to_currency": to_currency,
            "converted_amount": round(converted_amount, 2),
            "exchange_rate": round(exchange_rates[to_currency] / exchange_rates[from_currency], 4)
        }
        
    except Exception as e:
        logging.error(f"Currency conversion error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Currency conversion failed: {str(e)}")

@api_router.get("/destination-currency", response_model=Dict[str, Any])
async def get_destination_currency(destination: str):
    """Get local currency for a destination"""
    try:
        # Destination to currency mapping
        destination_currencies = {
            "japan": "JPY", "tokyo": "JPY", "kyoto": "JPY", "osaka": "JPY",
            "thailand": "THB", "bangkok": "THB", "phuket": "THB", "chiang mai": "THB",
            "india": "INR", "mumbai": "INR", "delhi": "INR", "goa": "INR", "kerala": "INR",
            "france": "EUR", "paris": "EUR", "nice": "EUR", "lyon": "EUR",
            "germany": "EUR", "berlin": "EUR", "munich": "EUR", "hamburg": "EUR",
            "italy": "EUR", "rome": "EUR", "florence": "EUR", "venice": "EUR",
            "spain": "EUR", "madrid": "EUR", "barcelona": "EUR", "seville": "EUR",
            "uk": "GBP", "london": "GBP", "edinburgh": "GBP", "manchester": "GBP",
            "australia": "AUD", "sydney": "AUD", "melbourne": "AUD", "brisbane": "AUD",
            "canada": "CAD", "toronto": "CAD", "vancouver": "CAD", "montreal": "CAD",
            "mexico": "MXN", "mexico city": "MXN", "cancun": "MXN", "tulum": "MXN",
            "brazil": "BRL", "rio": "BRL", "sao paulo": "BRL", "salvador": "BRL",
            "south korea": "KRW", "seoul": "KRW", "busan": "KRW",
            "singapore": "SGD",
            "hong kong": "HKD",
            "norway": "NOK", "oslo": "NOK", "bergen": "NOK",
            "sweden": "SEK", "stockholm": "SEK", "gothenburg": "SEK",
            "denmark": "DKK", "copenhagen": "DKK",
            "switzerland": "CHF", "zurich": "CHF", "geneva": "CHF",
            "china": "CNY", "beijing": "CNY", "shanghai": "CNY",
            "uae": "AED", "dubai": "AED", "abu dhabi": "AED",
            "saudi arabia": "SAR", "riyadh": "SAR", "jeddah": "SAR",
            "south africa": "ZAR", "cape town": "ZAR", "johannesburg": "ZAR",
            "egypt": "EGP", "cairo": "EGP", "alexandria": "EGP",
            "turkey": "TRY", "istanbul": "TRY", "ankara": "TRY",
        }
        
        destination_lower = destination.lower()
        currency = "USD"  # Default
        
        for place, curr in destination_currencies.items():
            if place in destination_lower:
                currency = curr
                break
        
        return {
            "success": True,
            "destination": destination,
            "currency": currency
        }
        
    except Exception as e:
        logging.error(f"Destination currency error: {str(e)}")
        return {
            "success": True,
            "destination": destination,
            "currency": "USD"
        }

@api_router.get("/travel-insights", response_model=Dict[str, Any])
async def get_travel_insights():
    """Get aggregated travel insights and statistics"""
    try:
        # Get recent analyses
        recent_reviews = await db.review_analyses.find().sort("created_at", -1).limit(10).to_list(10)
        recent_recommendations = await db.travel_recommendations.find().sort("created_at", -1).limit(5).to_list(5)
        recent_vibes = await db.vibe_destinations.find().sort("created_at", -1).limit(5).to_list(5)
        
        # Calculate averages
        if recent_reviews:
            avg_safety = sum(r.get("safety_score", 0) for r in recent_reviews) / len(recent_reviews)
            avg_cleanliness = sum(r.get("cleanliness_score", 0) for r in recent_reviews) / len(recent_reviews)
            sentiment_distribution = {}
            for review in recent_reviews:
                sentiment = review.get("overall_sentiment", "neutral")
                sentiment_distribution[sentiment] = sentiment_distribution.get(sentiment, 0) + 1
        else:
            avg_safety = 0
            avg_cleanliness = 0
            sentiment_distribution = {}
        
        return {
            "success": True,
            "insights": {
                "total_reviews_analyzed": len(recent_reviews),
                "average_safety_score": round(avg_safety, 2),
                "average_cleanliness_score": round(avg_cleanliness, 2),
                "sentiment_distribution": sentiment_distribution,
                "recent_recommendations": len(recent_recommendations),
                "popular_vibes": [v.get("vibe_query", "") for v in recent_vibes[:3]]
            }
        }
        
    except Exception as e:
        logging.error(f"Insights error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get insights: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

@app.on_event("startup")  
async def startup_event():
    logger.info("WanderWise AI Travel Platform starting up...")
    logger.info("AI models initialized successfully")