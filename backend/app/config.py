from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mongodb_uri: str
    database_name: str = "complaint_system"
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    # Comma-separated list of allowed CORS origins, e.g.:
    # "http://localhost:5174,https://your-app.vercel.app"
    frontend_origin: str = "http://localhost:5174"

    @property
    def allowed_origins(self) -> list[str]:
        """Split the comma-separated string into a list for CORS middleware."""
        return [o.strip() for o in self.frontend_origin.split(",") if o.strip()]

    class Config:
        env_file = ".env"


settings = Settings()
