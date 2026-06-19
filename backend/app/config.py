from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mongodb_uri: str
    database_name: str = "complaint_system"
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    frontend_origin: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


settings = Settings()