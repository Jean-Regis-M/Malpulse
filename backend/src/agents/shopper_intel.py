from pydantic import BaseModel, Field
from typing import Optional, List
import json
from google import genai
from google.genai import types
from ...backend.src.core.config import settings
from ...backend.src.core.logger import logger

class ShopperIntent(BaseModel):
    category: Optional[str] = Field(None, description="General product category (e.g. blazer, shoes, electronics)")
    color: Optional[str] = Field(None, description="Specified product color")
    size: Optional[str] = Field(None, description="Specified product size")
    price_max: Optional[float] = Field(None, description="Maximum budget threshold")
    raw_query: str = Field(..., description="The original natural language shopper query")

class ShopperIntelligenceAgent:
    def __init__(self):
        # Initializing the modern Google GenAI Client
        self.ai = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model = "gemini-3.5-flash"

    async def analyze_query(self, query: str, chat_context: Optional[str] = None) -> ShopperIntent:
        logger.info(f"ShopperIntel processing query: '{query}'")
        
        system_prompt = (
            "You are the MallPulse Shopper Intelligence Agent. Your job is to extract detailed shopping "
            "attributes (category, color, size, maximum price) from unstructured shopper requests.\n"
            "Respond STRICTLY with a structured JSON object matching the requested schema."
        )
        
        user_message = query
        if chat_context:
            user_message = f"Previous conversation context:\n{chat_context}\n\nCurrent user message:\n{query}"

        # Requesting a structured JSON output with the defined Schema
        response = self.ai.models.generate_content(
            model=self.model,
            contents=user_message,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                response_schema=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "category": types.Schema(type=types.Type.STRING),
                        "color": types.Schema(type=types.Type.STRING),
                        "size": types.Schema(type=types.Type.STRING),
                        "price_max": types.Schema(type=types.Type.NUMBER),
                        "raw_query": types.Schema(type=types.Type.STRING),
                    },
                    required=["raw_query"]
                )
            )
        )

        try:
            parsed_data = json.loads(response.text.strip())
            return ShopperIntent(**parsed_data)
        except Exception as e:
            logger.error(f"Error parsing ShopperIntel output: {e}. Output was {response.text}")
            return ShopperIntent(raw_query=query)
