from mcp.server.fastmcp import FastMCP
from ...backend.src.db.mongodb import db
from ...backend.src.core.logger import logger
from bson import ObjectId

# Initialize FastMCP Server for MallPulse MongoDB Track
mcp = FastMCP("MallPulse-MongoDB-Bridge")

@mcp.tool()
async def db_search_inventory(query: str, in_stock_only: bool = True) -> str:
    """
    Search the multi-tenant mall inventory. Fits the fuzzy-matching and product search requirements.
    """
    logger.info(f"MCP Tool called: db_search_inventory (query={query})")
    try:
        # Match using case-insensitive search
        cursor = db.db.inventory.find({
            "$or": [
                {"product_name": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}},
                {"category": {"$regex": query, "$options": "i"}}
            ]
        })
        results = []
        async for doc in cursor:
            if in_stock_only:
                # Filter if at least one variant size is available
                has_stock = any(v.get("stock_level", 0) > 0 for v in doc.get("variants", []))
                if not has_stock:
                    continue
            results.append({
                "sku": doc["_id"],
                "product_name": doc["product_name"],
                "price": doc["price"],
                "store_id": doc["store_id"],
                "variants": doc["variants"]
            })
        return str(results)
    except Exception as e:
        return f"Error executing search query: {str(e)}"

@mcp.tool()
async def db_get_store_details(store_id: str) -> str:
    """
    Fetch tenant properties, operating hours, floor coordinates and unit location parameters.
    """
    logger.info(f"MCP Tool called: db_get_store_details (store_id={store_id})")
    try:
        tenant = await db.db.tenants.find_one({"_id": store_id})
        if not tenant:
            return f"Tenant {store_id} not found."
        return str(tenant)
    except Exception as e:
        return f"Error gathering tenant details: {str(e)}"

@mcp.tool()
async def db_create_reservation(shopper_id: str, store_id: str, sku: str, size: str) -> str:
    """
    Reserves an inventory variant, creates lock, decrements stock level within ACID transaction.
    """
    logger.info(f"MCP Tool called: db_create_reservation")
    # Redirect invocation to fulfillment agency
    from ...backend.src.agents.fulfillment_coordinator import FulfillmentCoordinatorAgent
    fc = FulfillmentCoordinatorAgent()
    res = await fc.create_reservation(shopper_id, store_id, sku, size)
    if not res:
        return "Reservation transaction failed: item out of stock or size mismatch."
    return f"Fulfillment hold confirmed locked: {str(res)}"

if __name__ == "__main__":
    # In production, serves over SSE HTTP transport on port 8080
    logger.info("Initializing MCP Server over HTTP transport.")
    mcp.run(transport="http", port=8080)
