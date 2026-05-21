from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Any
from ....backend.src.agents.supervisor import SupervisorAgent
from ....backend.src.agents.fulfillment_coordinator import FulfillmentCoordinatorAgent
from ....backend.src.db.mongodb import db

router = APIRouter()
supervisor = SupervisorAgent()
fulfillment = FulfillmentCoordinatorAgent()

class ChatRequest(BaseModel):
    user_id: str = Field(..., example="shopper-001")
    session_id: str = Field(..., example="sess-991")
    message: str = Field(..., example="Find a navy blue blazer under $200")
    longitude: Optional[float] = Field(None, example=-122.404)
    latitude: Optional[float] = Field(None, example=37.781)

class HoldRequest(BaseModel):
    shopper_id: str = Field(..., example="shopper-001")
    store_id: str = Field(..., example="tenant-nike")
    sku: str = Field(..., example="SKU-8821")
    size: str = Field(..., example="XL")

@router.post("/chat")
async def chat_endpoint(payload: ChatRequest):
    coords = None
    if payload.longitude is not None and payload.latitude is not None:
        coords = [payload.longitude, payload.latitude]
        
    try:
        response_data = await supervisor.run_conversational_turn(
            user_id=payload.user_id,
            session_id=payload.session_id,
            message=payload.message,
            shopper_coordinates=coords
        )
        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reserve")
async def reserve_endpoint(payload: HoldRequest):
    try:
        hold_result = await fulfillment.create_reservation(
            shopper_id=payload.shopper_id,
            store_id=payload.store_id,
            sku=payload.sku,
            size=payload.size
        )
        if not hold_result:
            raise HTTPException(status_code=400, detail="Hold rejected. Item unavailable or out of stock.")
        return hold_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """
    Health check endpoint for Cloud Run/Kubernetes ingress checks.
    Verify connection state with the active MongoDB Atlas cluster.
    """
    try:
        if db.db is not None:
            # Execute standard ping command
            ping = await db.db.command("ping")
            return {"status": "healthy", "mongodb_connected": True, "ping": ping}
        return {"status": "unhealthy", "mongodb_connected": False}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
