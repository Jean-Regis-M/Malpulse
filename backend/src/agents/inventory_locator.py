from typing import List, Dict, Any, Optional
from ...backend.src.db.mongodb import db
from ...backend.src.core.logger import logger
from ...backend.src.agents.shopper_intelligence import ShopperIntent

class InventoryLocatorAgent:
    def __init__(self):
        pass

    async def search_inventory(
        self, 
        intent: ShopperIntent, 
        shopper_coordinates: Optional[List[float]] = None,
        max_radial_distance_miles: float = 2.0
    ) -> List[Dict[str, Any]]:
        logger.info(f"InventoryLocator searching inventory for: {intent.model_dump()}")
        
        # Build aggregation pipeline mapping Atlas Search, compound indexes and geospatial constraints
        pipeline = []
        
        # In a production Atlas cluster, we would start with an $search or $vectorSearch stage
        # For general MongoDB instance compatibility, we use standard compound matching and spherical indexes
        match_query: Dict[str, Any] = {}
        
        if intent.category:
            # Case insensitive regex match for flexibility
            match_query["product_name"] = {"$regex": intent.category, "$options": "i"}
        if intent.color:
            match_query["description"] = {"$regex": intent.color, "$options": "i"}
        if intent.price_max is not None:
            match_query["price"] = {"$lte": intent.price_max}
            
        pipeline.append({"$match": match_query})
        
        # Join with Tenants to gather geospatial location & store rating coordinates
        pipeline.append({
            "$lookup": {
                "from": "tenants",
                "localField": "store_id",
                "foreignField": "_id",
                "as": "store"
            }
        })
        pipeline.append({"$unwind": "$store"})
        
        # If shopper location is provided, perform geospatial distance sorting and filter within radial area
        if shopper_coordinates and len(shopper_coordinates) == 2:
            # long, lat coordinates
            geo_query = {
                "$geoNear": {
                    "near": {
                        "type": "Point",
                        "coordinates": shopper_coordinates
                    },
                    "distanceField": "distance_meters",
                    "spherical": True,
                }
            }
            # Add $geoNear as the very first stage if location filter is present
            pipeline.insert(0, geo_query)
            
            # Divide distance by earth radius (in meters) to check radial bounds
            # 2.0 miles approx = 3218 meters
            max_meters = max_radial_distance_miles * 1609.34
            pipeline.append({
                "$match": {
                    "distance_meters": {"$lte": max_meters}
                }
            })

        logger.info(f"Executing aggregation pipeline with {len(pipeline)} layers")
        cursor = db.db.inventory.aggregate(pipeline)
        results = []
        async for doc in cursor:
            # Flatten or format result
            results.append({
                "sku": doc["_id"],
                "product_name": doc["product_name"],
                "description": doc.get("description", ""),
                "price": doc["price"],
                "store_id": doc["store_id"],
                "store_name": doc["store"]["name"],
                "floor": doc["store"]["floor"],
                "unit": doc["store"]["unit"],
                "location": doc["store"]["location"]["coordinates"],
                "distance_meters": doc.get("distance_meters", 0.0),
                "variants": doc["variants"]
            })
            
        return results
