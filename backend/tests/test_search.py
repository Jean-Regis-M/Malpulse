import pytest
from unittest.mock import AsyncMock, MagicMock
from ...backend.src.agents.shopper_intelligence import ShopperIntelligenceAgent, ShopperIntent
from ...backend.src.agents.inventory_locator import InventoryLocatorAgent

@pytest.mark.asyncio
async def test_shopper_intelligence_extraction():
    agent = ShopperIntelligenceAgent()
    
    # Mocking GenAI interface
    mock_response = MagicMock()
    mock_response.text = '{"category": "blazer", "color": "navy", "size": "42R", "price_max": 200.0, "raw_query": "Find a navy blazer under 200"}'
    agent.ai.models.generate_content = MagicMock(return_value=mock_response)
    
    intent = await agent.analyze_query("Find a navy blazer under 200")
    
    assert intent.category == "blazer"
    assert intent.color == "navy"
    assert intent.price_max == 200.0

@pytest.mark.asyncio
async def test_inventory_locality_ranking():
    agent = InventoryLocatorAgent()
    
    # Mock database aggregation cursor
    mock_cursor = AsyncMock()
    mock_cursor.__aiter__.return_value = [
        {
            "_id": "PROD-101",
            "product_name": "Slim Navy Blazer",
            "price": 189.00,
            "store_id": "tenant-nike",
            "variants": [{"size": "42R", "stock_level": 3}],
            "store": {"name": "Nike Mall Outlet", "floor": 1, "unit": "A-12", "location": {"coordinates": [10.0, 20.0]}}
        }
    ]
    
    from ...backend.src.db.mongodb import db
    db.db = MagicMock()
    db.db.inventory.aggregate = MagicMock(return_value=mock_cursor)
    
    intent = ShopperIntent(category="blazer", color="navy", size="42R", price_max=200.0, raw_query="Search")
    results = await agent.search_inventory(intent)
    
    assert len(results) == 1
    assert results[0]["sku"] == "PROD-101"
    assert results[0]["store_name"] == "Nike Mall Outlet"
