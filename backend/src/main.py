import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ...backend.src.core.config import settings
from ...backend.src.core.logger import logger
from ...backend.src.db.mongodb import db
from ...backend.src.api.routes.routes import router as api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="MallPulse: Unified Multi-Tenant Mall Fulfillment Engine"
)

# Configure CORS for React PWA frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def startup_db_client():
    logger.info("Starting up MallPulse API Backend server")
    await db.connect()

@app.on_event("shutdown")
async def shutdown_db_client():
    logger.info("Stopping MallPulse API Backend server")
    await db.disconnect()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
