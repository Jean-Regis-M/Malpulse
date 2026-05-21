import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MallPulse"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # MongoDB settings
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "mallpulse")
    
    # Gemini API key
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # MCP Server configuration
    MCP_PORT: int = int(os.getenv("MCP_PORT", "8080"))
    MCP_HOST: str = os.getenv("MCP_HOST", "0.0.0.0")
    
    # Redis configuration for cache / sessions
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")

    class Config:
        case_sensitive = True

settings = Settings()

