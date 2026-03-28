from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    MONGODB_URI: str = ""
    JWT_SECRET: str = "learnix-super-secret-jwt-key-2024"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_HOURS: int = 24
    GROQ_API_KEY: str = ""
    FRONTEND_URL: str = "http://localhost:3001"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
