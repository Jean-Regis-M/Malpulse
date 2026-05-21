from typing import Dict, Any, List, Optional
import json
from google import genai
from google.genai import types
from ...backend.src.core.config import settings
from ...backend.src.core.logger import logger
from ...backend.src.db.mongodb import db
from ...backend.src.agents.shopper_intelligence import ShopperIntelligenceAgent
from ...backend.src.agents.inventory_locator import InventoryLocatorAgent
from ...backend.src.agents.fulfillment_coordinator import FulfillmentCoordinatorAgent

class SupervisorAgent:
    def __init__(self):
        self.ai = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model = "gemini-3.5-flash"
        
        # Instantiate sub-agents
        self.shopper_intel = ShopperIntelligenceAgent()
        self.inventory_locator = InventoryLocatorAgent()
        self.fulfillment_coord = FulfillmentCoordinatorAgent()

    async def run_conversational_turn(
        self, 
        user_id: str, 
        session_id: str, 
        message: str,
        shopper_coordinates: Optional[List[float]] = None
    ) -> Dict[str, Any]:
        logger.info(f"Supervisor evaluating session {session_id} turn with message: '{message}'")
        
        # 1. Load active conversational memory from sessions_and_memory
        session_doc = await db.db.sessions_and_memory.find_one({"_id": session_id})
        chat_history = ""
        if session_doc:
            events = session_doc.get("events", [])
            # Only use last 10 turns to avoid context-window bloat
            for idx, e in enumerate(events[-10:]):
                chat_history += f"{e['type'].upper()}: {e['text']}\n"
                
        # 2. Analyze intent using ShopperIntelligenceAgent
        intent = await self.shopper_intel.analyze_query(message, chat_history if chat_history else None)
        logger.info(f"Supervisor captured intent extract: {intent.model_dump()}")
        
        # 3. Handle routing. We check if the intent specifies product parameters.
        matched_items = []
        action_taken = "CONVERSATION"
        
        has_product_search = intent.category is not None or intent.color is not None
        
        if has_product_search:
            action_taken = "SEARCH"
            matched_items = await self.inventory_locator.search_inventory(
                intent=intent, 
                shopper_coordinates=shopper_coordinates
            )
            logger.info(f"InventoryLocator returned {len(matched_items)} matching stock records")

        # 4. Compute final natural language response based on search outcome or simple questions
        system_instruction = (
            "You are MallPulse, the unified intelligent shopping center concierge. You have real-time "
            "geospatial visibility across every store in the mall.\n"
            "Formulate helpful, concise, and professional responses. If items were found, summarize them "
            "clearly, highlighting which floor/unit they are in, their price, and availability."
        )
        
        prompt_content = f"User Message: {message}\n"
        if has_product_search:
            prompt_content += f"\nActive Search Results:\n{json.dumps(matched_items[:3], indent=2)}"
        if chat_history:
            prompt_content = f"Conversation History:\n{chat_history}\n\n" + prompt_content
            
        gpt_response = self.ai.models.generate_content(
            model=self.model,
            contents=prompt_content,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.3
            )
        )
        final_answer = gpt_response.text.strip()
        
        # 5. Persist the turn events to the sessions_and_memory collection
        new_events = [
            {"event_id": f"evt-{uuid_hex()}", "type": "shopper", "text": message, "timestamp": datetime.utcnow()},
            {"event_id": f"evt-{uuid_hex()}", "type": "concierge", "text": final_answer, "timestamp": datetime.utcnow()}
        ]
        
        await db.db.sessions_and_memory.update_one(
            {"_id": session_id},
            {
                "$setOnInsert": {"user_id": user_id},
                "$push": {"events": {"$each": new_events}}
            },
            upsert=True
        )
        
        return {
            "session_id": session_id,
            "shopper_intent": intent.model_dump(),
            "action_taken": action_taken,
            "matched_items": matched_items,
            "response": final_answer,
            "traces": [
                {
                    "step": "Shopper Intent Extraction",
                    "agent": "Shopper Intelligence Agent",
                    "details": f"Extracted keywords: category={intent.category}, size={intent.size}, color={intent.color}",
                    "status": "success"
                },
                {
                    "step": "GeoNear Multi-Tenant Inventory Matching",
                    "agent": "Inventory Locator Agent",
                    "details": f"Run radial search inside the 2dsphere index. Matched {len(matched_items)} items.",
                    "status": "success" if len(matched_items) > 0 else "neutral"
                }
            ]
        }

def uuid_hex():
    import uuid
    return uuid.uuid4().hex[:6]

from datetime import datetime
