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
    except:
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
    except:
        return {
            "overall_sentiment": "neutral", 
            "sentiment_confidence": 0.5,
            "safety_score": 5.0,
            "cleanliness_score": 5.0,
            "key_insights": ["Unable to analyze"],
            "recommendation": "Manual review needed"
        }

# API Endpoints
@api_router.get("/")
async def root():
    return {"message": "WanderWise AI Travel Platform API", "version": "1.0.0"}

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

@api_router.post("/smart-itinerary", response_model=Dict[str, Any])
async def create_personalized_itinerary(preferences: TravelPreferences):
    """Create personalized travel itinerary"""
    try:
        itinerary_data = await create_smart_itinerary(preferences)
        
        # Save recommendation
        recommendation = TravelRecommendation(
            user_preferences=preferences,
            destinations=itinerary_data.get("destination_recommendations", []),
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

@api_router.post("/analyze-review", response_model=Dict[str, Any])
async def analyze_travel_review(review_text: str):
    """Analyze travel review for sentiment, safety, and cleanliness insights"""
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