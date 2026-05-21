from motor.motor_asyncio import AsyncIOMotorClient
from ...backend.src.core.config import settings
from ...backend.src.core.logger import logger

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

    async def connect(self):
        logger.info(f"Connecting to MongoDB at {settings.MONGODB_URL}")
        self.client = AsyncIOMotorClient(settings.MONGODB_URL)
        self.db = self.client[settings.DATABASE_NAME]
        await self.create_indexes()

    async def disconnect(self):
        if self.client:
            self.client.close()
            logger.info("Closed MongoDB connection")

    async def create_indexes(self):
        logger.info("Creating MongoDB Indexes and Validation Rules...")
        
        # 1. 2dsphere index on tenant locations for geospatial search
        await self.db.tenants.create_index([("location", "2dsphere")])
        
        # 2. Compound filter index on price range inside target locations
        await self.db.inventory.create_index([("store_id", 1), ("price", 1)])
        
        # 3. TTL Reservation expiration index (15 min / 900 seconds)
        await self.db.reservations.create_index(
            [("expires_at", 1)], 
            expireAfterSeconds=0
        )
        
        # 4. Compound session locator index
        await self.db.sessions_and_memory.create_index(
            [("user_id", 1), ("_id", -1)]
        )
        
        logger.info("MongoDB index definitions successfully applied.")

db = MongoDB()

