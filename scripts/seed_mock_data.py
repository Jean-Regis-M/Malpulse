import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DATABASE_NAME", "mallpulse")

async def seed_database():
    print(f"Connecting to MongoDB at {MONGODB_URL} for seeding...")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]
    
    # Clean previous records
    await db.tenants.delete_many({})
    await db.inventory.delete_many({})
    await db.reservations.delete_many({})
    await db.sessions_and_memory.delete_many({})
    
    # 1. Insert Tenants
    tenants = [
        {
            "_id": "tenant-zara",
            "name": "Zara Elegant Wear",
            "category": "Apparel",
            "location": {
                "type": "Point",
                "coordinates": [-122.4048, 37.7820] # Central Mall, First Floor
            },
            "floor": 1,
            "unit": "A-10",
            "rating": 4.6,
            "hours": "10:00 AM - 9:30 PM"
        },
        {
            "_id": "tenant-nike",
            "name": "Nike Performance Mall",
            "category": "Sportswear",
            "location": {
                "type": "Point",
                "coordinates": [-122.4042, 37.7815] # East Wing, First Floor
            },
            "floor": 1,
            "unit": "B-04",
            "rating": 4.8,
            "hours": "10:00 AM - 10:00 PM"
        },
        {
            "_id": "tenant-apple",
            "name": "Apple Smart Space",
            "category": "Electronics",
            "location": {
                "type": "Point",
                "coordinates": [-122.4056, 37.7828] # West Pavilion, Second Floor
            },
            "floor": 2,
            "unit": "C-11",
            "rating": 4.9,
            "hours": "9:30 AM - 10:00 PM"
        },
        {
            "_id": "tenant-hm",
            "name": "H&M Casual Fit",
            "category": "Apparel",
            "location": {
                "type": "Point",
                "coordinates": [-122.4051, 37.7823] # Central Galleria, Third Floor
            },
            "floor": 3,
            "unit": "D-08",
            "rating": 4.3,
            "hours": "10:00 AM - 9:30 PM"
        }
    ]
    
    await db.tenants.insert_many(tenants)
    print("Seeded tenants list.")
    
    # 2. Insert Inventory Items
    inventory = [
        {
            "_id": "SKU-ZARA-BLAZER-BLU",
            "store_id": "tenant-zara",
            "product_name": "Premium Indigo Blazer",
            "description": "Tailored slim-fit linen blazer in deep navy blue, ideal for formal business casual look under hot conditions.",
            "price": 189.00,
            "category": "Apparel",
            "variants": [
                {"size": "S", "stock_level": 2},
                {"size": "M", "stock_level": 4},
                {"size": "L", "stock_level": 6},
                {"size": "XL", "stock_level": 1}
            ]
        },
        {
            "_id": "SKU-NIKE-PGA-SHIRT",
            "store_id": "tenant-nike",
            "product_name": "Vapor Dry-Fit Polo",
            "description": "Ultra-breathable athletic golf shirt in ocean blue with sweat-wicking knit texture.",
            "price": 65.00,
            "category": "Sportswear",
            "variants": [
                {"size": "M", "stock_level": 8},
                {"size": "L", "stock_level": 12},
                {"size": "XL", "stock_level": 0} # Out of stock variant
            ]
        },
        {
            "_id": "SKU-APPLE-IPAD-AIR",
            "store_id": "tenant-apple",
            "product_name": "iPad Pro 11-inch M4",
            "description": "Next-generation OLED display tablet with powerful spatial computer capabilities and raw hardware power.",
            "price": 999.00,
            "category": "Electronics",
            "variants": [
                {"size": "256G", "stock_level": 10},
                {"size": "512G", "stock_level": 3}
            ]
        },
        {
            "_id": "SKU-HM-OVERSHIRT-OAK",
            "store_id": "tenant-hm",
            "product_name": "Autumn Heavy Overshirt",
            "description": "Casual flannel check overshirt in warm khaki and dark timber oak brown colors.",
            "price": 49.99,
            "category": "Apparel",
            "variants": [
                {"size": "S", "stock_level": 5},
                {"size": "M", "stock_level": 9},
                {"size": "L", "stock_level": 0}
            ]
        }
    ]
    
    await db.inventory.insert_many(inventory)
    print("Seeded product inventory list.")
    
    # Create required 2dsphere indexes mapping location parameters
    await db.tenants.create_index([("location", "2dsphere")])
    await db.inventory.create_index([("store_id", 1), ("price", 1)])
    await db.reservations.create_index([("expires_at", 1)], expireAfterSeconds=0)
    
    print("Database seeding completed.")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
