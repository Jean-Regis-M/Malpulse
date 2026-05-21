from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import uuid
from ...backend.src.db.mongodb import db
from ...backend.src.core.logger import logger

class FulfillmentCoordinatorAgent:
    def __init__(self):
        pass

    async def create_reservation(
        self,
        shopper_id: str,
        store_id: str,
        sku: str,
        size: str,
        ttl_minutes: int = 15
    ) -> Optional[Dict[str, Any]]:
        logger.info(f"FulfillmentCoordinator executing hold: user_id={shopper_id}, item={sku}, size={size}")
        
        # We model this operation using a multi-document transaction for complete ACID safety
        async with await db.client.start_session() as session:
            async with session.start_transaction():
                # 1. Fetch current inventory variant to check stock level
                product = await db.db.inventory.find_one({"_id": sku}, session=session)
                if not product:
                    logger.error(f"Fulfillment hold rejected: SKU {sku} does not exist.")
                    return None
                    
                # Store-match safety
                if product["store_id"] != store_id:
                    logger.error("Fulfillment hold rejected: Retailer mismatch.")
                    return None

                # Locate variant and check stock
                variant_index = -1
                for idx, variant in enumerate(product.get("variants", [])):
                    if variant["size"] == size:
                        variant_index = idx
                        break
                        
                if variant_index == -1:
                    logger.error(f"Fulfillment hold rejected: Size {size} unavailable.")
                    return None
                    
                current_stock = product["variants"][variant_index]["stock_level"]
                if current_stock <= 0:
                    logger.error(f"Fulfillment hold rejected: SKU {sku} is out of stock.")
                    return None
                    
                # 2. Decrement the specific size stock level in the inventory collection
                await db.db.inventory.update_one(
                    {"_id": sku, f"variants.{variant_index}.size": size},
                    {"$inc": {f"variants.{variant_index}.stock_level": -1}},
                    session=session
                )
                
                # 3. Create the Reservation record
                now = datetime.utcnow()
                expires_at = now + timedelta(minutes=ttl_minutes)
                reservation_id = f"RES-{uuid.uuid4().hex[:8].upper()}"
                
                reservation_doc = {
                    "_id": reservation_id,
                    "shopper_id": shopper_id,
                    "store_id": store_id,
                    "sku": sku,
                    "selected_size": size,
                    "status": "PENDING",
                    "created_at": now,
                    "expires_at": expires_at
                }
                
                await db.db.reservations.insert_one(reservation_doc, session=session)
                logger.info(f"Fulfillment hold confirmed within transaction: {reservation_id}")
                
                # Retrieve store details to generate indoor-navigation parameters
                store = await db.db.tenants.find_one({"_id": store_id}, session=session)
                
                return {
                    "reservation_id": reservation_id,
                    "product_name": product["product_name"],
                    "price": product["price"],
                    "store_name": store["name"],
                    "floor": store["floor"],
                    "unit": store["unit"],
                    "created_at": now.isoformat() + "Z",
                    "expires_at": expires_at.isoformat() + "Z"
                }

    async def expire_reservation_manual(self, reservation_id: str):
        """
        Manually trigger reservation cleanup before the TTL daemon executes.
        Restores stock levels within an ACID transaction.
        """
        logger.info(f"FulfillmentCoordinator manually expiring reservation {reservation_id}")
        async with await db.client.start_session() as session:
            async with session.start_transaction():
                reservation = await db.db.reservations.find_one({"_id": reservation_id}, session=session)
                if not reservation or reservation["status"] != "PENDING":
                    return False
                    
                # Mark expired
                await db.db.reservations.update_one(
                    {"_id": reservation_id},
                    {"$set": {"status": "EXPIRED"}},
                    session=session
                )
                
                # Locate variant in database and increment stock back
                sku = reservation["sku"]
                size = reservation["selected_size"]
                product = await db.db.inventory.find_one({"_id": sku}, session=session)
                if product:
                    for idx, v in enumerate(product.get("variants", [])):
                        if v["size"] == size:
                            await db.db.inventory.update_one(
                                {"_id": sku, f"variants.{idx}.size": size},
                                {"$inc": {f"variants.{idx}.stock_level": 1}},
                                session=session
                            )
                            break
                return True
print("FulfillmentCoordinator loaded.")
