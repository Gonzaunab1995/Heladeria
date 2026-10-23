from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./icecream.db"
    oracle_wallet_dir: str = ""
    oracle_wallet_password: str = ""

    jwt_secret: str = "dev-secret"
    access_minutes: int = 30
    refresh_days: int = 7

    cors_origins: str = "http://localhost:5173"
    frontend_url: str = "http://localhost:5173"
    backend_url: str = "http://localhost:8000"

    mp_access_token: str = ""
    mp_currency: str = "ARS"
    admin_emails: str = ""
    ice_cream_price: float = 5000
    max_flavors: int = 4


    @property
    def admin_email_list(self) -> list[str]:
        return [e.strip().lower() for e in self.admin_emails.split(",") if e.strip()]


settings = Settings()
