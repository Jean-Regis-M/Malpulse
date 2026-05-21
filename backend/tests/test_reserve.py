import pytest
from unittest.mock import AsyncMock, MagicMock
from ...backend.src.agents.fulfillment_coordinator import FulfillmentCoordinatorAgent

@pytest.mark.asyncio
async def test_fulfillment_reservation_locking():
    agent = FulfillmentCoordinatorAgent()
    
    # Configure mock connection context sessions for MongoDB Transaction validation
    from ...backend.src.db.mongodb import db
    db.client = AsyncMock()
    mock_session = AsyncMock()
    db.client.start_session.return_value = mock_session
    mock_session.__aenter__.return_value = mock_session
    
    db.db = MagicMock()
    
    # Mocking inventory state
    db.db.inventory.find_one = AsyncMock(return_value={
        "_id": "PROD-101",
        "store_id": "tenant-nike",
        "product_name": "Premium Navy Blazer",
        "price": 189.00,
        "variants": [{"size": "42R", "stock_level": 5}]
    })
    db.db.inventory.update_one = AsyncMock()
    
    # Mocking reservation response
    db.db.reservations.insert_one = AsyncMock()
    db.db.tenants.find_one = AsyncMock(return_value={
        "name": "Nike Mall Outlet",
        "floor": 1,
        "unit": "A-12"
    })
    
    result = await agent.create_reservation(
        shopper_id="user-001",
        store_id="tenant-nike",
        sku="PROD-101",
        size="42R"
    )
    
    assert result is not None
    assert "reservation_id" in result
    assert result["store_name"] == "Nike Mall Outlet"
    assert result["product_name"] == "Premium Navy Blazer"
